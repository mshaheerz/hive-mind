"use strict";
/**
 * core/runner/lifecycle.js
 * ─────────────────────────
 * Run artifact management: creating, writing, and finalising stage run
 * packets (proposal.md, tasks.md, context.json, decision.json, handoff.json).
 *
 * Every agent stage execution creates one run packet under:
 *   projects/<name>/runs/<runId>/
 *
 * This provides a full audit trail and enables resumability.
 */

const fs = require("fs");
const path = require("path");
const { PROJECTS_DIR } = require("./config");

// ─── Run ID ───────────────────────────────────────────────────────────────────

/**
 * Generate a unique run ID for a given agent key.
 * Format: `<timestamp>-<agentKey>-<random5>` (URL-safe, sortable).
 *
 * @param {string} [agentKey="agent"]
 * @returns {string}
 */
function createRunId(agentKey = "agent") {
  return `${Date.now()}-${agentKey}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── File helpers ─────────────────────────────────────────────────────────────

/**
 * Absolute path to a run's directory inside the project.
 *
 * @param {string} projectName
 * @param {string} runId
 * @returns {string}
 */
function runDir(projectName, runId) {
  return path.join(PROJECTS_DIR, projectName, "runs", runId);
}

/**
 * Write a file into a run directory. Creates parent directories as needed.
 * Objects are JSON-serialised; strings are written as-is.
 *
 * @param {string} projectName
 * @param {string} runId
 * @param {string} rel     - Relative path within the run directory.
 * @param {string|object} content
 */
function writeRunFile(projectName, runId, rel, content) {
  const full = path.join(runDir(projectName, runId), rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (typeof content === "string") fs.writeFileSync(full, content);
  else fs.writeFileSync(full, JSON.stringify(content, null, 2));
}

/**
 * Append a named evidence file into the `evidence/` sub-folder of a run.
 * Unsafe characters in the filename are replaced with dashes.
 *
 * @param {string} projectName
 * @param {string} runId
 * @param {string} fileName   - Desired filename for the evidence artifact.
 * @param {string} content    - File content.
 */
function appendRunEvidence(projectName, runId, fileName, content) {
  const safeName = String(fileName || "evidence.txt").replace(
    /[^\w.\-]+/g,
    "-",
  );
  writeRunFile(
    projectName,
    runId,
    path.join("evidence", safeName),
    String(content || ""),
  );
}

// ─── Read / Write output ──────────────────────────────────────────────────────

/**
 * Read a named output file from `projects/<name>/output/`.
 * Returns an empty string if the file does not exist.
 *
 * @param {string} projectName
 * @param {string} file - Filename within the output directory.
 * @returns {string}
 */
function readOutput(projectName, file) {
  const p = path.join(PROJECTS_DIR, projectName, "output", file);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

/**
 * Write a named output file to `projects/<name>/output/`.
 *
 * @param {string} projectName
 * @param {string} file    - Filename within the output directory.
 * @param {string} content
 */
function writeOutput(projectName, file, content) {
  const dir = path.join(PROJECTS_DIR, projectName, "output");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
}

// ─── Artifact lifecycle ───────────────────────────────────────────────────────

/**
 * Initialise a run packet for a stage execution.
 * Creates proposal.md, tasks.md, and context.json inside the run directory.
 *
 * @param {{ projectName, stage, agentKey, status, parentRunId, provider, model }} opts
 * @returns {{ runId: string, context: object }}
 */
function beginRunArtifact({
  projectName,
  stage,
  agentKey,
  status,
  parentRunId,
  provider,
  model,
}) {
  const runId = createRunId(agentKey);
  const startedAt = new Date().toISOString();

  const context = {
    project: projectName,
    stage,
    agent: agentKey,
    runId,
    parentRunId: parentRunId || null,
    startedAt,
    provider: provider || process.env.LLM_PROVIDER || "openrouter",
    model: model || null,
    statusSnapshot: status || {},
  };

  writeRunFile(
    projectName,
    runId,
    "proposal.md",
    `# Stage Run Proposal\n\n- Project: ${projectName}\n- Stage: ${stage}\n- Agent: ${agentKey}\n- Run ID: ${runId}\n`,
  );

  writeRunFile(
    projectName,
    runId,
    "tasks.md",
    `# Tasks

status: active

## Next Action
- Execute stage \`${stage}\` by \`${agentKey}\`
- Produce decision + handoff artifacts
- Attach evidence for traceability

## Approvals
- [ ] Risk gate evaluated
- [ ] High-risk actions explicitly approved by APEX (if required)

## Checklist
- [ ] Execute ${stage}
- [ ] Emit decision + handoff
- [ ] Attach evidence

## Verification
- [ ] Stage output persisted
- [ ] Next stage owner identified
`,
  );

  writeRunFile(projectName, runId, "context.json", context);
  return { runId, context };
}

