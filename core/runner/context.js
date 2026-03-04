"use strict";
/**
 * core/runner/context.js
 * ──────────────────────
 * Agentic Context Retrieval (Cursor/Windsurf Strategy).
 *
 * This module implements the logic to select the most relevant files
 * for an LLM prompt based on the current task and project state.
 *
 * Strategies:
 *  - Keyword extraction from task/action items.
 *  - Relevance scoring (mentions, imports, file type).
 *  - Import following (dependency chains).
 *  - Proportional truncation to fit within context limits.
 *  - Deduplication: don't re-send files already seen this run.
 */

const fs = require("fs");
const path = require("path");
const { PROJECTS_DIR } = require("./config");
const { listWorkspaceFiles } = require("./workspace");

/** List of extensions to skip when reading file content. */
const SKIP_EXTENSIONS =
  /\.(png|jpe?g|gif|svg|ico|pdf|zip|tar|gz|mp4|webm|pyc|pyo|woff2?|ttf|eot|map|lock)$/i;

/** Configuration files that are almost always relevant. */
const CORE_FILES = [
  "package.json",
  "next.config.js",
  "next.config.mjs",
  "tailwind.config.js",
  "tailwind.config.ts",
  "tsconfig.json",
  "jsconfig.json",
  ".eslintrc.json",
  ".env.example",
];

// ─── Keyword Extraction ───────────────────────────────────────────────────────

/**
 * Extract meaningful keywords (paths, symbols, quoted strings) from text.
 * used to identify relevant files in the workspace.
 *
 * @param {string} [text=""]
 * @returns {string[]} Array of up to 30 keywords.
 */
