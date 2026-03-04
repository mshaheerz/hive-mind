"use strict";
/**
 * core/runner/workspace.js
 * ─────────────────────────
 * All file-system operations for project workspaces:
 *   - Listing workspace files (respecting ignore rules)
 *   - Parsing FORGE output into file-path/content pairs
 *   - Writing ("materialising") those file pairs to disk
 *   - Cleaning up bogus/artefact files that LLMs occasionally emit
 *   - Path safety validation
 */

const fs = require("fs");
const path = require("path");
const { PROJECTS_DIR } = require("./config");

// ─── Path Guards ──────────────────────────────────────────────────────────────

/**
 * Return true if a workspace-relative path should be completely skipped
 * during file listing (compiled output, lock files, caches, etc.).
 *
 * @param {string} [relPath=""]
 * @returns {boolean}
 */
function shouldIgnoreWorkspacePath(relPath = "") {
  const p = String(relPath || "").replace(/\\/g, "/");
  return (
    p.startsWith("node_modules/") ||
    p.startsWith(".next/") ||
    p.startsWith("dist/") ||
    p.startsWith("build/") ||
    p.startsWith(".turbo/") ||
    p.startsWith(".git/") ||
    p.startsWith("__pycache__/") ||
    p.includes("/__pycache__/") ||
    p.endsWith(".pyc") ||
    p.endsWith(".pyo") ||
    p === "package-lock.json" ||
    p === "yarn.lock" ||
    p === "pnpm-lock.yaml" ||
    p.startsWith(".venv/") ||
    p.startsWith("venv/") ||
    p.startsWith(".pytest_cache/") ||
    p.startsWith("coverage/") ||
    p.startsWith(".mypy_cache/")
  );
}

/**
 * Return true if the path looks like a bogus artefact emitted by an LLM
 * (e.g. a bare word like "implementation" instead of a real file path).
 *
 * @param {string} [relPath=""]
 * @returns {boolean}
 */
