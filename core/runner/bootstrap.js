"use strict";
/**
 * core/runner/bootstrap.js
 * ─────────────────────────
 * Project workspace bootstrapping — running `create-next-app` or `create-vite`
 * to create a real, runnable scaffold before FORGE fills it with custom code.
 *
 * This prevents FORGE from having to generate boilerplate (package.json, tsconfig,
 * Next.js config, etc.) which it often gets wrong.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { PROJECTS_DIR } = require("./config");
const { commandExists, summarizeExecutionOutput } = require("./checks");

// ─── Gitignore scaffolding ────────────────────────────────────────────────────

/**
 * Return sensible `.gitignore` content for a given stack.
 *
 * @param {string} [stack=""]
 * @returns {string}
 */
function scaffoldGitignore(stack = "") {
  const s = String(stack || "").toLowerCase();
  const common = [".DS_Store", "*.log", ".env", ".env.local", ""];

  if (s.includes("next")) {
    return [
      ...common,
      "node_modules/",
      ".next/",
      "out/",
      "coverage/",
      ".turbo/",
    ].join("\n");
  }
  if (
    s.includes("react") ||
    s.includes("vite") ||
    s.includes("node") ||
    s.includes("javascript") ||
    s.includes("typescript")
  ) {
    return [...common, "node_modules/", "dist/", "build/", "coverage/"].join(
      "\n",
    );
  }
  if (s.includes("python")) {
    return [
      ...common,
      "__pycache__/",
      "*.pyc",
      ".pytest_cache/",
      ".venv/",
      "venv/",
    ].join("\n");
  }

  return [
    ...common,
    "node_modules/",
    "dist/",
    "build/",
    "__pycache__/",
    "*.pyc",
  ].join("\n");
}

/**
 * Ensure the workspace has a `.gitignore`.  Creates one if absent.
 *
 * @param {string} projectName
 * @param {string} [stack=""]
 */
function ensureWorkspaceScaffold(projectName, stack = "") {
  const root = path.join(PROJECTS_DIR, projectName, "workspace");
  fs.mkdirSync(root, { recursive: true });
  const gitignorePath = path.join(root, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, scaffoldGitignore(stack));
  }
}

// ─── Template Detection ───────────────────────────────────────────────────────

/**
 * Infer which bootstrap template to use from a project's status and README text.
 * Default is "nextjs" per Hive Mind's web-only mandate.
 *
 * @param {object} [status={}]
 * @param {string} [readme=""]
 * @returns {"nextjs"|"react-vite"}
 */
function inferBootstrapTemplate(status = {}, readme = "") {
  const raw =
    `${status.preferredStack || ""} ${status.template || ""} ${readme || ""}`.toLowerCase();

  if (
    raw.includes("next.js") ||
    raw.includes("nextjs") ||
    raw.includes("nextjs-starter")
  ) {
    return "nextjs";
  }
  if (
    raw.includes("react") ||
    raw.includes("vite") ||
    raw.includes("react-vite")
  ) {
    return "react-vite";
  }

  // Default: Next.js (Hive Mind's mandated standard)
  return "nextjs";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recursively copy a directory (excluding `.git`) from `src` to `dest`.
 *
 * @param {string} src
 * @param {string} dest
 */
function copyDirContents(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name === ".git") continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) {
      copyDirContents(from, to);
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
}

// ─── Bootstrap entry point ────────────────────────────────────────────────────

/**
 * Ensure the project workspace is bootstrapped with a real framework scaffold.
 * Uses `create-next-app` or `create-vite` depending on the detected template.
 * Falls back gracefully if `npx` is not available.
 *
 * @param {string} projectName
 * @param {object} [status={}]
 * @param {string} [readme=""]
 * @returns {{ ok: boolean, template: string, notes: string[] }}
 */
function ensureProjectBootstrap(projectName, status = {}, readme = "") {
  const root = path.join(PROJECTS_DIR, projectName, "workspace");
  fs.mkdirSync(root, { recursive: true });

  const packageJson = path.join(root, "package.json");
  const template = inferBootstrapTemplate(status, readme);
  const notes = [];

  // ── Next.js via create-next-app ───────────────────────────────────────────
  if (template === "nextjs" && !fs.existsSync(packageJson)) {
    if (!commandExists("npx")) {
      return {
        ok: false,
        template,
        notes: ["npx not installed; falling back to manual FORGE generation."],
      };
    }

    const tmp = path.join(PROJECTS_DIR, projectName, ".bootstrap-next");
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {}

    const run = spawnSync(
      "npx",
      [
        "create-next-app@latest",
        tmp,
        "--ts",
        "--tailwind",
        "--eslint",
        "--app",
        "--src-dir",
        "--use-npm",
        "--yes",
      ],
      { encoding: "utf8", timeout: 420000 },
    );

    if (run.status === 0) {
      copyDirContents(tmp, root);
      notes.push("Bootstrapped Next.js via create-next-app.");
    } else {
      notes.push(
        `create-next-app failed: ${summarizeExecutionOutput(`${run.stdout || ""}\n${run.stderr || ""}`)}`,
      );
    }
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {}
    return { ok: fs.existsSync(packageJson), template, notes };
  }

  // ── React + Vite via create-vite ──────────────────────────────────────────
  if (template === "react-vite" && !fs.existsSync(packageJson)) {
    if (!commandExists("npx")) {
      return {
        ok: false,
        template,
        notes: ["npx not installed; falling back to manual FORGE generation."],
      };
    }

    const tmp = path.join(PROJECTS_DIR, projectName, ".bootstrap-react");
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {}

    const run = spawnSync(
      "npx",
      ["create-vite@latest", tmp, "--template", "react-ts"],
      { encoding: "utf8", timeout: 240000 },
    );

    if (run.status === 0) {
      copyDirContents(tmp, root);
      notes.push("Bootstrapped React+Vite via create-vite.");
    } else {
      notes.push(
        `create-vite failed: ${summarizeExecutionOutput(`${run.stdout || ""}\n${run.stderr || ""}`)}`,
      );
    }
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {}
    return { ok: fs.existsSync(packageJson), template, notes };
  }

  return { ok: true, template, notes: ["Bootstrap already present."] };
}

module.exports = {
  scaffoldGitignore,
  ensureWorkspaceScaffold,
  inferBootstrapTemplate,
  copyDirContents,
  ensureProjectBootstrap,
};
