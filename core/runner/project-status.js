"use strict";
/**
 * core/runner/project-status.js
 * ──────────────────────────────
 * All CRUD operations for project status.json files.
 * Also contains schema normalisation to ensure every status
 * has the required fields before being read by agents.
 */

const fs = require("fs");
const path = require("path");
const {
  PROJECTS_DIR,
  STAGE_RESPONSIBLE_AGENT,
  PIPELINE_STAGE_ORDER,
} = require("./config");

// ─── Schema Helpers ───────────────────────────────────────────────────────────

/**
 * Returns the numeric rank of a pipeline stage.
 * Used to detect and prevent illegal backward stage transitions.
 *
 * @param {string} stage - Stage name, e.g. "architecture"
 * @returns {number} Rank (0-based), or -1 if stage is unknown.
 */
function stageRank(stage) {
  const idx = PIPELINE_STAGE_ORDER.indexOf(String(stage || "").toLowerCase());
  return idx >= 0 ? idx : -1;
}

/**
 * Normalises a raw status object so all fields are present and typed correctly.
 * This prevents runtime errors when agents read stale or partially-written status files.
 *
 * @param {object} [status={}] - Raw status object (e.g. parsed from JSON).
 * @returns {object} Normalised status with all required fields.
 */
function schemaNormalizedStatus(status = {}) {
  const normalized = { ...(status || {}) };

  // Ensure level is one of the three HIVE_LEVELS (defaults to medium)
  const validLevels = ["easy", "medium", "advanced"];
  normalized.level = String(normalized.level || "medium").toLowerCase();
  if (!validLevels.includes(normalized.level)) normalized.level = "medium";

  // Ensure stage is a lowercase string
  normalized.stage = String(normalized.stage || "new").toLowerCase();

  // Ensure stageAttempt is a positive integer
  if (
    !Number.isFinite(Number(normalized.stageAttempt)) ||
    Number(normalized.stageAttempt) < 1
  ) {
    normalized.stageAttempt = 1;
  }

  // Normalise lensVerdict to one of three known values
  if (!["APPROVED", "NEEDS_CHANGES", null].includes(normalized.lensVerdict)) {
    if (normalized.lensRejected === true)
      normalized.lensVerdict = "NEEDS_CHANGES";
    else if (normalized.lensRejected === false || normalized.lensApproved)
      normalized.lensVerdict = "APPROVED";
    else normalized.lensVerdict = null;
  }

  // Normalise lensActionItems to a typed array
  if (!Array.isArray(normalized.lensActionItems))
    normalized.lensActionItems = [];
  normalized.lensActionItems = normalized.lensActionItems
    .map((item, idx) => {
      if (typeof item === "string") {
        return { id: `L${idx + 1}`, severity: "critical", requirement: item };
      }
      return {
        id: String(item?.id || `L${idx + 1}`),
        severity:
          String(item?.severity || "critical").toLowerCase() === "warning"
            ? "warning"
            : "critical",
        file: item?.file ? String(item.file) : undefined,
        requirement: String(item?.requirement || item?.action || "").trim(),
      };
    })
    .filter((item) => item.requirement);

  // Ensure blockedReason is null or a proper object
  if (!normalized.blockedReason || typeof normalized.blockedReason !== "object")
    normalized.blockedReason = null;

  // Normalise escalation level
  if (
    !["none", "apex_watch", "force_progress"].includes(
      normalized.escalationLevel,
    )
  ) {
    normalized.escalationLevel = normalized.escalationNeeded
      ? "apex_watch"
      : "none";
  }

  // Ensure tracking fields are present
  normalized.lastHandoffRunId = normalized.lastHandoffRunId || null;
  normalized.stageOwner =
    normalized.stageOwner || STAGE_RESPONSIBLE_AGENT[normalized.stage] || null;

  if (
    !normalized.lensIssueRepeats ||
    typeof normalized.lensIssueRepeats !== "object"
  )
    normalized.lensIssueRepeats = {};

  // Ensure workspaceFiles is a deduplicated array
  if (!Array.isArray(normalized.workspaceFiles)) {
    normalized.workspaceFiles = [];
  } else {
    normalized.workspaceFiles = [
      ...new Set(normalized.workspaceFiles.map(String)),
    ];
  }

  return normalized;
}

// ─── Project Listing ──────────────────────────────────────────────────────────

/**
 * Return all project directory names, excluding template folders (prefix `_`).
 *
 * @returns {string[]} Array of project names.
 */
function getProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR).filter((f) => {
    const d = path.join(PROJECTS_DIR, f);
    return fs.statSync(d).isDirectory() && !f.startsWith("_");
  });
}

