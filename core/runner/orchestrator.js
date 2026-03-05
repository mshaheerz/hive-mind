"use strict";
/**
 * core/runner/orchestrator.js
 * ──────────────────────────
 * The Hive Mind Autonomous Runner.
 *
 * This is the central engine that orchestrates the multi-agent pipeline.
 * It manages:
 *  - Global runner state (cycle counts, agent schedules)
 *  - Project lifecycle transitions
 *  - Deadline enforcement & escalations
 *  - The CEO bridge (real-time human interaction)
 *  - Individual agent execution cycles (NOVA → SCOUT → APEX → Pipeline)
 */

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { spawnSync } = require("child_process");

// ─── Imports: Core ────────────────────────────────────────────────────────────

const { DuplicateDetector } = require("./duplicate-detector");
const { DiscussionBoard } = require("./discussion");
const { DeadlineTracker } = require("./deadlines");
const { AutonomousState } = require("./state");
const { AGENT_SCHEDULE } = require("./config");

const { buildAgentModels } = require("../llm/models");

// ─── Imports: Agents ──────────────────────────────────────────────────────────

const {
  ScoutAgent,
  ForgeAgent,
  LensAgent,
  PulseAgent,
  EchoAgent,
  AtlasAgent,
  SageAgent,
  NovaAgent,
} = require("../../agents/agents");

const ApexAgent = require("../../agents/apex");

// ─── Imports: Runner Modules ──────────────────────────────────────────────────

const {
  PROJECTS_DIR,
  MAX_ACTIVE_PROJECTS,
  CHECK_INTERVAL_MS,
  STAGE_RESPONSIBLE_AGENT,
  MAX_LENS_REJECTS_BEFORE_BYPASS,
  APPROVAL_MODE,
  STRICT_ORDER_OVERRIDE,
  HIVE_FORCED_LEVEL,
} = require("./config");

const { log } = require("./logger");

const {
  loadQueue,
  saveQueue,
  loadCeoBridge,
  saveCeoBridge,
} = require("./queue");

const {
  getProjects,
  getProjectStatus,
  getActiveProjectsWithStatus,
  projectPriorityTs,
  setProjectStatus,
  transitionProjectStage,
  classifyRisk,
  stageRank,
} = require("./project-status");

const {
  beginRunArtifact,
  finalizeRunArtifact,
  appendRunEvidence,
  readOutput,
  writeOutput,
} = require("./lifecycle");

const { acquireRunnerLock, releaseRunnerLock } = require("./locks");

const {
  listWorkspaceFiles,
  hasRealProjectFiles,
  cleanupWorkspaceArtifacts,
  materializeForgeFiles,
  hydrateWorkspaceFromOutputs,
} = require("./workspace");

const { runWorkspaceChecks, runProjectTests } = require("./checks");

const {
  ensureWorkspaceScaffold,
  ensureProjectBootstrap,
} = require("./bootstrap");

const { gatherWorkspaceForLLM } = require("./context");

const {
  summarizeLensReview,
  extractLensActionItems,
  parseForgeFixMap,
} = require("./lens-utils");

// ─── Orchestrator Class ───────────────────────────────────────────────────────

class AutonomousRunner {
  constructor() {
    this.state = new AutonomousState();
    this.duplicates = new DuplicateDetector();
    this.discussion = new DiscussionBoard();
    this.deadlines = new DeadlineTracker();

    this.agents = {
      apex: new ApexAgent(),
      scout: new ScoutAgent(),
      forge: new ForgeAgent(),
      lens: new LensAgent(),
      pulse: new PulseAgent(),
      echo: new EchoAgent(),
      atlas: new AtlasAgent(),
      sage: new SageAgent(),
      nova: new NovaAgent(),
    };

    this._syncProviderState();
    this.cycleInProgress = false;
    this._hasWorkPending = false;
  }

  // ─── Internal Sync ───────────────────────────────────────────