/**
 * Close a run packet by writing decision.json, handoff.json, final.md,
 * and the completed tasks.md.
 *
 * @param {string} projectName
 * @param {string} runId
 * @param {object} [payload={}] - Outcome, rationale, risk, agents, artifacts etc.
 */
function finalizeRunArtifact(projectName, runId, payload = {}) {
  const decision = {
    outcome: payload.outcome || "deferred",
    rationale: payload.rationale || "",
    risk: payload.risk || "safe",
    approvedBy:
      payload.approvedBy || (payload.risk === "high" ? "apex" : "system"),
    approved: payload.approved !== false,
    decidedAt: new Date().toISOString(),
  };

  const handoff = {
    fromAgent: payload.fromAgent || "system",
    toAgent: payload.toAgent || null,
    project: payload.project,
    stage: payload.stage || null,
    runId,
    summary: payload.summary || "",
    artifacts: Array.isArray(payload.artifacts) ? payload.artifacts : [],
    requiredActions: Array.isArray(payload.requiredActions)
      ? payload.requiredActions
      : [],
    acceptanceChecks: Array.isArray(payload.acceptanceChecks)
      ? payload.acceptanceChecks
      : [],
    modelInfo: payload.modelInfo || {
      provider: process.env.LLM_PROVIDER || "openrouter",
      model: "unknown",
    },
  };

  writeRunFile(projectName, runId, "decision.json", decision);
  writeRunFile(projectName, runId, "handoff.json", handoff);

  writeRunFile(
    projectName,
    runId,
    "final.md",
    `# Run Summary

- Outcome: ${decision.outcome}
- Project: ${payload.project || projectName}
- Stage: ${payload.stage || "unknown"}
- From: ${handoff.fromAgent || "unknown"}
- To: ${handoff.toAgent || "none"}
- Risk: ${decision.risk}
- Approved: ${decision.approved ? "yes" : "no"}

## Summary
${handoff.summary || "No summary provided."}

## Required Actions
${handoff.requiredActions?.length ? handoff.requiredActions.map((a) => `- ${a}`).join("\n") : "- none"}
`,
  );

  writeRunFile(
    projectName,
    runId,
    "tasks.md",
    `# Tasks

status: ${decision.outcome === "approved" ? "done" : decision.outcome === "deferred" ? "blocked" : "active"}

## Next Action
- ${handoff.toAgent ? `Hand off to \`${handoff.toAgent}\`` : "No downstream agent"}

## Approvals
- [x] Risk gate evaluated
- [${decision.risk === "high" ? "x" : " "}] High-risk actions explicitly approved by APEX (if required)

## Checklist
- [x] Execute stage
- [x] Emit decision + handoff
- [x] Attach evidence

## Verification
- [x] Stage output persisted
- [x] Next stage owner identified
`,
  );
}

module.exports = {
  createRunId,
  runDir,
  writeRunFile,
  appendRunEvidence,
  readOutput,
  writeOutput,
  beginRunArtifact,
  finalizeRunArtifact,
};
