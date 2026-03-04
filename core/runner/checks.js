"use strict";
/**
 * core/runner/checks.js
 * ──────────────────────
 * Automated quality gates for generated project workspaces.
 *
 *  - runWorkspaceChecks  → validates syntax for JS, JSON, JSX/TSX, and Python
 *  - runProjectTests     → runs `npm test` (after `npm install`) inside the workspace
 *  - sanitizeWorkspacePackageJson → fixes known-bad generated dependency versions
 *  - commandExists       → checks whether a CLI tool is on the PATH
 *  - summarizeExecutionOutput → compresses long command output to a few lines
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { PROJECTS_DIR } = require("./config");
const { listWorkspaceFiles } = require("./workspace");

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Trim a long command output to the first `maxLines` non-empty lines,
 * joined by " | ".  Used in error messages and PULSE summaries.
 *
 * @param {string} [text=""]
 * @param {number} [maxLines=6]
 * @returns {string}
 */
function summarizeExecutionOutput(text = "", maxLines = 6) {
  const lines = String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, maxLines);
  return lines.length ? lines.join(" | ") : "No output.";
}

/**
 * Return true if the named CLI command is available on the system PATH.
 *
 * @param {string} cmd - Command name (e.g. "npx", "python3").
 * @returns {boolean}
 */
function commandExists(cmd) {
  const check = spawnSync("bash", ["-lc", `command -v ${cmd}`], {
    encoding: "utf8",
  });
  return check.status === 0;
}

// ─── Workspace Syntax Checks ──────────────────────────────────────────────────

/**
 * Validate the syntax of every supported file in a project's workspace.
 * Runs after FORGE writes files and before LENS does its review.
 *
 * Supported file types and their check method:
 *   .js / .mjs / .cjs → `node --check`
 *   .json             → JSON.parse()
 *   .jsx / .tsx / .ts → brace-mismatch heuristic (no transpiler needed)
 *   .py               → `python3 -m py_compile`
 *
 * @param {string} projectName
 * @returns {{ checked: number, passed: number, failed: number, report: string }}
 */
function runWorkspaceChecks(projectName) {
  const root = path.join(PROJECTS_DIR, projectName, "workspace");
  if (!fs.existsSync(root)) {
    return {
      checked: 0,
      passed: 0,
      failed: 0,
      report: "No workspace to validate.",
    };
  }

  const files = listWorkspaceFiles(projectName);
  let checked = 0,
    passed = 0,
    failed = 0;
  const reportLines = [];

  for (const rel of files) {
    const full = path.join(root, rel);

    // ── JavaScript / MJS / CJS ──────────────────────────────────────────────
    if (/\.(js|mjs|cjs)$/i.test(rel)) {
      checked++;
      const run = spawnSync("node", ["--check", full], {
        encoding: "utf8",
        timeout: 20000,
      });
      if (run.status === 0) {
        passed++;
      } else {
        failed++;
        const err = (run.stderr || run.stdout || "").trim();
        reportLines.push(
          `[FAIL] node --check ${rel}\n${err}\nFix hint: Check for missing brackets, semicolons, or import errors.`,
        );
      }
      continue;
    }

    // ── JSON ────────────────────────────────────────────────────────────────
    if (/\.json$/i.test(rel)) {
      checked++;
      try {
        JSON.parse(fs.readFileSync(full, "utf8"));
        passed++;
      } catch (e) {
        failed++;
        reportLines.push(
          `[FAIL] JSON.parse ${rel}\n${e.message}\nFix hint: Check for trailing commas, missing quotes, or unescaped characters.`,
        );
      }
      continue;
    }

    // ── JSX / TSX / TS (brace-mismatch heuristic) ───────────────────────────
    if (/\.(jsx|tsx|ts)$/i.test(rel)) {
      checked++;
      try {
        const content = fs.readFileSync(full, "utf8");
        const opens = (content.match(/\{/g) || []).length;
        const closes = (content.match(/\}/g) || []).length;
        if (Math.abs(opens - closes) > 2) {
          failed++;
          reportLines.push(
            `[FAIL] Brace mismatch in ${rel}: ${opens} open vs ${closes} close braces.\nFix hint: Check for missing or extra { } brackets.`,
          );
        } else {
          passed++;
        }
      } catch (e) {
        failed++;
        reportLines.push(`[FAIL] Cannot read ${rel}: ${e.message}`);
      }
      continue;
    }

    // ── Python ──────────────────────────────────────────────────────────────
    if (/\.py$/i.test(rel)) {
      checked++;
      const run = spawnSync("python3", ["-m", "py_compile", full], {
        encoding: "utf8",
        timeout: 20000,
      });
      if (run.status === 0) {
        passed++;
      } else {
        failed++;
        reportLines.push(
          `[FAIL] python3 -m py_compile ${rel}\n${(run.stderr || run.stdout || "").trim()}`,
        );
      }
    }
  }

  const summary = `Checked=${checked} Passed=${passed} Failed=${failed}`;
  return {
    checked,
    passed,
    failed,
    report: `${summary}\n${reportLines.join("\n\n")}`.trim(),
  };
}

