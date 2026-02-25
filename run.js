/**
 * HIVE AUTONOMOUS RUNNER
 * Run once: node run.js
 * The agents take over from there — researching, proposing, building.
 *
 * How it works:
 *   Every 5 minutes, the runner checks which agents are "due"
 *   Each agent does their job based on current state
 *   NOVA → SCOUT → APEX discussion → pipeline → repeat
 *   Human can interact any time via: node hive.js [command]
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const chalk = require('chalk');

const ApexAgent  = require('./agents/apex');
const { ScoutAgent, ForgeAgent, LensAgent, PulseAgent,
        EchoAgent, AtlasAgent, SageAgent, NovaAgent } = require('./agents/agents');
const {
  DuplicateDetector,
  DiscussionBoard,
  DeadlineTracker,
  AutonomousState,
  AGENT_SCHEDULE,
} = require('./core/autonomous');

const PROJECTS_DIR = path.join(__dirname, 'projects');
const QUEUE_FILE   = path.join(__dirname, '.hive', 'queue.json');

// ─── Check interval: every 5 minutes ──────────────────────────
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────
const log = (agent, msg, type = 'info') => {
  const colors = {
    apex: chalk.yellow, scout: chalk.cyan, forge: chalk.green,
    lens: chalk.magenta, pulse: chalk.red, echo: chalk.blue,
    atlas: chalk.blueBright, sage: chalk.white, nova: chalk.yellowBright,
    system: chalk.gray,
  };
  const color = colors[agent] || chalk.white;
  const time  = new Date().toLocaleTimeString();
  console.log(`${chalk.gray(time)} ${color(`[${agent.toUpperCase()}]`)} ${msg}`);

  // Also write to log file
  const today   = new Date().toISOString().split('T')[0];
  const logFile = path.join(__dirname, 'logs', `${today}-autonomous.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] [${agent.toUpperCase()}] ${msg}\n`);
};

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch { return []; }
}

function saveQueue(q) {
  fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2));
}

function getProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR).filter(f => {
    const d = path.join(PROJECTS_DIR, f);
    return fs.statSync(d).isDirectory() && !f.startsWith('_');
  });
}

function getProjectStatus(name) {
  const sf = path.join(PROJECTS_DIR, name, 'status.json');
  if (!fs.existsSync(sf)) return { stage: 'new' };
  try { return JSON.parse(fs.readFileSync(sf)); } catch { return { stage: 'new' }; }
}

function setProjectStatus(name, updates) {
  const dir = path.join(PROJECTS_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  const sf  = path.join(dir, 'status.json');
  let status = {};
  if (fs.existsSync(sf)) { try { status = JSON.parse(fs.readFileSync(sf)); } catch {} }
  Object.assign(status, updates, { updatedAt: new Date().toISOString() });
  fs.writeFileSync(sf, JSON.stringify(status, null, 2));
}

function readOutput(projectName, file) {
  const p = path.join(PROJECTS_DIR, projectName, 'output', file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function writeOutput(projectName, file, content) {
  const dir = path.join(PROJECTS_DIR, projectName, 'output');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
}

// ─── Main Autonomous Runner ───────────────────────────────────
class AutonomousRunner {
  constructor() {
    this.state      = new AutonomousState();
    this.duplicates = new DuplicateDetector();
    this.discussion = new DiscussionBoard();
    this.deadlines  = new DeadlineTracker();

    this.agents = {
      apex:  new ApexAgent(),
      scout: new ScoutAgent(),
      forge: new ForgeAgent(),
      lens:  new LensAgent(),
      pulse: new PulseAgent(),
      echo:  new EchoAgent(),
      atlas: new AtlasAgent(),
      sage:  new SageAgent(),
      nova:  new NovaAgent(),
    };
  }

  // ─── Entry point ────────────────────────────────────────────

  async start() {
    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.yellow('  🦾 HIVE MIND — Autonomous Mode       ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));

    log('system', 'Autonomous runner started. Agents will work on their schedules.');
    log('system', `Check interval: every ${CHECK_INTERVAL_MS / 60000} minutes`);
    log('system', 'Press Ctrl+C to stop. Human commands still work in another terminal.\n');

    this.state.state.running = true;
    this.state.save();

    // Run immediately on start
    await this.cycle();

    // Then on interval
    this.intervalId = setInterval(async () => {
      await this.cycle();
    }, CHECK_INTERVAL_MS);

    // Graceful shutdown
    process.on('SIGINT', () => {
      log('system', 'Shutting down gracefully...');
      clearInterval(this.intervalId);
      this.state.state.running = false;
      this.state.save();
      process.exit(0);
    });
  }

  // ─── Deadline enforcement ────────────────────────────────────

  async checkDeadlines() {
    const overdue = this.deadlines.getOverdue();
    if (!overdue.length) return;

    log('apex', `⚠ ${overdue.length} overdue task(s) detected`);
    for (const task of overdue) {
      const hoursLate = ((Date.now() - new Date(task.dueAt)) / 3600000).toFixed(1);
      log('apex', `  • "${task.projectName}" → ${task.stage} (${task.agent.toUpperCase()} is ${hoursLate}h late)`);

      setProjectStatus(task.projectName, {
        deadlineMissed: true,
        missedStage: task.stage,
        missedAgent: task.agent,
        missedAt: new Date().toISOString(),
      });

      // Wake the responsible agent by clearing their last-run timestamp
      delete this.state.state.agentLastRun[task.agent];
      this.state.save();
      log('apex', `  → Waking ${task.agent.toUpperCase()} to retry`);
    }
  }

  // ─── One full cycle ─────────────────────────────────────────

  async cycle() {
    this.state.state.cycleCount++;
    this.state.state.lastCycle = new Date().toISOString();
    this.state.save();

    log('system', `\n── Cycle #${this.state.state.cycleCount} ─────────────────────────`);

    try {
      // 1. Check & enforce deadlines
      await this.checkDeadlines();

      // 2. NOVA generates new ideas (if due)
      if (this.state.isAgentDue('nova')) {
        await this.novaGeneratesIdeas();
        this.state.markAgentRun('nova');
      }

      // 3. SCOUT validates pending proposals (if due)
      if (this.state.isAgentDue('scout')) {
        await this.scoutValidatesProposals();
        this.state.markAgentRun('scout');
      }

      // 4. APEX reviews validated proposals (if due)
      if (this.state.isAgentDue('apex')) {
        await this.apexReviewsAndDecides();
        this.state.markAgentRun('apex');
      }

      // 5. Advance active projects through pipeline
      await this.advanceProjects();

    } catch (err) {
      log('system', `Cycle error: ${err.message}`);
    }
  }

  // ─── NOVA: Generate new ideas autonomously ──────────────────

  async novaGeneratesIdeas() {
    log('nova', 'Waking up... thinking of new project ideas');

    // Give NOVA context about existing projects to avoid duplication
    const existingProjects = getProjects().join(', ') || 'none yet';
    const existingIdeas    = this.duplicates.index.ideas.map(i => i.title).join(', ') || 'none yet';

    const context = `Existing projects: ${existingProjects}. Already proposed ideas: ${existingIdeas}.
Do NOT propose anything similar to these. Think of genuinely new, useful developer tools or automation projects.`;

    let proposals;
    try {
      proposals = await this.agents.nova.generateProposals(context);
      if (!Array.isArray(proposals)) throw new Error('Invalid response format');
    } catch (err) {
      log('nova', `Failed to generate proposals: ${err.message}`);
      return;
    }

    let newCount = 0;
    for (const proposal of proposals) {
      if (!proposal.title || !proposal.description) continue;

      // Duplicate check
      const dupCheck = this.duplicates.isDuplicate(proposal.title, proposal.description);
      if (dupCheck.isDuplicate) {
        log('nova', `⚠ Skipping "${proposal.title}" — too similar to "${dupCheck.similarTo.title}" (${(dupCheck.similarity * 100).toFixed(0)}% match)`);
        this.state.increment('duplicatesBlocked');
        continue;
      }

      // Add to queue
      const queue = loadQueue();
      const id    = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      queue.push({
        id,
        title:       proposal.title,
        description: proposal.description,
        goal:        proposal.problem,
        audience:    proposal.audience,
        complexity:  proposal.complexity,
        reasoning:   proposal.reasoning,
        proposedBy:  'nova',
        proposedAt:  new Date().toISOString(),
        status:      'pending_scout', // SCOUT validates first
      });
      saveQueue(queue);
      this.duplicates.register(proposal.title, proposal.description, 'idea');
      this.state.increment('proposed');
      newCount++;

      log('nova', `💡 Proposed: "${proposal.title}" (${proposal.complexity})`);
    }

    if (newCount === 0) {
      log('nova', 'No new unique ideas this cycle. Resting.');
    } else {
      log('nova', `✓ Submitted ${newCount} new proposal(s) for SCOUT review. Going to rest.`);
    }
  }

  // ─── SCOUT: Validate & research proposals ───────────────────

  async scoutValidatesProposals() {
    const queue    = loadQueue();
    const pending  = queue.filter(p => p.status === 'pending_scout');

    if (!pending.length) {
      log('scout', 'No proposals to validate. Resting.');
      return;
    }

    log('scout', `Validating ${pending.length} proposal(s)...`);

    for (const proposal of pending) {
      log('scout', `Researching: "${proposal.title}"`);

      try {
        const research = await this.agents.scout.research(
          `${proposal.title}: ${proposal.description}`,
          `Problem it solves: ${proposal.goal}. Audience: ${proposal.audience}`
        );

        // SCOUT posts findings to a discussion thread
        const threadId = proposal.id;
        this.discussion.startThread(threadId, proposal.title);
        this.discussion.post(threadId, 'nova', `I propose: ${proposal.description}. Reasoning: ${proposal.reasoning}`);
        this.discussion.post(threadId, 'scout', `Research findings:\n${research.slice(0, 600)}`);

        // Update proposal with research
        const idx = queue.findIndex(p => p.id === proposal.id);
        queue[idx].status       = 'pending_apex';
        queue[idx].scoutNotes   = research.slice(0, 800);
        queue[idx].threadId     = threadId;
        queue[idx].scoutedAt    = new Date().toISOString();

        log('scout', `✓ Research complete for "${proposal.title}". Forwarding to APEX.`);
      } catch (err) {
        log('scout', `✗ Failed to research "${proposal.title}": ${err.message}`);
      }
    }

    saveQueue(queue);
    log('scout', 'Done validating. Going to rest.');
  }

  // ─── APEX: Review, discuss, decide ──────────────────────────

  async apexReviewsAndDecides() {
    const queue   = loadQueue();
    const pending = queue.filter(p => p.status === 'pending_apex');

    if (!pending.length) {
      // Check active projects for any blockers
      log('apex', 'No pending proposals. Checking project health...');
      await this.apexChecksProjectHealth();
      return;
    }

    log('apex', `Reviewing ${pending.length} proposal(s)...`);

    for (const proposal of pending) {
      try {
        // APEX reads the discussion thread
        const thread = this.discussion.getThread(proposal.threadId || proposal.id);
        const discussion = thread ? this.discussion.formatThread(thread) : '';

        // APEX adds their own input before deciding
        const apexThought = await this.agents.apex.agents?.nova
          ? '' // don't self-consult
          : await this.agents.scout.think(
              `Given this discussion about "${proposal.title}", what are the key concerns an operations head should weigh?\nDiscussion:\n${discussion}`,
              []
            );

        if (thread && apexThought) {
          this.discussion.post(proposal.threadId, 'apex', apexThought.slice(0, 400));
        }

        // Make the decision
        const decision = await this.agents.apex.reviewProposal({
          ...proposal,
          additionalContext: `Scout research notes:\n${proposal.scoutNotes || ''}\n\nTeam discussion:\n${discussion}`,
        });

        const idx = queue.findIndex(p => p.id === proposal.id);
        queue[idx].decision   = decision;
        queue[idx].decidedAt  = new Date().toISOString();

        if (decision.decision === 'APPROVED') {
          queue[idx].status = 'approved';
          this.state.increment('approved');
          this.discussion.closeThread(proposal.id, 'APPROVED');

          // Create project folder
          await this.createProjectFolder(proposal, decision);
          log('apex', `✅ APPROVED: "${proposal.title}" — folder created`);

        } else if (decision.decision === 'REJECTED') {
          queue[idx].status = 'rejected';
          this.state.increment('rejected');
          this.discussion.closeThread(proposal.id, `REJECTED: ${decision.reasoning}`);
          log('apex', `❌ REJECTED: "${proposal.title}" — ${decision.reasoning}`);

        } else {
          // REVISION_REQUESTED — NOVA will see this and resubmit
          queue[idx].status          = 'needs_revision';
          queue[idx].revisionFeedback = decision.feedback;
          this.discussion.post(proposal.id, 'apex', `Revision needed: ${decision.feedback}`);
          log('apex', `🔄 REVISION REQUESTED: "${proposal.title}"`);
        }

      } catch (err) {
        log('apex', `Error reviewing "${proposal.title}": ${err.message}`);
      }
    }

    saveQueue(queue);
    log('apex', 'Reviews complete. Going to rest.');
  }

  // ─── APEX: Health check on active projects ───────────────────

  async apexChecksProjectHealth() {
    const overdue = this.deadlines.getOverdue();
    if (!overdue.length) return;

    log('apex', `⚠ Found ${overdue.length} overdue task(s)!`);

    for (const task of overdue) {
      const hoursLate = ((Date.now() - new Date(task.dueAt)) / 3600000).toFixed(1);
      log('apex', `  • "${task.projectName}" → ${task.stage} (${task.agent.toUpperCase()} is ${hoursLate}h late)`);

      // Mark as overdue, pipeline will retry next cycle
      setProjectStatus(task.projectName, {
        deadlineMissed: true,
        missedStage: task.stage,
        missedAgent: task.agent,
        missedAt: new Date().toISOString(),
      });

      // "Wake up" the responsible agent by clearing their last-run
      delete this.state.state.agentLastRun[task.agent];
      this.state.save();
      log('apex', `  → Reassigning ${task.stage} to ${task.agent.toUpperCase()} (deadline reset)`);
    }
  }

  // ─── Create project folder (AI-initiated) ───────────────────

  async createProjectFolder(proposal, decision) {
    const slug = proposal.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    const dir = path.join(PROJECTS_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });

    const readme = `# ${proposal.title}

> **Proposed by:** NOVA (AI-generated)  
> **Approved by:** APEX  
> **Approval score:** ${decision.overall}/10  
> **Status:** In Progress  
> **Created:** ${new Date().toLocaleDateString()}

## What It Does

${proposal.description}

## Problem It Solves

${proposal.goal || 'See description above.'}

## Target Audience

${proposal.audience || 'Developers'}

## Complexity

${proposal.complexity || 'Medium'}

## Why Build This

${proposal.reasoning || 'Identified as a valuable addition by the Hive team.'}

## APEX Reasoning

${decision.reasoning}

## Definition of Done

- [ ] Core functionality implemented
- [ ] LENS code review passed
- [ ] PULSE tests passing
- [ ] SAGE documentation complete
- [ ] ECHO launch content ready

---
*This project was autonomously proposed by NOVA and approved by APEX.*  
*Human contributions welcome — edit this README to add requirements.*
`;

    fs.writeFileSync(path.join(dir, 'README.md'), readme);
    setProjectStatus(slug, {
      stage: 'approved',
      proposedBy: 'nova',
      approvedBy: 'apex',
      approvalScore: decision.overall,
      approvedAt: new Date().toISOString(),
    });

    this.duplicates.register(proposal.title, proposal.description, 'project');
    log('apex', `📁 Created: projects/${slug}/`);
    return slug;
  }

  // ─── Advance projects through the pipeline ──────────────────

  async advanceProjects() {
    const projects = getProjects();

    for (const name of projects) {
      const status = getProjectStatus(name);

      // Skip completed, failed, or projects pending approval
      if (['complete', 'failed', 'new'].includes(status.stage)) continue;

      // Map stages to agents
      const stageMap = {
        approved:       { agent: 'atlas',  next: 'research',        agentKey: 'scout' },
        research:       { agent: 'atlas',  next: 'architecture',    agentKey: 'atlas' },
        architecture:   { agent: 'forge',  next: 'implementation',  agentKey: 'forge' },
        implementation: { agent: 'lens',   next: 'review',          agentKey: 'lens'  },
        review:         { agent: 'pulse',  next: 'tests',           agentKey: 'pulse' },
        tests:          { agent: 'sage',   next: 'docs',            agentKey: 'sage'  },
        docs:           { agent: 'echo',   next: 'launch',          agentKey: 'echo'  },
        launch:         { agent: null,     next: 'complete',        agentKey: null    },
      };

      const stageInfo = stageMap[status.stage];
      if (!stageInfo || !stageInfo.agentKey) {
        if (status.stage !== 'complete') {
          setProjectStatus(name, { stage: 'complete' });
          this.state.increment('completed');
          log('system', `🎉 Project "${name}" is COMPLETE!`);
        }
        continue;
      }

      // Only proceed if the responsible agent is due
      if (!this.state.isAgentDue(stageInfo.agentKey)) continue;

      await this.runProjectStage(name, status.stage, stageInfo, status);
      this.state.markAgentRun(stageInfo.agentKey);
    }
  }

  async runProjectStage(projectName, stage, stageInfo, status) {
    const readmePath = path.join(PROJECTS_DIR, projectName, 'README.md');
    const readme     = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

    log(stageInfo.agentKey, `Working on "${projectName}" → ${stage}`);

    // Set a deadline for this stage
    const hoursMap = { scout: 2, atlas: 3, forge: 6, lens: 2, pulse: 2, sage: 2, echo: 1 };
    this.deadlines.set(projectName, stageInfo.next, stageInfo.agentKey, hoursMap[stageInfo.agentKey] || 4);

    try {
      let output = '';

      switch (stage) {
        case 'approved':
          output = await this.agents.scout.research(readme);
          writeOutput(projectName, 'research.md', output);
          break;

        case 'research':
          const research = readOutput(projectName, 'research.md');
          output = await this.agents.atlas.design(readme, research);
          writeOutput(projectName, 'architecture.md', output);
          break;

        case 'architecture':
          const arch = readOutput(projectName, 'architecture.md');
          const res  = readOutput(projectName, 'research.md');
          output = await this.agents.forge.implement(readme, arch, res);
          writeOutput(projectName, 'implementation.md', output);
          break;

        case 'implementation':
          const impl = readOutput(projectName, 'implementation.md');
          output = await this.agents.lens.review(impl, readme);
          writeOutput(projectName, 'review.md', output);

          // Check if LENS approved
          if (output.toLowerCase().includes('needs_changes') || output.toLowerCase().includes('rejected')) {
            log('lens', `⚠ Code issues found in "${projectName}". Sending back to FORGE.`);
            setProjectStatus(projectName, { stage: 'architecture', lensRejected: true });
            this.deadlines.complete(projectName, stageInfo.next);
            return;
          }
          break;

        case 'review':
          const code  = readOutput(projectName, 'implementation.md');
          output = await this.agents.pulse.generateTests(code, readme);
          writeOutput(projectName, 'tests.md', output);
          break;

        case 'tests':
          output = await this.agents.sage.writeReadme({ name: projectName, description: readme });
          writeOutput(projectName, 'docs.md', output);
          break;

        case 'docs':
          output = await this.agents.echo.createLaunchContent({
            name: projectName,
            description: readme,
            features: readOutput(projectName, 'docs.md').slice(0, 300),
          });
          writeOutput(projectName, 'launch.md', output);
          break;
      }

      this.deadlines.complete(projectName, stageInfo.next);
      setProjectStatus(projectName, { stage: stageInfo.next });
      log(stageInfo.agentKey, `✓ "${projectName}" → moved to "${stageInfo.next}"`);

    } catch (err) {
      log(stageInfo.agentKey, `✗ Error on "${projectName}" at ${stage}: ${err.message}`);
    }
  }
}

// ─── Start ────────────────────────────────────────────────────

const runner = new AutonomousRunner();
runner.start().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});