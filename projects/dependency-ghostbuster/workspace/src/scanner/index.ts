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