// ─── Package.json Sanitisation ────────────────────────────────────────────────

/**
 * Fix known-invalid generated dependency versions in a workspace's package.json.
 * Also ensures a `test` npm script is present (so `npm test` doesn't explode).
 *
 * @param {string} workspaceRoot - Absolute path to the workspace directory.
 */
function sanitizeWorkspacePackageJson(workspaceRoot) {
  const pkgPath = path.join(workspaceRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return;

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return;
  }

  let changed = false;

  // Known bad → correct version mappings
  const fixes = {
    "@tailwindcss/aspect-ratio": "^0.4.2",
    "@tailwindcss/line-clamp": "^0.4.4",
    "dep-graph": "^1.1.0",
  };
  // Packages that should be removed entirely if present
  const removeIfPresent = ["@types/next"];

  for (const depKey of ["dependencies", "devDependencies"]) {
    const deps = pkg[depKey];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, validVersion] of Object.entries(fixes)) {
      if (typeof deps[name] === "string" && deps[name] !== validVersion) {
        deps[name] = validVersion;
        changed = true;
      }
    }
    for (const name of removeIfPresent) {
      if (Object.prototype.hasOwnProperty.call(deps, name)) {
        delete deps[name];
        changed = true;
      }
    }
  }

  // Ensure a test script is present so PULSE's `npm test` doesn't error
  if (!pkg.scripts) pkg.scripts = {};
  if (
    !pkg.scripts.test ||
    pkg.scripts.test.includes("Error: no test specified")
  ) {
    pkg.scripts.test = "echo 'No tests configured'";
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

/**
 * Run the test suite inside a project workspace.
 * Handles npm install (if node_modules is missing) then `npm test`.
 *
 * @param {string} projectName
 * @returns {{
 *   attempted: boolean,
 *   passed: boolean,
 *   summary: string,
 *   actionItems: string[],
 *   raw?: string
 * }}
 */
function runProjectTests(projectName) {
  const root = path.join(PROJECTS_DIR, projectName, "workspace");
  if (!fs.existsSync(root)) {
    return {
      attempted: false,
      passed: false,
      summary: "No workspace found.",
      actionItems: [
        "Workspace missing; FORGE must generate project files first.",
      ],
      raw: "",
    };
  }

  const results = [];
  const pkgJson = path.join(root, "package.json");

  if (fs.existsSync(pkgJson)) {
    sanitizeWorkspacePackageJson(root);

    // Install dependencies if node_modules is absent
    if (!fs.existsSync(path.join(root, "node_modules"))) {
      const install = spawnSync("npm", ["install", "--no-fund", "--no-audit"], {
        cwd: root,
        encoding: "utf8",
        timeout: 240000,
      });
      if (install.status !== 0) {
        const installOutput =
          `${install.stdout || ""}\n${install.stderr || ""}`.trim();
        results.push({
          attempted: true,
          passed: false,
          summary: `npm install failed: ${summarizeExecutionOutput(installOutput)}`,
          raw: installOutput,
        });
      }
    }

    // Run tests only if install succeeded
    if (!results.length) {
      const run = spawnSync("npm", ["test", "--", "--watch=false"], {
        cwd: root,
        encoding: "utf8",
        timeout: 180000,
      });
      const output = `${run.stdout || ""}\n${run.stderr || ""}`.trim();
      results.push({
        attempted: true,
        passed: run.status === 0,
        summary:
          run.status === 0
            ? "npm test passed."
            : `npm test failed: ${summarizeExecutionOutput(output)}`,
        raw: output,
      });
    }
  }

  if (results.length === 0) {
    return {
      attempted: false,
      passed: true,
      summary: "No test runners found.",
      actionItems: [],
    };
  }

  const allPassed = results.every((r) => !r.attempted || r.passed);
  const aggregateSummary = results.map((r) => r.summary).join(" | ");
  const aggregateRaw = results
    .map((r) => `--- ${r.summary} ---\n${r.raw}`)
    .join("\n\n");

  const actionItems = [];
  results.forEach((r) => {
    if (!r.passed) {
      actionItems.push(`Fix issues in ${r.summary}`);
      actionItems.push(summarizeExecutionOutput(r.raw));
    }
  });

  return {
    attempted: true,
    passed: allPassed,
    summary: aggregateSummary,
    actionItems,
    raw: aggregateRaw,
  };
}

module.exports = {
  summarizeExecutionOutput,
  commandExists,
  runWorkspaceChecks,
  sanitizeWorkspacePackageJson,
  runProjectTests,
};
