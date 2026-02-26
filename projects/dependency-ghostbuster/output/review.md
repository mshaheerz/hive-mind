**VERDICT:** **NEEDS_CHANGES**

The core idea is solid and the code is well‑structured, but there are several **critical** problems that must be fixed before the tool can be considered production‑ready, plus a handful of **warnings** and **suggestions** to improve quality, performance, and safety.

---

## CRITICAL ISSUES (must fix before merge)

| # | Issue | Why it’s a problem | How to fix |
|---|-------|--------------------|------------|
| 1 | **`parseFile` does not handle syntax‑errors or non‑literal dynamic imports** | A single malformed file will cause the whole scan to abort (`@babel/parser` throws). Dynamic imports like `import(`./${name}`)` will be added as a raw node and later be interpreted as a dependency that does not exist. | Wrap the `parse` call in a `try/catch`. On parse error, log the file path and continue (or optionally collect a list of “unparsable” files). When traversing, check that the argument of `ImportExpression` / `CallExpression(require)` is a `StringLiteral` before adding it to the set. |
| 2 | **Sequential processing of packages/files** – `scanRepository` (and any later per‑file parsing) runs in a **for‑loop** awaiting each step. In a monorepo with dozens of packages and thousands of files this becomes a major performance bottleneck. | Slow CI runs, unnecessary CPU idle time, can hit time‑outs on large repos. | Use `Promise.all` (or a limited‑concurrency pool such as `p-limit`) for `loadDeclaredDependencies`, `collectSourceFiles`, and later `parseFile` calls. Example: `await Promise.all(pkgJsonPaths.map(async p => { … }))`. |
| 3 | **No respect for `.gitignore` / workspace ignore patterns** | The scanner may waste time parsing generated files, lock files, or vendored code that should be ignored, and could even surface false‑positive “unused” deps. | Pass `gitignore: true` (or `ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']`) to `globby`, or read the repo’s `.gitignore` via `globby`’s `gitignore` option. |
| 4 | **Root `package.json` (workspace definition) is treated as a regular package** | The root often only contains workspace config and no source files; treating it as a package can produce a huge `declaredDeps` set that skews results. | Detect if a `package.json` has a `"workspaces"` field (or is the repo root) and skip it, or handle it specially. |
| 5 | **Missing unit / integration tests** | No automated verification that the scanner correctly identifies unused, test‑only, or dynamic imports. Without tests regressions will go unnoticed. | Add Jest tests for: <br>• `findPackageJsonFiles` respects ignore patterns.<br>• `loadDeclaredDependencies` returns the right set for various `package.json` shapes.<br>• `collectSourceFiles` excludes `node_modules`/`dist`.<br>• `parseFile` correctly extracts static, require, and literal dynamic imports, and ignores non‑literal ones.<br>• End‑to‑end scan on a tiny fixture monorepo. |
| 6 | **Potential unhandled promise rejections** – the top‑level `scanRepository` does not catch errors from the inner async calls when used from a CLI entry point. | If any single package fails, the whole process crashes with an unhandled rejection, which is a poor UX. | Export a `runScanner` wrapper that catches and logs errors, returning a proper exit code. |

---

## WARNINGS (should fix)

| # | Issue | Why it matters | Suggested fix |
|---|-------|----------------|----------------|
| W1 | **Logging directly to `console.error`** inside library functions makes it hard for callers to control output (e.g., redirect to a logger). | Reduces composability and testability. | Accept an optional `logger` object (`{ error: (msg)=>void }`) or use a minimal wrapper that defaults to `console`. |
| W2 | **`collectSourceFiles` pattern excludes only `node_modules`, `dist`, `build`.** It may still pick up lock files, `.d.ts` files, or generated files (`*.generated.ts`). | Generates noise and false‑positives. | Add patterns like `!**/*.d.ts`, `!**/*.test.*` (if you want to treat test files separately) or make the ignore list configurable. |
| W3 | **`declaredDeps` includes `peerDependencies`** – peers are not installed by the package itself and should not be considered for “unused” detection. | May incorrectly flag a peer as unused. | Either drop `peerDependencies` from the set or handle them separately with a clear comment. |
| W4 | **No explicit type for the map value** – `Map<string, PackageInfo>` is fine, but the `PackageInfo` interface could also expose a `sourceFiles: ReadonlyArray<string>` to prevent accidental mutation downstream. | Improves immutability guarantees. | Change `sourceFiles: string[]` to `readonly sourceFiles: string[]`. |
| W5 | **Missing JSDoc for the exported `scanRepository`** – the comment stops before the function. | Documentation inconsistency. | Add a full JSDoc block describing return value, error behaviour, and side‑effects. |

---

## SUGGESTIONS (optional improvements)

| # | Idea | Benefit |
|---|------|---------|
| S1 | **Add a CLI entry point (`bin/ghostbuster.js`)** that parses `process.argv`, resolves the repo root (default `process.cwd()`), and prints a nicely formatted JSON or table. | Makes the tool immediately usable by developers. |
|