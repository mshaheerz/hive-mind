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

export interface PackageInfo {
  /** Absolute path to the folder that contains the `package.json`. */
  root: string;
  /** All declared dependencies (runtime, dev and peer). */
  declaredDeps: Set<string>;
  /** Absolute paths of every source file that belongs to the package. */
  sourceFiles: string[];
}

/**
 * Glob pattern that matches every `package.json` file in the repository,
 * while ignoring `node_modules`.
 */
const PACKAGE_JSON_GLOB = '**/package.json';
const NODE_MODULES_IGNORE = '!**/node_modules/**';

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
    const raw = await fs.readFile(pkgPath, 'utf‑8');
    const pkg = JSON.parse(raw);
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
  const SOURCE_GLOB = '**/*.{js,jsx,ts,tsx}';
  const IGNORE_PATTERNS = [
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
  ];

  try {
    return await globby([SOURCE_GLOB, ...IGNORE_PATTERNS], {
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
  for (const pkgJsonPath of pkgJsonPaths) {
    const pkgRoot = path.dirname(pkgJsonPath);
    const declaredDeps = await loadDeclaredDependencies(pkgJsonPath);
    const sourceFiles = await collectSourceFiles(pkgRoot);
    packages.set(pkgRoot, { root: pkgRoot, declaredDeps, sourceFiles });
  }

  return packages;
}
```

---

**File: `src/parser/index.ts`**

```ts
/**
 * @fileoverview Parser – extracts every module specifier used in a file.
 *
 * Supported import styles:
 *   • ES6 static `import … from 'module'`
 *   • CommonJS `require('module')`
 *   • Dynamic `import('module')`
 *
 * The function returns a `Set` of raw specifiers (e.g. `'lodash'`,
 * `'../utils'`). Relative specifiers are kept as‑is; the caller decides
 * whether they refer to a workspace package or an external dependency.
 */

import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type * as t from '@babel/types';

/**
 * Parses a file and extracts all imported module specifiers.
 *
 * @param filePath Absolute path to the file to analyse.
 * @returns Set of module specifiers found in the file.
 */
export async function parseFile(filePath: string): Promise<Set<string>> {
  const imports = new Set<string>();

  try {
    const code = await readFile(filePath, 'utf‑8');

    const ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: [
        'typescript',
        'jsx',
        'dynamicImport',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    });

    // Walk the AST and collect import specifiers.
    traverse(ast, {
      // import foo from 'module';
      ImportDeclaration(path) {
        const source = path.node.source.value;
        imports.add(source);
      },

      // const foo = require('module');
      CallExpression(path) {
        const callee = path.node.callee as t.Expression;
        // Detect require('module')
        if (
          t.isIdentifier(callee) &&
          callee.name === 'require' &&
          path.node.arguments.length === 1
        ) {
          const arg = path.node.arguments[0];
          if (t.isStringLiteral(arg)) {
            imports.add(arg.value);
          }
        }

        // Detect import('module')
        if (t.isImport(callee) && path.node.arguments.length === 1) {
          const arg = path.node.arguments[0];
          if (t.isStringLiteral(arg)) {
            imports.add(arg.value);
          }
        }
      },
    });
  } catch (err) {
    console.error(`Failed to parse ${filePath}:`, err);
    // Propagate the error so the caller can decide whether to abort or continue.
    throw err;
  }

  return imports;
}
```

---

**File: `src/analysis/index.ts`**

```ts
/**
 * @fileoverview Core analysis – maps each package's declared dependencies
 * against the imports that actually appear in its source files.
 *
 * The analysis distinguishes three groups:
 *   • `usedDeps` – dependencies imported somewhere in the package.
 *   • `testOnlyDeps` – dependencies that appear **only** in test files.
 *   • `unusedDeps` – declared dependencies that never appear.
 *
 * Test files are identified by:
 *   • filename matches `*.test.*` or `*.spec.*`
 *   • file resides under a `__tests__` directory.
 */

import path from 'node:path';
import { parseFile } from '../parser/index.js';
import type { PackageInfo } from '../scanner/index.js';

/** RegExp that matches typical test file names. */
const TEST_FILE_REGEX = /\.(test|spec)\.[jt]sx?$/i;

/** Name of the folder conventionally used for tests. */
const TESTS_DIR_NAME = '__tests__';

/**
 * Result of analysing a single package.
 */
export interface PackageAnalysis {
  /** Package root directory (absolute). */
  root: string;
  /** Declared dependencies (as read from package.json). */
  declaredDeps: Set<string>;
  /** Dependencies that are actually used somewhere in the package. */
  usedDeps: Set<string>;
  /**