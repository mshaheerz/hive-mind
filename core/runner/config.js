"use strict";
/**
 * core/runner/config.js
 * ─────────────────────
 * All environment-driven constants and static lookup tables for the
 * autonomous runner.
 *
 * HIVE PROJECT LEVELS:
 * - EASY: Vanilla HTML/CSS/JS ONLY. Futuristic UI templates, dummy data, no backend.
 * - MEDIUM: React + Tailwind CSS. Component-level templates, static data, no real backend.
 * - ADVANCED: Next.js + API/Actions. Full-stack logic, data persistence, complex state.
 */

const HIVE_LEVELS = {
  easy: { stack: "HTML/JS", template: "vanilla-static" },
  medium: { stack: "React/Tailwind", template: "react-static-tailwind" },
  advanced: { stack: "Next.js/FullStack", template: "nextjs-fullstack" },
};

const path = require("path");

// ─── Filesystem roots ─────────────────────────────────────────────────────────

/** Absolute path to the `projects/` directory. */
const PROJECTS_DIR = path.join(__dirname, "..", "..", "projects");

/** Absolute path to the `.hive/` state directory. */
const HIVE_DIR = path.join(__dirname, "..", "..", ".hive");

/** Proposal queue file. */
const QUEUE_FILE = path.join(HIVE_DIR, "queue.json");

/** CEO ↔ APEX communication bridge file. */
const CEO_BRIDGE_FILE = path.join(HIVE_DIR, "ceo-bridge.json");

/** Single-process runner lock to prevent double-starts. */
const RUNNER_LOCK_FILE = path.join(HIVE_DIR, "runner.lock.json");

/** Path to the global autonomous state. */
const STATE_FILE = path.join(HIVE_DIR, "autonomous-state.json");

/** Directory for agent-to-agent discussions. */
const DISCUSS_DIR = path.join(HIVE_DIR, "discussions");

/** Path to the active deadline registry. */
const DEADLINES_FILE = path.join(HIVE_DIR, "deadlines.json");

/** Path to the duplicate detection index. */
const IDEA_INDEX_FILE = path.join(HIVE_DIR, "idea-index.json");

// ─── Tuning knobs (all overridable via .env) ──────────────────────────────────

/** How many projects can be in-flight simultaneously. */
const MAX_ACTIVE_PROJECTS = Number(process.env.HIVE_MAX_ACTIVE_PROJECTS || 2);

/** How many consecutive LENS rejects before we bypass the gate. */
const MAX_LENS_REJECTS_BEFORE_BYPASS = Number(
  process.env.HIVE_ESCALATION_REJECT_THRESHOLD ||
    process.env.MAX_LENS_REJECTS_BEFORE_BYPASS ||
    3,
);

/** How APEX approves proposals: "risk_based" | "always" | "never". */
const APPROVAL_MODE = String(
  process.env.HIVE_APPROVAL_MODE || "risk_based",
).toLowerCase();

/** When true, enforce strict stage ordering (no skipping). */
const STRICT_ORDER_OVERRIDE = /^(1|true|yes|on)$/i.test(
  String(process.env.HIVE_STRICT_ORDER_OVERRIDE || "false"),
);

/** Global project level filter: "easy" | "medium" | "advanced" | "automatic". */
const HIVE_FORCED_LEVEL = String(
  process.env.HIVE_FORCED_LEVEL || "automatic",
).toLowerCase();

/** Runner cycle interval in milliseconds (default: 5 minutes). */
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes for rapid dev cycles

// ─── Stage ↔ Agent mapping ────────────────────────────────────────────────────

/**
 * Maps each pipeline stage to the agent responsible for it.
 * `null` means no agent owns that terminal state.
 */
const STAGE_RESPONSIBLE_AGENT = {
  approved: "scout",
  research: "atlas",
  architecture: "forge",
  implementation: "lens",
  review: "pulse",
  tests: "sage",
  docs: "echo",
  launch: null,
  complete: null,
  failed: null,
  new: null,
};

/**
 * Ordered list of pipeline stages (used for rank comparisons).
 * Stages are compared by index to detect regressions.
 */
const PIPELINE_STAGE_ORDER = [
  "approved",
  "research",
  "architecture",
  "implementation",
  "review",
  "tests",
  "docs",
  "launch",
  "complete",
];

/** Agent execution cadence and role descriptions. */
const AGENT_SCHEDULE = {
  nova: { cycleMinutes: 60, role: "proposes new ideas" },
  scout: { cycleMinutes: 45, role: "researches & validates" },
  apex: { cycleMinutes: 15, role: "reviews & decides" },
  atlas: { cycleMinutes: 90, role: "designs approved projects" },
  forge: { cycleMinutes: 15, role: "implements designs" },
  lens: { cycleMinutes: 60, role: "reviews code" },
  pulse: { cycleMinutes: 60, role: "tests code" },
  sage: { cycleMinutes: 90, role: "writes docs" },
  echo: { cycleMinutes: 120, role: "creates launch content" },
};

module.exports = {
  PROJECTS_DIR,
  HIVE_DIR,
  QUEUE_FILE,
  CEO_BRIDGE_FILE,
  RUNNER_LOCK_FILE,
  STATE_FILE,
  DISCUSS_DIR,
  DEADLINES_FILE,
  IDEA_INDEX_FILE,
  MAX_ACTIVE_PROJECTS,
  MAX_LENS_REJECTS_BEFORE_BYPASS,
  APPROVAL_MODE,
  STRICT_ORDER_OVERRIDE,
  CHECK_INTERVAL_MS,
  STAGE_RESPONSIBLE_AGENT,
  PIPELINE_STAGE_ORDER,
  HIVE_LEVELS,
  HIVE_FORCED_LEVEL,
  AGENT_SCHEDULE,
};
