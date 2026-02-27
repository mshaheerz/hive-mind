**File: `package.json`**
```json
{
  "name": "dependency-ghostbuster",
  "version": "1.0.0",
  "description": "Static analysis tool for detecting truly unused dependencies in monorepos",
  "main": "dist/main.js",
  "bin": {
    "ghostbuster": "dist/main.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "vitest run"
  },
  "keywords": [
    "dependency",
    "analysis",
    "monorepo",
    "unused-dependencies"
  ],
  "author": "NOVA",
  "license": "MIT",
  "devDependencies": {
    "@babel/parser": "^7.24.0",
    "@babel/traverse": "^7.24.0",
    "@types/node": "^20.11.0",
    "p-limit": "^4.0.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1",
    "globby": "^14.0.2"
  },
  "dependencies": {
    "p-limit": "^4.0.0"
  }
}
```

---

**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

---

**File: `src/config/constants.ts`**
```ts
/**
 * @fileoverview Global constants used across the project.
 *
 * These constants can be overridden by environment variables or a
 * configuration file in the future if needed.
 */

export const PACKAGE_JSON_GLOB = '**/package.json';
export const NODE_MODULES_IGNORE = '!**/node_modules/**';

export const SOURCE_GLOB = '**/*.{js,jsx,ts,tsx}';
export const DEFAULT_IGNORE_PATTERNS = [
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/build/**',
  '!**/coverage/**',
  '!**/tmp/**',
  '!**/generated/**'
];

export const TEST_FILE_REGEX = /\.(test|spec)\.[jt]sx?$/i;
export const TESTS_DIR_NAME = '__tests__';
```

---

**File: `src/scanner/index.ts`**
```ts
/**
 * @fileoverview Scanner – discovers every package in a monorepo and collects the
 * source files that belong to each package.
 *
 * The scanner works in three steps:
 * 1. Find all `package.json` files (excluding `node_modules`).
 * 2. Load the declared dependencies from each `package.json`.
 * 3. Collect all JavaScript/TypeScript source files for the package.
 *
 * The result is a `Map` keyed by the absolute package root directory and
 * containing a `PackageInfo` object.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import globby from 'globby';
import pLimit from 'p-limit';
import {
  PACKAGE_JSON_GLOB,
  NODE_MODULES_IGNORE,
  SOURCE_GLOB,
  DEFAULT_IGNORE_PATTERNS
} from '../config/constants.js';

export interface PackageInfo {
  /** Absolute path to the folder that contains the `package.json`. */
  root: string;
  /** All declared dependencies (runtime, dev and peer). */
  declaredDeps: Set<string>;
  /** Absolute paths of every source file that belongs to the package. */
  sourceFiles: string[];
}

/**
 * Returns a list of absolute paths to every `package.json` file under `repoRoot`.
 *
 * @param repoRoot Absolute path to the monorepo root.
 */
export async function findPackageJsonFiles(repoRoot: string): Promise<string[]> {
  try {
    return await globby([PACKAGE_JSON_GLOB, NODE_MODULES_IGNORE], {
      cwd: repoRoot,
      absolute: true,
    });
  } catch (err) {
    console.error('Failed to locate package.json files:', err);
    throw err;
  }
}

/**
 * Reads a `package.json` file and extracts all dependency names (runtime,
 * dev and peer). Returns a `Set` for fast lookup.
 *
 * @param pkgPath Absolute path to a `package.json`.
 */
export async function loadDeclaredDependencies(pkgPath: string): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(pkgPath, 'utf-8');
    let pkg: any;
    try {
      pkg = JSON.parse(raw);
    } catch (parseErr) {
      if (parseErr instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${pkgPath}: ${parseErr.message}`);
      }
      throw parseErr;
    }
    const runtime = Object.keys(pkg.dependencies ?? {});
    const dev = Object.keys(pkg.devDependencies ?? {});
    const peer = Object.keys(pkg.peerDependencies ?? {});
    return new Set([...runtime, ...dev, ...peer]);
  } catch (err) {
    console.error(`Unable to read or parse ${pkgPath}:`, err);
    throw err;
  }
}

/**
 * Returns every source file belonging to a package. Files inside `node_modules`,
 * `dist` or `build` are ignored.
 *
 * @param pkgRoot Absolute path to the folder that contains the `package.json`.
 */
export async function collectSourceFiles(pkgRoot: string): Promise<string[]> {
  try {
    return await globby([SOURCE_GLOB, ...DEFAULT_IGNORE_PATTERNS], {
      cwd: pkgRoot,
      absolute: true,
    });
  } catch (err) {
    console.error(`Failed to collect source files for ${pkgRoot}:`, err);
    throw err;
  }
}

/**
 * Scans the whole repository and builds a map of package root → `PackageInfo`.
 *
 * @param repoRoot Absolute path to the monorepo root.
 */
export async function scanRepository(repoRoot: string): Promise<Map<string, PackageInfo>> {
  const packages = new Map<string, PackageInfo>();
  const pkgJsonPaths = await findPackageJsonFiles(repoRoot);

  // Run per‑package work in parallel with a concurrency limit
  const limit = pLimit(8);
  const tasks = pkgJsonPaths.map((pkgJsonPath) =>
    limit(async () => {
      const pkgRoot = path.dirname(pkgJsonPath);
      const declaredDeps = await loadDeclaredDependencies(pkgJsonPath);
      const sourceFiles = await collectSourceFiles(pkgRoot);
      packages.set(pkgRoot, { root: pkgRoot, declaredDeps, sourceFiles });
    })
 