  /**
   * Sync the current LLM provider from .env into the autonomous state.
   * Resets schedules if the provider changed (so agents wake up on the new backend immediately).
   */
  _syncProviderState() {
    const current = String(
      process.env.LLM_PROVIDER || "openrouter",
    ).toLowerCase();
    const previous = String(this.state.state.llmProvider || "").toLowerCase();

    if (previous && previous !== current) {
      this.state.state.agentLastRun = {};
      log(
        "system",
        `Provider changed (${previous} -> ${current}). Resetting schedules.`,
      );
    }

    if (!this.state.state.agentCadenceMinutes)
      this.state.state.agentCadenceMinutes = {};
    this.state.state.agentCadenceMinutes.forge = 15;
    this.state.state.llmProvider = current;
    this.state.state.activeAgentModels = buildAgentModels(current);
    this.state.save();
  }

  // ─── Entry point ─────────────────────────────────────────────

  async start() {
    acquireRunnerLock();

    console.log(chalk.cyan("\n╔══════════════════════════════════════╗"));
    console.log(
      chalk.cyan("║") +
        chalk.bold.yellow("  🦾 HIVE MIND — Autonomous Mode       ") +
        chalk.cyan("║"),
    );
    console.log(chalk.cyan("╚══════════════════════════════════════╝\n"));

    log(
      "system",
      "Autonomous runner started. Agents will work on their schedules.",
    );
    log("system", `LLM provider: ${process.env.LLM_PROVIDER}`);
    log("system", `Check interval: every ${CHECK_INTERVAL_MS / 60000} minutes`);

    // Startup Self-Check
    this._performSelfCheck();

    this.state.state.running = true;
    this.state.save();

    await this.cycle();

    // Adaptive interval: re-cycle quickly when work was done, slow down when idle
    const scheduleNext = () => {
      const delay = this._hasWorkPending ? Math.min(CHECK_INTERVAL_MS, 15_000) : CHECK_INTERVAL_MS;
      this.intervalId = setTimeout(async () => {
        if (!this.cycleInProgress) await this.cycle();
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    this.bridgeInProgress = false;
    this.bridgeIntervalId = setInterval(async () => {
      if (this.bridgeInProgress) return;
      this.bridgeInProgress = true;
      try {
        await this.processCeoBridge();
      } catch (err) {
        log("system", `CEO bridge error: ${err.message}`);
      } finally {
        this.bridgeInProgress = false;
      }
    }, 10 * 1000);

    const shutdown = () => {
      log("system", "Shutting down gracefully...");
      clearTimeout(this.intervalId);
      clearInterval(this.bridgeIntervalId);
      this.state.state.running = false;
      this.state.save();
      releaseRunnerLock();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("exit", () => releaseRunnerLock());
  }

  /** Validate core files and existing project workspaces on startup. */
  _performSelfCheck() {
    const coreFiles = [
      path.join(__dirname, "..", "..", "run.js"),
      path.join(__dirname, "..", "llm-client.js"),
      path.join(__dirname, "..", "agent.js"),
      path.join(__dirname, "..", "autonomous.js"),
    ];
    let coreOk = 0,
      coreFail = 0;
    for (const f of coreFiles) {
      if (!fs.existsSync(f)) continue;
      const run = spawnSync("node", ["--check", f], {
        encoding: "utf8",
        timeout: 10000,
      });
      if (run.status === 0) coreOk++;
      else {
        coreFail++;
        log(
          "system",
          `⚠ SYNTAX ERROR in ${path.relative(process.cwd(), f)}: ${(run.stderr || "").split("\n")[0]}`,
        );
      }
    }
    log(
      "system",
      `Self-check: ${coreOk}/${coreOk + coreFail} core files OK${coreFail ? " (ERRORS!)" : " ✓"}`,
    );

    for (const name of getProjects()) {
      const wsCheck = runWorkspaceChecks(name);
      if (wsCheck.failed > 0)
        log(
          "system",
          `⚠ Workspace "${name}": ${wsCheck.failed} file(s) failed syntax check`,
        );
    }
  }

  // ─── Cycle Logic ─────────────────────────────────────────────

  async cycle() {
    if (this.cycleInProgress) return;
    this.cycleInProgress = true;

    this.state.state.cycleCount++;
    this.state.state.lastCycle = new Date().toISOString();
    this.state.save();

    const modeTag = this._hasWorkPending ? "FAST" : "IDLE";
    log(
      "system",
      `\n── Cycle #${this.state.state.cycleCount} (Mode: ${HIVE_FORCED_LEVEL.toUpperCase()}, ${modeTag}) ─────────────────────────`,
    );

    const dueSnapshot = Object.fromEntries(
      Object.keys(AGENT_SCHEDULE).map((name) => [
        name,
        this.state.isAgentDue(name),
      ]),
    );

    try {
      this.cleanupOldRuns();
      this._maintenanceWork();

      const activeProjects = getActiveProjectsWithStatus();
      const capacityFull = activeProjects.length >= MAX_ACTIVE_PROJECTS;
      const isLocal =
        (process.env.LLM_PROVIDER || "").toLowerCase() === "local";

      if (isLocal) {
        log("system", `🖥️ LOCAL MODE: Sequential pipeline active.`);
        for (const name of ["atlas", "forge", "lens", "pulse", "sage", "echo"])
          dueSnapshot[name] = true;
      }

      await this.checkDeadlines();

      if (!isLocal) {
        if (dueSnapshot.nova) {
          const ok = await this.novaGeneratesIdeas(capacityFull);
          this.state.markAgentRun("nova", {
            worked: true,
            success: ok !== false,
          });
        }
        if (dueSnapshot.scout) {
          const ok = await this.scoutValidatesProposals(capacityFull);
          this.state.markAgentRun("scout", {
            worked: true,
            success: ok !== false,
          });
        }
        if (dueSnapshot.apex) {
          const ok = await this.apexReviewsAndDecides({
            blockApprovals: capacityFull,
            activeCount: activeProjects.length,
          });
          this.state.markAgentRun("apex", {
            worked: ok === true,
            success: ok !== false,
          });
        }
      }

      this._hasWorkPending = await this.advanceProjects(dueSnapshot);
    } catch (err) {
      log("system", `Cycle error: ${err.message}`);
      this._hasWorkPending = false;
    } finally {
      this.cycleInProgress = false;
    }
  }

  /** Housekeeping: scaffold workspaces, cleanup artifacts, backfill from output. */
  _maintenanceWork() {
    for (const name of getProjects()) {
      const status = getProjectStatus(name);
      ensureWorkspaceScaffold(
        name,
        status.preferredStack || status.stack || "",
      );
      cleanupWorkspaceArtifacts(name);
      if (!hasRealProjectFiles(name)) hydrateWorkspaceFromOutputs(name);

      // Re-verify completion
      const updated = getProjectStatus(name);
      if (updated.stage === "complete" && !hasRealProjectFiles(name)) {
        setProjectStatus(name, {
          stage: "architecture",
          stageOwner: STAGE_RESPONSIBLE_AGENT.architecture,
          completionRevoked: true,
          completionRevokedReason: "No source files found in workspace",
        });
        log("system", `Reopened "${name}": no source files found.`);
      }
    }
  }

  // ─── Project Advancement ─────────────────────────────────────

  async advanceProjects(dueSnapshot = {}) {
    const all = getActiveProjectsWithStatus().sort(
      (a, b) => projectPriorityTs(a.status) - projectPriorityTs(b.status),
    );
    const prioritized = all.slice(0, MAX_ACTIVE_PROJECTS);
    let progressed = false;
    let moreWorkPending = false;

    // Force pipeline agents "due" when any active project needs them.
    // This prevents agents from sleeping through their cadence while work is waiting.
    for (const { status } of prioritized) {
      const stage = status.stage;
      if (["complete", "failed", "new"].includes(stage)) continue;
      const pipelineAgents = {
        approved: "scout", research: "atlas", architecture: "forge",
        implementation: "lens", review: "pulse", tests: "sage", docs: "echo",
      };
      const needed = pipelineAgents[stage];
      if (needed && !dueSnapshot[needed]) {
        dueSnapshot[needed] = true;
        log("system", `Waking ${needed.toUpperCase()} — project work pending.`);
      }
    }

    for (const { name, status } of prioritized) {
      if (progressed) {
        // There's more work but we already progressed one project this cycle
        if (!["complete", "failed", "new"].includes(status.stage)) moreWorkPending = true;
        break;
      }
      let currentStatus = status;
      let hops = 0;

      while (hops < 3) {
        // Max hops per cycle to prevent infinite loops
        if (["complete", "failed", "new"].includes(currentStatus.stage)) break;

        const stageMap = {
          approved: { agent: "scout", next: "research", agentKey: "scout" },
          research: { agent: "atlas", next: "architecture", agentKey: "atlas" },
          architecture: {
            agent: "forge",
            next: "implementation",
            agentKey: "forge",
          },
          implementation: { agent: "lens", next: "review", agentKey: "lens" },
          review: { agent: "pulse", next: "tests", agentKey: "pulse" },
          tests: { agent: "sage", next: "docs", agentKey: "sage" },
          docs: { agent: "echo", next: "launch", agentKey: "echo" },
          launch: { agent: null, next: "complete", agentKey: null },
        };

        const stageInfo = stageMap[currentStatus.stage];
        if (!stageInfo || !stageInfo.agentKey) {
          this._finalizeProject(name);
          break;
        }

        if (!dueSnapshot[stageInfo.agentKey]) {
          dueSnapshot[stageInfo.agentKey] = true;
        }

        const run = await this.runProjectStage(
          name,
          currentStatus.stage,
          stageInfo,
          currentStatus,
        );
        this.state.markAgentRun(stageInfo.agentKey, {
          worked: true,
          success: run?.success !== false,
        });

        // Mark progress. If something substantial happened, we might stop the cycle for other projects.
        if (run?.worked !== false) progressed = true;

        currentStatus = getProjectStatus(name);
        hops++;
        if (run?.haltProjectThisCycle) break;
      }

      // Check if this project still has more stages to go
      if (!["complete", "failed", "new", "launch"].includes(currentStatus.stage)) {
        moreWorkPending = true;
      }
    }

    return moreWorkPending;
  }

  _finalizeProject(name) {
    if (!hasRealProjectFiles(name)) return;
    setProjectStatus(name, {
      stage: "complete",
      stageOwner: null,
      blockedReason: null,
      workspaceFiles: listWorkspaceFiles(name),
    });
    this.state.increment("completed");
    log("system", `🎉 Project "${name}" is COMPLETE!`);
  }

  // ─── Stage Runner ────────────────────────────────────────────

  async runProjectStage(projectName, stage, stageInfo, status) {
    const readme = readOutput(projectName, "README.md") || "";
    const model =
      this.state.state.activeAgentModels?.[stageInfo.agentKey] || "unknown";
    const run = beginRunArtifact({
      projectName,
      stage,
      agentKey: stageInfo.agentKey,
      status,
      parentRunId: status.lastHandoffRunId,
      provider: this.state.state.llmProvider || process.env.LLM_PROVIDER,
      model,
    });

    log(stageInfo.agentKey, `Working on "${projectName}" → ${stage}`);
    transitionProjectStage(projectName, stage, {
      reason: "agent execution started",
      runId: run.runId,
    });
    this.deadlines.set(projectName, stageInfo.next, stageInfo.agentKey, 4);

    try {
      const riskClass = classifyRisk(`${stageInfo.agentKey}:${stage}`);
      if (APPROVAL_MODE === "risk_based" && riskClass === "high") {
        return this._deferToApex(
          projectName,
          stage,
          stageInfo,
          run,
          riskClass,
          model,
        );
      }

      let output = "";
      switch (stage) {
        case "approved":
          output = await this.agents.scout.research(readme);
          writeOutput(projectName, "research.md", output);
          break;
        case "research":
          output = await this.agents.atlas.design(
            readme,
            readOutput(projectName, "research.md"),
            status.level || "medium",
          );
          writeOutput(projectName, "architecture.md", output);
          break;
        case "architecture":
          output = await this._runImplementation(
            projectName,
            readme,
            status,
            run,
          );
          break;
        case "implementation":
          output = await this._runReview(
            projectName,
            readme,
            status,
            run,
            stageInfo,
            model,
          );
          if (!output) return { worked: true, success: true }; // stage change handled in _runReview
          break;
        case "review":
          output = await this._runTests(
            projectName,
            readme,
            status,
            run,
            stageInfo,
            model,
          );
          if (!output) return { worked: true, success: true };
          break;
        case "tests":
          output = await this.agents.sage.writeReadme(
            {
              name: projectName,
              description: readme,
            },
            status.level || "medium",
          );
          writeOutput(projectName, "docs.md", output);
          break;
        case "docs":
          output = await this.agents.echo.createLaunchContent(
            {
              name: projectName,
              description: readme,
              features: readOutput(projectName, "docs.md"),
            },
            status.level || "medium",
          );
          writeOutput(projectName, "launch.md", output);
          break;
      }

      this.deadlines.complete(projectName, stageInfo.next);
      this._transitionToNext(
        projectName,
        stage,
        stageInfo,
        run,
        riskClass,
        model,
      );
      return { worked: true, success: true };
    } catch (err) {
      log("system", `Stage error (${stage}): ${err.message}`);
      return { worked: true, success: false };
    }
  }

  // ─── Sub-runners ─────────────────────────────────────────────

  async _runImplementation(projectName, readme, status, run) {
    const remediationFiles = [
      ...(status.lensActionItems || []).map((x) => x.file),
      ...(status.pulseActionItems || []).map((x) => x.file),
    ].filter(Boolean);

    const context = gatherWorkspaceForLLM(projectName, {
      priorityFiles: remediationFiles,
      workingSet: status.workspaceFiles,
      taskDescription: readme,
      actionItems: [
        ...(status.lensActionItems || []),
        ...(status.pulseActionItems || []),
      ],
      modelInfo: this.state.state.activeAgentModels?.forge,
    });

    const bootstrap = ensureProjectBootstrap(projectName, status, readme);

    // Determine if FORGE should rebuild from scratch or iterate
    const fileCount = (status.workspaceFiles || []).length;
    const hasActionItems =
      (status.lensActionItems || []).length > 0 ||
      (status.pulseActionItems || []).length > 0;
    const isThinImpl = (status.level === "easy" && fileCount < 15) ||
      (status.level === "medium" && fileCount < 10);
    const rebuildHint =
      isThinImpl && (status.stageAttempt || 0) >= 2
        ? `\n\nIMPORTANT: The current implementation is INSUFFICIENT (only ${fileCount} files). You must COMPLETELY REBUILD from scratch with a proper multi-page structure. Do NOT patch the existing files — generate ALL new files from the ground up.\n`
        : "";

    const forgeTask = `Task: ${readme}${rebuildHint}\n\nExisting Implementation:\n${context}`;
    const output = await this.agents.forge.implement(
      forgeTask,
      readOutput(projectName, "architecture.md"),
      readOutput(projectName, "research.md"),
      status.level || "medium",
    );

    writeOutput(projectName, "implementation.md", output);
    const written = materializeForgeFiles(projectName, output);

    if (written.length) {
      const check = runWorkspaceChecks(projectName);
      setProjectStatus(projectName, {
        workspaceFiles: written,
        workspaceCheck: check,
      });
      log(
        "forge",
        `Materialized ${written.length} files. Checks: ${check.passed}/${check.checked} OK.`,
      );
    }

    return output;
  }

  async _runReview(projectName, readme, status, run, stageInfo, model) {
    const context = gatherWorkspaceForLLM(projectName, {
      taskDescription: readme,
      workingSet: status.workspaceFiles,
      modelInfo: this.state.state.activeAgentModels?.lens,
    });
    const output = await this.agents.lens.review(
      context,
      readme,
      status.level || "medium",
    );
    writeOutput(projectName, "review.md", output);

    if (
      output.toLowerCase().includes("needs_changes") ||
      output.toLowerCase().includes("rejected")
    ) {
      const summary = summarizeLensReview(output);
      const items = extractLensActionItems(output);

      setProjectStatus(projectName, {
        stage: "architecture",
        stageOwner: STAGE_RESPONSIBLE_AGENT.architecture,
        blockedReason: { code: "lens_rejected", message: summary },
        lensActionItems: items,
        lensVerdict: "NEEDS_CHANGES",
      });

      finalizeRunArtifact(projectName, run.runId, {
        outcome: "rejected",
        summary,
        project: projectName,
        stage: "implementation",
      });
      return null;
    }
    return output;
  }

  async _runTests(projectName, readme, status, run, stageInfo, model) {
    const context = gatherWorkspaceForLLM(projectName, {
      taskDescription: readme,
      workingSet: status.workspaceFiles,
      modelInfo: this.state.state.activeAgentModels?.pulse,
    });
    const output = await this.agents.pulse.generateTests(
      context,
      readme,
      status.level || "medium",
    );
    writeOutput(projectName, "tests.md", output);

    materializeForgeFiles(projectName, output, {
      pathAllowList: [/\.test\./i, /tests?\//i],
    });
    const testRun = runProjectTests(projectName);

    if (!testRun.passed) {
      setProjectStatus(projectName, {
        stage: "architecture",
        stageOwner: STAGE_RESPONSIBLE_AGENT.architecture,
        blockedReason: { code: "tests_failed", message: testRun.summary },
        pulseActionItems: testRun.actionItems,
      });
      return null;
    }
    return output;
  }

  // ─── Nova, Scout, Apex Intake ────────────────────────────────

  async novaGeneratesIdeas(capacityFull) {
    if (capacityFull) return false;

    const queue = loadQueue();
    const revisions = queue.filter((p) => p.status === "pending_revision");

    // Address revisions first
    if (revisions.length > 0) {
      log(
        "nova",
        `Processing ${revisions.length} revision(s) requested by APEX...`,
      );
      for (const p of revisions) {
        const refined = await this.agents.nova.refineProposal(
          p,
          p.apexFeedback,
        );
        const currentQueue = loadQueue();
        const idx = currentQueue.findIndex((x) => x.id === p.id);
        if (idx >= 0) {
          currentQueue[idx] = {
            ...currentQueue[idx],
            ...refined,
            status: "pending_scout",
            apexFeedback: null,
            revisionCount: (currentQueue[idx].revisionCount || 0) + 1,
            proposedAt: new Date().toISOString(), // refresh timestamp
          };
          saveQueue(currentQueue);
          log("nova", `🔄 Refined Idea: ${refined.title}`);
        }
      }
      return true; // Return early after doing revisions, let them propagate
    }

    log("nova", "Thinking of new ideas...");
    const existing = getProjects().join(", ");
    const proposals = await this.agents.nova.generateProposals(
      `Existing projects: ${existing}`,
      HIVE_FORCED_LEVEL,
    );
    if (!Array.isArray(proposals)) return false;

    for (const p of proposals) {
      if (this.duplicates.isDuplicate(p.title, p.description).isDuplicate)
        continue;
      const queue = loadQueue();
      queue.push({
        ...p,
        id: `prop_${Date.now()}`,
        status: "pending_scout",
        proposedAt: new Date().toISOString(),
      });
      saveQueue(queue);
      log("nova", `💡 Idea: ${p.title}`);
    }
    return true;
  }

  async scoutValidatesProposals(capacityFull) {
    const pending = loadQueue().filter((p) => p.status === "pending_scout");
    if (!pending.length) return;

    for (const p of pending) {
      log("scout", `Researching ${p.title} (${p.level})`);
      const research = await this.agents.scout.research(
        p.description,
        "",
        p.level || "medium",
      );
      const queue = loadQueue();
      const idx = queue.findIndex((x) => x.id === p.id);
      queue[idx].status = "pending_apex";
      queue[idx].scoutNotes = research;
      saveQueue(queue);
    }
  }

  async apexReviewsAndDecides({ blockApprovals }) {
    if (blockApprovals) return;
    const pending = loadQueue().filter((p) => p.status === "pending_apex");
    if (!pending.length) return;

    for (const p of pending) {
      // Use the specialized reviewProposal method instead of raw think
      const review = await this.agents.apex.reviewProposal(p);
      const queue = loadQueue();
      const idx = queue.findIndex((x) => x.id === p.id);

      if (review.decision === "APPROVED") {
        queue[idx].status = "approved";
        this._initProject(p, review.reasoning);
      } else if (review.decision === "REVISION_REQUESTED") {
        queue[idx].status = "pending_revision";
        queue[idx].apexFeedback = review.feedback;
      } else {
        queue[idx].status = "rejected";
      }
      saveQueue(queue);
    }
  }

  _initProject(proposal, decisionReason) {
    const slug = proposal.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const dir = path.join(PROJECTS_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "README.md"),
      `# ${proposal.title}\n\n**Level:** ${proposal.level || "Medium"}\n\n${proposal.description}`,
    );
    setProjectStatus(slug, {
      stage: "approved",
      proposedBy: "nova",
      level: proposal.level || "medium",
      approvedAt: new Date().toISOString(),
      preferredStack: proposal.preferredStack,
      template: proposal.template,
    });
    log(
      "apex",
      `📁 Created project: ${slug} (Level: ${proposal.level || "medium"})`,
    );
  }

  // ─── Helpers: Deadlines, Maintenance, Bridge ─────────────────

  async checkDeadlines() {
    const overdue = this.deadlines.getOverdue();
    for (const task of overdue) {
      log(
        "apex",
        `⚠ Overdue: ${task.projectName} stage ${task.stage} assigned to ${task.agent}`,
      );
      delete this.state.state.agentLastRun[task.agent];
      this.state.save();
    }
  }

  cleanupOldRuns() {
    const retentionDays = Number(process.env.HIVE_RUNS_RETENTION_DAYS || 7);
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    // ... basic fs.rm logic omitted for brevity in this draft but implemented in the real tool ...
  }

  async processCeoBridge() {
    const bridge = loadCeoBridge();
    const pending = bridge.messages.filter(
      (m) => m.from === "ceo" && !m.handledAt,
    );
    for (const m of pending) {
      log("apex", `CEO command: ${m.message}`);
      m.handledAt = new Date().toISOString();
      // Simple pong for now
      bridge.messages.push({
        from: "apex",
        message: "Acknowledged. I am on it.",
        at: new Date().toISOString(),
        inReplyTo: m.id,
      });
    }
    saveCeoBridge(bridge);
  }

  _deferToApex(projectName, stage, stageInfo, run, risk, model) {
    finalizeRunArtifact(projectName, run.runId, {
      outcome: "deferred",
      risk,
      project: projectName,
      stage,
    });
    setProjectStatus(projectName, {
      blockedReason: { message: "High risk action requires APEX approval" },
    });
    return { haltProjectThisCycle: true };
  }

  _transitionToNext(projectName, stage, stageInfo, run, risk, model) {
    const updates = {
      stage: stageInfo.next,
      stageOwner: STAGE_RESPONSIBLE_AGENT[stageInfo.next],
      lastHandoffRunId: run.runId,
    };
    setProjectStatus(projectName, updates);
    finalizeRunArtifact(projectName, run.runId, {
      outcome: "approved",
      rationale: "Stage complete",
      project: projectName,
      stage,
    });
  }
}

module.exports = { AutonomousRunner };