function extractSearchKeywords(text = "") {
  const keywords = new Set();

  // 1. Extract file paths: app/page.js, src/utils.ts
  const filePaths = text.match(
    /(?:^|[\s`"'(])([\w./-]+\.\w{1,6})(?:[\s`"'),:]|$)/gm,
  );
  if (filePaths) {
    filePaths.forEach((fp) => {
      const cleaned = fp.trim().replace(/[`"'(),: ]/g, "");
      if (cleaned.includes("/") || cleaned.includes(".")) {
        keywords.add(cleaned);
      }
    });
  }

  // 2. Extract symbols: PascalCase and camelCase
  const symbols = text.match(/\b[A-Z][a-zA-Z0-9]{2,30}\b/g);
  if (symbols) symbols.forEach((s) => keywords.add(s));

  const camel = text.match(/\b[a-z][a-zA-Z0-9]{3,30}\b/g);
  if (camel) {
    const skip = new Set([
      "this",
      "from",
      "with",
      "that",
      "what",
      "then",
      "else",
    ]);
    camel.filter((w) => !skip.has(w)).forEach((s) => keywords.add(s));
  }

  // 3. Extract quoted strings
  const quoted = text.match(/["'`]([^"'`]{2,60})["'`]/g);
  if (quoted) {
    quoted.forEach((q) => {
      const inner = q.slice(1, -1).trim();
      if (inner.length > 2) keywords.add(inner);
    });
  }

  return Array.from(keywords).slice(0, 30);
}

// ─── Import Following ─────────────────────────────────────────────────────────

/**
 * Extract relative/aliased imports from JavaScript/TypeScript content.
 *
 * @param {string} [content=""]
 * @returns {string[]}
 */
function extractImports(content = "") {
  const imports = new Set();

  // ES6: import X from './path'
  const esImports = content.matchAll(
    /(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]/g,
  );
  for (const m of esImports) imports.add(m[1]);

  // CJS: require('./path')
  const cjsImports = content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const m of cjsImports) imports.add(m[1]);

  // Dynamic import: import('./path')
  const dynImports = content.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const m of dynImports) imports.add(m[1]);

  return Array.from(imports).filter(
    (p) => p.startsWith("./") || p.startsWith("../") || p.startsWith("@/"),
  );
}

// ─── Relevance Scoring ────────────────────────────────────────────────────────

/**
 * Assign a relevance score to a file based on task keywords and role.
 *
 * @param {string} filePath
 * @param {string} fileContent
 * @param {string[]} keywords
 * @param {string[]} actionItemFiles - Files explicitly mentioned as needing work.
 * @returns {number}
 */
function scoreFileRelevance(filePath, fileContent, keywords, actionItemFiles) {
  let score = 0;

  // 1. Explicitly mentioned in action items
  if (
    actionItemFiles.some(
      (af) => af && filePath.toLowerCase().includes(af.toLowerCase()),
    )
  ) {
    score += 100;
  }

  // 2. Core configuration
  if (CORE_FILES.some((cf) => filePath.endsWith(cf) || filePath === cf)) {
    score += 50;
  }

  // 3. Keyword matches in path
  for (const kw of keywords) {
    if (filePath.toLowerCase().includes(kw.toLowerCase())) {
      score += 20;
    }
  }

  // 4. Keyword matches in content (mini-grep)
  for (const kw of keywords) {
    if (
      kw.length >= 3 &&
      fileContent.toLowerCase().includes(kw.toLowerCase())
    ) {
      score += 5;
    }
  }

  // 5. File type boost
  if (/\.(jsx?|tsx?|mjs)$/.test(filePath)) score += 3; // Source
  if (/test|spec/i.test(filePath)) score += 2; // Tests
  if (/page|layout|route/i.test(filePath)) score += 4; // Next.js entry points

  // 6. Shallow files slightly preferred over deep nesting
  const depth = (filePath.match(/\//g) || []).length;
  score -= depth * 1;

  return score;
}

// ─── Deduplication (Cline Strategy) ───────────────────────────────────────────

/**
 * Tracks files already sent to the LLM within this runner cycle
 * to prevent bloated prompts filled with duplicate code.
 */
const _contextLedger = new Map(); // projectName → Set<file:hash>

function _fileHashShort(content) {
  return `${content.length}:${content.slice(0, 64)}${content.slice(-32)}`;
}

function _wasAlreadySent(projectName, file, content) {
  const ledger = _contextLedger.get(projectName);
  if (!ledger) return false;
  return ledger.has(`${file}::${_fileHashShort(content)}`);
}

function _markSent(projectName, file, content) {
  if (!_contextLedger.has(projectName))
    _contextLedger.set(projectName, new Set());
  _contextLedger.get(projectName).add(`${file}::${_fileHashShort(content)}`);
}

function clearContextLedger(projectName) {
  _contextLedger.delete(projectName);
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Gathers the project workspace into a prompt-friendly format.
 * Includes a tree map of the entire project + full content of the most relevant files.
 *
 * @param {string} projectName
 * @param {object} [opts]
 * @param {string[]} [opts.priorityFiles=[]]
 * @param {string[]} [opts.workingSet=[]] - Files recently modified by the runner.
 * @param {number} [opts.limit] - Budget in characters (optional, calculated from model if omitted).
 * @param {string} [opts.taskDescription=""]
 * @param {object[]} [opts.actionItems=[]]
 * @param {boolean} [opts.resetLedger=false] - If true, treats all files as new.
 * @param {object} [opts.modelInfo] - Metadata (contextWindow, etc) to auto-tune budget.
 * @returns {string} Markdown-formatted context block.
 */
function gatherWorkspaceForLLM(projectName, opts = {}) {
  const {
    priorityFiles = [],
    workingSet = [],
    taskDescription = "",
    actionItems = [],
    resetLedger = false,
    modelInfo = null,
  } = opts;

  // Smart budget calculation: try to use ~40% of the context window for file content
  // Note: 1 token ~= 4 characters for source code
  const contextWindow = modelInfo?.contextWindow || 128000;
  const autoLimit = Math.floor(contextWindow * 4 * 0.4);
  const limit = opts.limit || autoLimit || 60000;

  if (resetLedger) clearContextLedger(projectName);

  const files = listWorkspaceFiles(projectName);
  const wsRoot = path.join(PROJECTS_DIR, projectName, "workspace");

  // 1. Workspace Tree Map
  const filteredFiles = files.filter(
    (f) => !f.includes("node_modules") && !f.includes(".next"),
  );
  let mapSection = "## WORKSPACE MAP\n";
  for (const file of filteredFiles) mapSection += `- ${file}\n`;

  // 2. Keyword extraction
  const actionItemText = actionItems
    .map((x) =>
      typeof x === "object"
        ? `${x.file || ""} ${x.issue || ""} ${x.requirement || ""}`
        : String(x),
    )
    .join("\n");
  const keywords = extractSearchKeywords(
    `${taskDescription}\n${actionItemText}`,
  );
  const actionFileHints = [
    ...priorityFiles,
    ...actionItems
      .map((x) => (typeof x === "object" ? x.file : ""))
      .filter(Boolean),
  ];

  // 3. Scoring
  const scored = [];
  const fileContents = {};

  for (const file of filteredFiles) {
    if (SKIP_EXTENSIONS.test(file)) continue;
    if (file === "package-lock.json" || file.includes("__pycache__")) continue;

    const full = path.join(wsRoot, file);
    try {
      const stat = fs.statSync(full);
      if (stat.size > 100000) continue;
      const content = fs.readFileSync(full, "utf8");
      if (content.includes("\0")) continue; // Avoid binary

      fileContents[file] = content;
      let relevance = scoreFileRelevance(
        file,
        content,
        keywords,
        actionFileHints,
      );

      // Boost files in the working set (recently modified)
      if (workingSet.some((wf) => file === wf || file.endsWith(`/${wf}`))) {
        relevance += 150;
      }

      scored.push({ file, relevance, size: content.length });
    } catch {}
  }

  // 4. Import Following Boost
  const importBoosts = new Map();
  for (const { file, relevance } of scored.filter((s) => s.relevance >= 50)) {
    const content = fileContents[file];
    if (!content) continue;
    for (const imp of extractImports(content)) {
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), imp),
      );
      for (const ext of [
        "",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        "/index.js",
        "/index.tsx",
      ]) {
        const candidate = resolved + ext;
        if (fileContents[candidate]) {
          importBoosts.set(candidate, (importBoosts.get(candidate) || 0) + 30);
        }
      }
    }
  }
  for (const s of scored) s.relevance += importBoosts.get(s.file) || 0;

  // 5. Final Selection
  scored.sort((a, b) => b.relevance - a.relevance);

  const MAX_FILES_WITH_CONTENT = Math.min(
    50,
    Math.max(12, Math.floor(limit / 5000)),
  );
  const contentBudget = limit - mapSection.length - 200;

  let fileSection = `\n## FILE CONTENTS (top ${Math.min(scored.length, MAX_FILES_WITH_CONTENT)} relevant files)\n`;
  let charUsed = 0;
  let included = 0;
  const omittedNames = [];

  for (const { file, relevance } of scored) {
    const content = fileContents[file];
    if (!content) continue;

    if (relevance <= 0 && included >= 3) {
      omittedNames.push(file);
      continue;
    }

    if (_wasAlreadySent(projectName, file, content)) {
      fileSection += `\n**File: \`${file}\`** [ALREADY IN CONTEXT — unchanged]\n`;
      continue;
    }

    if (included >= MAX_FILES_WITH_CONTENT) {
      omittedNames.push(file);
      continue;
    }

    const proportion = relevance >= 100 ? 0.4 : relevance >= 50 ? 0.25 : 0.1;
    const maxCharsForFile = Math.floor(contentBudget * proportion);
    const remainingBudget = contentBudget - charUsed;

    if (remainingBudget < 200) {
      omittedNames.push(file);
      continue;
    }

    const charsToShow = Math.min(
      content.length,
      maxCharsForFile,
      remainingBudget - 100,
    );

    let entry;
    if (charsToShow >= content.length) {
      entry = `\n**File: \`${file}\`** (score: ${relevance})\n\`\`\`\n${content}\n\`\`\`\n`;
    } else {
      entry = `\n**File: \`${file}\`** (score: ${relevance}, showing ${charsToShow}/${content.length})\n\`\`\`\n${content.slice(0, charsToShow)}\n... [truncated]\n\`\`\`\n`;
    }

    fileSection += entry;
    charUsed += entry.length;
    included++;
    _markSent(projectName, file, content);
  }

  if (omittedNames.length > 0) {
    fileSection += `\n*${omittedNames.length} files omitted (low relevance).*`;
  }

  return mapSection + fileSection;
}

module.exports = {
  extractSearchKeywords,
  extractImports,
  scoreFileRelevance,
  clearContextLedger,
  gatherWorkspaceForLLM,
};
