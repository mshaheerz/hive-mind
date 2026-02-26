**Implementation Overview**

The **Dependency Ghostbuster** scans a monorepo, parses every source file (including dynamic `import()` calls), builds a per‑package dependency graph and reports:

* **Unused deps** – listed in `package.json` but never imported.  
* **Test‑only deps** – imported only from files that match `*.test.*` or live under `__tests__`.  

The code is split into small, single‑responsibility modules, each with a top‑level comment, JSDoc, no magic numbers and full error handling.  

---

## 1. `package.json`

```json
{
  "name": "dependency-ghostbuster",
  "version": "1.0.0",
  "description": "Static analysis tool to find truly unused dependencies in a monorepo",
  "main": "dist/main.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "jest"
  },
  "dependencies": {
    "@babel/parser": "^7.24.5",
    "@babel/traverse": "^7.24.5",
    "dependency-graph": "^0.11.0",
    "globby": "^13.2.2"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.30",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.3"
  }
}
```

*Key dependencies*  

| Package | Reason |
|---------|--------|
| `@babel/parser` + `@babel/traverse` | Parse both static `import` statements and dynamic `import()` calls. |
| `dependency-graph` | Simple directed‑graph implementation for analysing dependency usage. |
| `globby` | Fast, glob‑based file discovery (respects ignore patterns). |
| `jest` / `ts-jest` | Unit‑test framework (tests are stubbed in the repo). |
| `typescript` | Source language. |

---

## 2. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

---

## 3. Source Files  

### 3.1 `src/scanner/index.ts`

```ts
/**
 * @fileoverview Scanner entry point – discovers source files for each package in the monorepo.
 *
 * The scanner walks the repository root, finds every `package.json`, then uses `globby`
 * to collect `.js`, `.jsx`, `.ts`, `.tsx` files belonging to that package.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import globby from 'globby';
import { parseFile } from '../parser/index.js';

export interface PackageInfo {
  /** Absolute path to the folder containing `package.json`. */
  root: string;
  /** List of declared dependencies (including dev & peer). */
  declaredDeps: Set<string>;
  /** All source files (absolute paths) belonging to the package. */
  sourceFiles: string[];
}

/**
 * Recursively finds all `package.json` files under `repoRoot` (excluding node_modules).
 *
 * @param repoRoot Absolute path to the monorepo root.
 * @returns Array of absolute paths to each `package.json`.
 */
export async function findPackageJsonFiles(repoRoot: string): Promise<string[]> {
  try {
    const patterns = ['**/package.json', '!**/node_modules/**'];
    return await globby(patterns, { cwd: repoRoot, absolute: true });
  } catch (err) {
    console.error('Error while searching for package.json files:', err);
    throw err;
  }
}

/**
 * Loads a `package.json` and extracts its dependencies.
 *
 * @param pkgPath Absolute path to a `package.json`.
 * @returns Set of dependency names (including dev & peer).
 */
export async function loadDeclaredDependencies(pkgPath: string): Promise<Set<string>> {
  try {
    const content = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    const deps = Object.keys(pkg.dependencies || {});
    const dev = Object.keys(pkg.devDependencies || {});
    const peer = Object.keys(pkg.peerDependencies || {});
    return new Set([...deps, ...dev, ...peer]);
  } catch (err) {
    console.error(`Failed to read or parse ${pkgPath}:`, err);
    throw err;
  }
}

/**
 * Gathers all source files for a given package root.
 *
 * @param pkgRoot Absolute path to the folder containing `package.json`.
 * @returns Array of absolute file paths.
 */
export async function collectSourceFiles(pkgRoot: string): Promise<string[]> {
  try {
    const patterns = [
      '**/*.{js,jsx,ts,tsx}',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/build/**'
    ];
    return await globby(patterns, { cwd: pkgRoot, absolute: true });
  } catch (err) {
    console.error(`Failed to collect source files in ${pkgRoot}:`, err);
    throw err;
  }
}

/**
 * Scans the whole repository and returns a map of package root → PackageInfo.
 *
 * @param repoRoot Absolute path to the monorepo root.
 * @returns Map where key = package root, value = PackageInfo.
 */
export async function scanRepository(repoRoot: string): Promise<Map<string, PackageInfo>> {
  const result = new Map<string, PackageInfo>();
  const pkgJsonPaths = await findPackageJsonFiles(repoRoot);

  for (const pkgJsonPath of pkgJsonPaths) {
    const pkgRoot = path.dirname(pkgJsonPath);
    const declaredDeps = await loadDeclaredDependencies(pkgJsonPath);
    const sourceFiles = await collectSourceFiles(pkgRoot);
    result.set(pkgRoot, { root: pkgRoot, declaredDeps, sourceFiles });
  }

  return result;
}
```

---

### 3.2 `src/parser/index.ts`

```ts
/**
 * @fileoverview Parses a JavaScript/TypeScript file and extracts all imported module specifiers.
 *
 * Supports:
 *  - Static `import ... from 'module'`
 *  - CommonJS `require('module')`
 *  - Dynamic `import('module')`
 *
 * Returns a Set of raw specifiers (e.g., `'lodash'`, `'./utils'`).
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { readFile } from 'node:fs/promises';
import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

/**
 * Parses a file and returns all imported module specifiers.
 *
 * @param filePath Absolute path to the file.
 * @returns Set of module specifiers used in the file.
 */
export async function parseFile(filePath: string): Promise<Set<string>> {
  const imports = new Set<string>();

  try {
    const code = await readFile(filePath, 'utf-8');

    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'typescript',
        'jsx',
        'dynamicImport',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator'
      ]
    });

    traverse(ast, {
     