/**
 * Read and normalise a project's status.json.
 * Returns a safe default if the file doesn't exist or is malformed.
 *
 * @param {string} name - Project directory name.
 * @returns {object} Normalised status object.
 */
function getProjectStatus(name) {
  const sf = path.join(PROJECTS_DIR, name, "status.json");
  if (!fs.existsSync(sf)) return schemaNormalizedStatus({ stage: "new" });
  try {
    const parsed = schemaNormalizedStatus(JSON.parse(fs.readFileSync(sf)));
    fs.writeFileSync(sf, JSON.stringify(parsed, null, 2)); // re-write to normalise
    return parsed;
  } catch {
    return schemaNormalizedStatus({ stage: "new" });
  }
}

/**
 * Return all projects that are currently being worked on
 * (i.e. not completed, failed, or not yet started).
 *
 * @returns {{ name: string, status: object }[]}
 */
function getActiveProjectsWithStatus() {
  return getProjects()
    .map((name) => ({ name, status: getProjectStatus(name) }))
    .filter(
      ({ status }) => !["complete", "failed", "new"].includes(status.stage),
    );
}

/**
 * Compute a numeric priority timestamp for a project.
 * Used to sort by oldest-approved first.
 *
 * @param {object} [status={}]
 * @returns {number} Unix timestamp in ms, or 0.
 */
function projectPriorityTs(status = {}) {
  const approved = status.approvedAt
    ? new Date(status.approvedAt).getTime()
    : 0;
  const proposed = status.proposedAt
    ? new Date(status.proposedAt).getTime()
    : 0;
  const updated = status.updatedAt ? new Date(status.updatedAt).getTime() : 0;
  return approved || proposed || updated || 0;
}

// ─── Status CRUD ──────────────────────────────────────────────────────────────

/**
 * Merge `updates` into a project's status.json.
 * Always normalises the result before writing.
 *
 * @param {string} name    - Project directory name.
 * @param {object} updates - Fields to merge into the current status.
 */
function setProjectStatus(name, updates) {
  const dir = path.join(PROJECTS_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  const sf = path.join(dir, "status.json");
  let status = {};
  if (fs.existsSync(sf)) {
    try {
      status = schemaNormalizedStatus(JSON.parse(fs.readFileSync(sf)));
    } catch {}
  }
  Object.assign(status, updates, { updatedAt: new Date().toISOString() });
  status = schemaNormalizedStatus(status);
  fs.writeFileSync(sf, JSON.stringify(status, null, 2));
}

/**
 * Advance (or retry) a project's pipeline stage.
 * Prevents illegal backward regressions unless `opts.allowBackward` is set.
 *
 * @param {string} projectName
 * @param {string} nextStage  - Target stage name.
 * @param {{ reason?: string, allowBackward?: boolean, runId?: string }} [opts]
 * @throws {Error} On illegal backward stage regression.
 */
function transitionProjectStage(projectName, nextStage, opts = {}) {
  const { reason = "", allowBackward = false, runId = null } = opts;
  const current = getProjectStatus(projectName);
  const currentStage = String(current.stage || "new").toLowerCase();
  const target = String(nextStage || currentStage).toLowerCase();
  const curRank = stageRank(currentStage);
  const nextRank = stageRank(target);

  if (!allowBackward && curRank >= 0 && nextRank >= 0 && nextRank < curRank) {
    throw new Error(
      `Illegal stage regression ${currentStage} -> ${target} without decision artifact`,
    );
  }

  const sameStage = currentStage === target;
  const updates = {
    stage: target,
    stageOwner: STAGE_RESPONSIBLE_AGENT[target] || null,
    stageAttempt: sameStage ? Number(current.stageAttempt || 1) + 1 : 1,
    blockedReason: null,
    ...(runId ? { lastHandoffRunId: runId } : {}),
  };
  if (reason) updates.transitionReason = reason;
  setProjectStatus(projectName, updates);
}

/**
 * Classify the risk of an action string.
 * Used by APEX to decide approval mode.
 *
 * @param {string} [action=""]
 * @returns {"high"|"moderate"|"safe"}
 */
function classifyRisk(action = "") {
  const text = String(action || "").toLowerCase();
  if (
    /deploy|publish|release|migration|drop|truncate|delete from|secret write|destroy|rm -rf|git reset --hard/.test(
      text,
    )
  ) {
    return "high";
  }
  if (
    /install|npm i|npm install|pip install|build|workspace generation|materializ|bootstrap|scaffold/.test(
      text,
    )
  ) {
    return "moderate";
  }
  return "safe";
}

module.exports = {
  stageRank,
  schemaNormalizedStatus,
  getProjects,
  getProjectStatus,
  getActiveProjectsWithStatus,
  projectPriorityTs,
  setProjectStatus,
  transitionProjectStage,
  classifyRisk,
};
