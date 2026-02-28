/**
 * Hive Orchestrator
 * Coordinates all agents, manages project flow, handles proposals & approvals
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const ApexAgent = require("../agents/apex");
const {
  ScoutAgent,
  ForgeAgent,
  LensAgent,
  PulseAgent,
  EchoAgent,
  AtlasAgent,
  SageAgent,
  NovaAgent,
} = require("../agents/agents");

const PROJECTS_DIR = path.join(__dirname, "..", "projects");
const HIVE_DIR = path.join(__dirname, "..", ".hive");
const QUEUE_FILE = path.join(HIVE_DIR, "queue.json");

class HiveOrchestrator {
  constructor() {
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

    fs.mkdirSync(HIVE_DIR, { recursive: true });
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  // ─── Run full pipeline on a task ──────────────────────────────

  async runTask(taskDescription) {
    console.log(`\n🚀 Starting Hive pipeline for: "${taskDescription}"\n`);

    // 1. NOVA proposes, APEX reviews
    const proposal = {
      title: taskDescription,
      description: taskDescription,
      proposedBy: "human",
      goal: taskDescription,
      complexity: "Unknown",
    };

    const decision = await this.agents.apex.reviewProposal(proposal);
    if (decision.decision === "REJECTED") {
      console.log("\n❌ APEX rejected this task. Halting pipeline.");
      console.log(`   Reason: ${decision.reasoning}`);
      return;
    }

    if (decision.decision === "REVISION_REQUESTED") {
      console.log("\n🔄 APEX requests revision before proceeding.");
      console.log(`   Feedback: ${decision.feedback}`);
      return;
    }

    // 2. SCOUT researches
    console.log("\n📚 SCOUT is researching...\n");
    const research = await this.agents.scout.research(taskDescription);
    console.log(research);

    // 3. ATLAS designs architecture
    console.log("\n🏗️ ATLAS is designing the architecture...\n");
    const architecture = await this.agents.atlas.design(
      taskDescription,
      research,
    );
    console.log(architecture);

    // 4. FORGE implements
    console.log("\n⚒️ FORGE is implementing...\n");
    const code = await this.agents.forge.implement(
      taskDescription,
      architecture,
      research,
    );
    console.log(code);

    // 5. LENS reviews
    console.log("\n🔍 LENS is reviewing the code...\n");
    const review = await this.agents.lens.review(code, taskDescription);
    console.log(review);

    // 6. PULSE tests
    console.log("\n🧪 PULSE is writing tests...\n");
    const tests = await this.agents.pulse.generateTests(code, taskDescription);
    console.log(tests);

    // 7. SAGE documents
    console.log("\n📖 SAGE is writing documentation...\n");
    const docs = await this.agents.sage.writeReadme({
      name: taskDescription,
      description: taskDescription,
      stack: "Node.js",
    });
    console.log(docs);

    // 8. Save project
    this._saveProjectOutput(taskDescription, {
      research,
      architecture,
      code,
      review,
      tests,
      docs,
    });

    console.log("\n✅ Pipeline complete!\n");
  }

  // ─── Run project from folder ──────────────────────────────────

  async runProject(projectName) {
    const projectDir = path.join(PROJECTS_DIR, projectName);
    const readmePath = path.join(projectDir, "README.md");
    const statusPath = path.join(projectDir, "status.json");

    if (!fs.existsSync(projectDir)) {
      console.error(`❌ Project folder not found: ${projectDir}`);
      console.log(`   Create it with: mkdir projects/${projectName}`);
      return;
    }

    if (!fs.existsSync(readmePath)) {
      console.error(`❌ No README.md found in ${projectDir}`);
      console.log("   Add a README.md describing the project.");
      return;
    }

    const readme = fs.readFileSync(readmePath, "utf8");
    const status = fs.existsSync(statusPath)
      ? JSON.parse(fs.readFileSync(statusPath, "utf8"))
      : { stage: "new" };

    console.log(`\n📁 Loading project: ${projectName}`);
    console.log(`   Current stage: ${status.stage}\n`);

    // Extract project info from README
    const proposal = {
      title: projectName,
      description: readme.slice(0, 5000),
      proposedBy: status.proposedBy || "human",
      goal: readme,
    };

    // If new project, get APEX approval first
    if (status.stage === "new") {
      const decision = await this.agents.apex.reviewProposal(proposal);
      this._updateProjectStatus(projectName, {
        stage:
          decision.decision === "APPROVED"
            ? "approved"
            : decision.decision.toLowerCase(),
        apexDecision: decision,
      });

      if (decision.decision !== "APPROVED") {
        console.log(
          `\nProject halted at APEX review. Check status.json for details.`,
        );
        return;
      }
    }

    // Continue pipeline based on stage
    await this._continueProjectPipeline(projectName, readme, status);
  }

  async _continueProjectPipeline(projectName, readme, status) {
    const projectDir = path.join(PROJECTS_DIR, projectName);
    const outputDir = path.join(projectDir, "output");
    fs.mkdirSync(outputDir, { recursive: true });

    const stages = [
      "research",
      "architecture",
      "implementation",
      "review",
      "tests",
      "docs",
      "launch",
    ];
    const currentIdx = stages.indexOf(
      status.stage === "approved" ? "research" : status.stage,
    );

    for (let i = Math.max(0, currentIdx); i < stages.length; i++) {
      const stage = stages[i];
      console.log(`\n── Stage: ${stage.toUpperCase()} ──`);

      let output = "";

      switch (stage) {
        case "research":
          output = await this.agents.scout.research(readme);
          fs.writeFileSync(path.join(outputDir, "research.md"), output);
          break;

        case "architecture":
          const research = this._readOutput(outputDir, "research.md");
          output = await this.agents.atlas.design(readme, research);
          fs.writeFileSync(path.join(outputDir, "architecture.md"), output);
          break;

        case "implementation":
          const arch = this._readOutput(outputDir, "architecture.md");
          const res = this._readOutput(outputDir, "research.md");
          output = await this.agents.forge.implement(readme, arch, res);
          fs.writeFileSync(path.join(outputDir, "implementation.md"), output);
          break;

        case "review":
          const impl = this._readOutput(outputDir, "implementation.md");
          output = await this.agents.lens.review(impl, readme);
          fs.writeFileSync(path.join(outputDir, "review.md"), output);
          break;

        case "tests":
          const code = this._readOutput(outputDir, "implementation.md");
          output = await this.agents.pulse.generateTests(code, readme);
          fs.writeFileSync(path.join(outputDir, "tests.md"), output);
          break;

        case "docs":
          output = await this.agents.sage.writeReadme({
            name: projectName,
            description: readme,
          });
          fs.writeFileSync(path.join(outputDir, "docs.md"), output);
          break;

        case "launch":
          output = await this.agents.echo.createLaunchContent({
            name: projectName,
            description: readme,
          });
          fs.writeFileSync(path.join(outputDir, "launch.md"), output);
          break;
      }

      this._updateProjectStatus(projectName, {
        stage,
        completedAt: new Date().toISOString(),
      });
      console.log(`✅ ${stage} complete → saved to output/${stage}.md`);
    }

    console.log(`\n🎉 Project "${projectName}" pipeline complete!`);
    console.log(`   All outputs in: projects/${projectName}/output/`);
  }

  _readOutput(dir, file) {
    const p = path.join(dir, file);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  }

  // ─── Proposal queue ───────────────────────────────────────────

  async submitProposal(proposal) {
    const queue = this._loadQueue();
    proposal.id = `prop_${Date.now()}`;
    proposal.submittedAt = new Date().toISOString();
    proposal.status = "pending";
    queue.push(proposal);
    this._saveQueue(queue);
    console.log(
      `\n📬 Proposal "${proposal.title}" added to queue (ID: ${proposal.id})`,
    );
    console.log(`   Run "node hive.js review" to have APEX evaluate it.`);
  }

  async runApexReview() {
    const queue = this._loadQueue().filter((p) => p.status === "pending");

    if (!queue.length) {
      console.log("\n📭 No pending proposals in queue.");
      return;
    }

    console.log(`\n📋 APEX reviewing ${queue.length} pending proposal(s)...\n`);

    for (const proposal of queue) {
      const decision = await this.agents.apex.reviewProposal(proposal);
      proposal.status = decision.decision.toLowerCase();
      proposal.decision = decision;

      if (decision.decision === "APPROVED") {
        // Create project folder
        await this._createProjectFolder(proposal);
      }
    }

    this._saveQueue(
      this._loadQueue().map((p) => {
        const updated = queue.find((q) => q.id === p.id);
        return updated || p;
      }),
    );
  }

  async _createProjectFolder(proposal) {
    const slug = proposal.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50);
    const dir = path.join(PROJECTS_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });

    const readme = `# ${proposal.title}

> Proposed by: ${proposal.proposedBy?.toUpperCase() || "UNKNOWN"}  
> Approved by: APEX  
> Status: In Progress

## Description

${proposal.description}

## Goal

${proposal.goal || "See description above."}

## Complexity

${proposal.complexity || "To be determined"}

---

*This project was auto-created by Hive Mind after APEX approval.*
*Edit this README to add more details before running the pipeline.*
`;

    fs.writeFileSync(path.join(dir, "README.md"), readme);
    fs.writeFileSync(
      path.join(dir, "status.json"),
      JSON.stringify(
        {
          stage: "approved",
          proposedBy: proposal.proposedBy,
          approvedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    console.log(`\n📁 Created project folder: projects/${slug}/`);
    console.log(`   Run: node hive.js run --project ${slug}`);
  }

  // ─── Status ───────────────────────────────────────────────────

  async showStatus() {
    console.log("\n📊 HIVE MIND STATUS\n" + "═".repeat(40));

    // Projects
    const projects = fs.readdirSync(PROJECTS_DIR).filter((f) => {
      return (
        fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory() &&
        !f.startsWith("_")
      );
    });

    console.log(`\n📁 Projects (${projects.length}):`);
    for (const p of projects) {
      const statusFile = path.join(PROJECTS_DIR, p, "status.json");
      const status = fs.existsSync(statusFile)
        ? JSON.parse(fs.readFileSync(statusFile))
        : {};
      console.log(`  • ${p} — ${status.stage || "new"}`);
    }

    // Queue
    const queue = this._loadQueue();
    const pending = queue.filter((q) => q.status === "pending");
    console.log(`\n📬 Pending proposals: ${pending.length}`);
    pending.forEach((p) => console.log(`  • "${p.title}" by ${p.proposedBy}`));

    console.log("");
  }

  // ─── Interactive mode ─────────────────────────────────────────

  async runInteractive() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const ask = (q) => new Promise((r) => rl.question(q, r));

    console.log("Welcome to Hive Mind! What would you like to do?\n");
    console.log("  1. Run a task through all agents");
    console.log("  2. Work on an existing project");
    console.log("  3. Submit a new proposal");
    console.log("  4. APEX reviews pending queue");
    console.log("  5. Show status");
    console.log("  6. Exit\n");

    const choice = await ask("Choice (1-6): ");

    switch (choice.trim()) {
      case "1":
        const task = await ask("Describe the task: ");
        await this.runTask(task);
        break;
      case "2":
        const proj = await ask("Project name: ");
        await this.runProject(proj);
        break;
      case "3":
        const title = await ask("Proposal title: ");
        const desc = await ask("Description: ");
        await this.submitProposal({
          title,
          description: desc,
          proposedBy: "human",
        });
        break;
      case "4":
        await this.runApexReview();
        break;
      case "5":
        await this.showStatus();
        break;
    }

    rl.close();
  }

  async chatWithAgent(agentName) {
    const agent = this.agents[agentName.toLowerCase()];
    if (!agent) {
      console.error(
        `Unknown agent: ${agentName}. Valid: ${Object.keys(this.agents).join(", ")}`,
      );
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log(`\nChatting with ${agent.displayName}. Type 'exit' to quit.\n`);

    const ask = () => {
      rl.question("You: ", async (input) => {
        if (input.toLowerCase() === "exit") {
          rl.close();
          return;
        }
        const response = await agent.think(input);
        agent.print(response);
        ask();
      });
    };
    ask();
  }

  // ─── Helpers ──────────────────────────────────────────────────

  _loadQueue() {
    if (!fs.existsSync(QUEUE_FILE)) return [];
    try {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
    } catch {
      return [];
    }
  }

  _saveQueue(queue) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  }

  _updateProjectStatus(projectName, updates) {
    const statusFile = path.join(PROJECTS_DIR, projectName, "status.json");
    let status = {};
    if (fs.existsSync(statusFile)) {
      try {
        status = JSON.parse(fs.readFileSync(statusFile));
      } catch {}
    }
    Object.assign(status, updates);
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  }

  _saveProjectOutput(name, outputs) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50);
    const dir = path.join(PROJECTS_DIR, slug, "output");
    fs.mkdirSync(dir, { recursive: true });
    for (const [key, val] of Object.entries(outputs)) {
      fs.writeFileSync(path.join(dir, `${key}.md`), val);
    }
  }
}

module.exports = HiveOrchestrator;