function isBogusGeneratedPath(relPath = "") {
  const p = String(relPath || "").trim();
  if (!p) return true;

  // Hard flags: obvious LLM markdown artefacts
  if (/^(?:\d+\.\s*)?File:\s*$/i.test(p)) return true;
  if (/^(?:\d+\.\s*)?#?\s*File:\s*$/i.test(p)) return true;
  if (/^#\s*File:\s*$/i.test(p)) return true;

  // Real file paths have either a dot (extension) or a slash (nested directory)
  if (p.includes(".")) return false;
  if (p.includes("/")) return false;

  // Single-word section titles that LLMs emit as if they were filenames
  const trashWords = [
    "implementation",
    "architecture",
    "setup",
    "instruction",
    "requirement",
    "overview",
    "evaluation",
    "discovery",
    "feasibility",
    "context",
    "contract",
    "rationale",
    "summary",
    "findings",
    "risk",
    "value",
    "outcome",
    "logic",
    "goal",
    "note",
  ];
  const lower = p.toLowerCase();
  if (
    trashWords.some(
      (t) =>
        lower === t ||
        lower.includes(`${t} details`) ||
        lower.includes(`${t} notes`),
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Resolve a workspace-relative path to its absolute path, enforcing that the
 * resolved path stays inside the workspace root (path-traversal prevention).
 *
 * @param {string} projectName
 * @param {string} relPath
 * @returns {string|null} Absolute path, or null if the path is unsafe.
 */
function safeWorkspacePath(projectName, relPath) {
  const clean = String(relPath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim();
  if (!clean || clean.includes("..")) return null;
  const root = path.join(PROJECTS_DIR, projectName, "workspace");
  const full = path.resolve(root, clean);
  if (!full.startsWith(root + path.sep) && full !== root) return null;
  return full;
}

// ─── File Listing ─────────────────────────────────────────────────────────────

/**
 * Recursively list all meaningful workspace files for a project.
 * Respects `shouldIgnoreWorkspacePath` and `isBogusGeneratedPath`.
 *
 * @param {string} projectName
 * @returns {string[]} Workspace-relative paths.
 */
function listWorkspaceFiles(projectName) {
  const root = path.join(PROJECTS_DIR, projectName, "workspace");
  if (!fs.existsSync(root)) return [];
  const out = [];

  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      const rel = path.relative(root, full).replace(/\\/g, "/");
      if (shouldIgnoreWorkspacePath(rel)) continue;
      if (st.isDirectory()) walk(full);
      else if (!isBogusGeneratedPath(rel)) out.push(rel);
    }
  };

  walk(root);
  return out;
}

/**
 * Return true if the workspace contains at least one non-markdown source file.
 * Used to decide whether FORGE needs to generate from scratch.
 *
 * @param {string} projectName
 * @returns {boolean}
 */
function hasRealProjectFiles(projectName) {
  const files = listWorkspaceFiles(projectName);
  return files.some((f) => !/\.md$/i.test(f));
}

/**
 * Remove bogus FILE-entry artifacts from the workspace root (files only).
 * Never deletes directories.
 *
 * @param {string} projectName
 * @returns {number} Number of files removed.
 */
function cleanupWorkspaceArtifacts(projectName) {
  const root = path.join(PROJECTS_DIR, projectName, "workspace");
  if (!fs.existsSync(root)) return 0;
  let removed = 0;
  for (const name of fs.readdirSync(root)) {
    const rel = name.replace(/\\/g, "/");
    if (!isBogusGeneratedPath(rel)) continue;
    const full = path.join(root, name);
    try {
      const st = fs.statSync(full);
      if (!st.isDirectory()) {
        fs.rmSync(full, { force: true });
        removed += 1;
      }
    } catch {}
  }
  return removed;
}

// ─── Hydration helpers ────────────────────────────────────────────────────────

/**
 * Return true if a code block content looks like a markdown table rather
 * than real source code. Used to discard FORGE output that accidentally
 * includes a markdown table as a "file".
 *
 * @param {string} [content=""]
 * @returns {boolean}
 */
function isLikelyMarkdownTableBlob(content = "") {
  const lines = String(content || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return false;
  const tableish = lines.filter(
    (l) => l.startsWith("|") && l.endsWith("|"),
  ).length;
  const hasDivider = lines.some((l) => /^\|\s*-+/.test(l));
  return tableish >= 2 && hasDivider;
}

/**
 * Parse FORGE's LLM output into an array of `{ path, content }` objects.
 * Handles multiple common code-block formats that LLMs emit.
 *
 * @param {string} [text=""]
 * @returns {{ path: string, content: string }[]}
 */
function parseFilesFromForgeOutput(text = "") {
  const source = String(text || "");
  const items = [];

  // Ordered from most-specific to least-specific so we don't double-match
  const patterns = [
    // **File: `path/file.ext`** ... ```...```
    /\*\*File:\s*`([^`]+)`\*\*[\s\S]*?```[^\n]*\n([\s\S]*?)```/g,
    // File: `path/file.ext` ... ```...```
    /(?:^|\n)File:\s*`([^`]+)`[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
    // ## File: `path/file.ext`
    /(?:^|\n)#{1,3}\s+File:\s*`([^`]+)`[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
    // ## File: path/file.ext  (no backtick)
    /(?:^|\n)#{1,3}\s+File:\s+([^\n`]+\.[a-zA-Z0-9]+)[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
    // **path/file.ext**
    /(?:^|\n)\*\*([^\n*]+\.[a-zA-Z0-9]+)\*\*[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
    // 1. `path/file.ext`
    /(?:^|\n)\d+\.\s+`([^`]+\.[a-zA-Z0-9]+)`[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) {
      const relPath = String(match[1] || "").trim();
      const content = String(match[2] || "");
      if (!relPath || !content.trim()) continue;
      if (isBogusGeneratedPath(relPath)) continue;
      const existingIdx = items.findIndex((x) => x.path === relPath);
      if (existingIdx >= 0) {
        items[existingIdx] = { path: relPath, content }; // last write wins
      } else {
        items.push({ path: relPath, content });
      }
    }
  }

  return items;
}

/**
 * Write FORGE-generated files to the project workspace.
 * Applies all safety checks before writing (bogus paths, path traversal, markdown blobs).
 *
 * @param {string} projectName
 * @param {string} forgeOutput   - Raw LLM output from FORGE.
 * @param {{ pathAllowList?: RegExp[] }} [opts]
 * @returns {string[]} Relative paths of files actually written.
 */
function materializeForgeFiles(projectName, forgeOutput, opts = {}) {
  const { pathAllowList = null } = opts;
  const files = parseFilesFromForgeOutput(forgeOutput);
  const written = [];

  for (const item of files) {
    if (Array.isArray(pathAllowList) && pathAllowList.length) {
      const allowed = pathAllowList.some((rx) => rx.test(item.path));
      if (!allowed) continue;
    }
    if (isBogusGeneratedPath(item.path) || shouldIgnoreWorkspacePath(item.path))
      continue;
    if (isLikelyMarkdownTableBlob(item.content)) continue;

    const target = safeWorkspacePath(projectName, item.path);
    if (!target) continue;

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, item.content);
    written.push(item.path);
  }

  return written;
}

/**
 * Copy any Markdown output files (atlas.md, forge.md, etc.) into the workspace
 * so FORGE at least has something to build from on re-runs.
 *
 * @param {string} projectName
 */
function hydrateWorkspaceFromOutputs(projectName) {
  const outputDir = path.join(PROJECTS_DIR, projectName, "output");
  const wsRoot = path.join(PROJECTS_DIR, projectName, "workspace");
  if (!fs.existsSync(outputDir)) return;
  fs.mkdirSync(wsRoot, { recursive: true });
  for (const file of fs.readdirSync(outputDir)) {
    const src = path.join(outputDir, file);
    const dest = path.join(wsRoot, file);
    if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  }
}

module.exports = {
  shouldIgnoreWorkspacePath,
  isBogusGeneratedPath,
  safeWorkspacePath,
  listWorkspaceFiles,
  hasRealProjectFiles,
  cleanupWorkspaceArtifacts,
  isLikelyMarkdownTableBlob,
  parseFilesFromForgeOutput,
  materializeForgeFiles,
  hydrateWorkspaceFromOutputs,
};
