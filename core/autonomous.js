/**
 * Autonomous Agent Loop
 * Agents wake up on a schedule, research, propose, discuss, and build
 * without any human interaction needed.
 *
 * Architecture:
 *   - Each agent has a WORK_SCHEDULE (when they're "awake")
 *   - NOVA wakes up first → generates ideas
 *   - SCOUT validates feasibility → checks for duplicates
 *   - APEX holds a "discussion" then decides
 *   - If approved → full pipeline runs automatically
 *   - Agents can set DEADLINES on tasks
 *   - APEX enforces deadlines and reassigns if missed
 */

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "..", ".hive", "autonomous-state.json");
const PROJECTS_DIR = path.join(__dirname, "..", "projects");
const DISCUSS_DIR = path.join(__dirname, "..", ".hive", "discussions");
const DEADLINES_FILE = path.join(__dirname, "..", ".hive", "deadlines.json");

// ─── Agent Work Schedules ─────────────────────────────────────
// Each agent "wakes" at these intervals (in ms for the loop)
// In real usage these map to: how often they trigger in a cycle
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

const MIN_AGENT_CADENCE_MINUTES = 15;
const MAX_AGENT_CADENCE_MINUTES = 120;

// ─── Duplicate Detection ──────────────────────────────────────
class DuplicateDetector {
  constructor() {
    this.indexFile = path.join(__dirname, "..", ".hive", "idea-index.json");
    this.index = this._load();
  }

  _load() {
    if (fs.existsSync(this.indexFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.indexFile, "utf8"));
      } catch {}
    }
    return { ideas: [], projects: [] };
  }

  _save() {
    fs.writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
  }

  /**
   * Check if an idea is too similar to existing ones
   * Uses keyword overlap scoring (no ML needed)
   */
  isDuplicate(title, description) {
    const incoming = this._keywords(`${title} ${description}`);

    for (const existing of [...this.index.ideas, ...this.index.projects]) {
      const existingKw = this._keywords(
        `${existing.title} ${existing.description}`,
      );
      const overlap = this._overlap(incoming, existingKw);

      if (overlap >= 0.6) {
        return { isDuplicate: true, similarTo: existing, similarity: overlap };
      }
    }
    return { isDuplicate: false };
  }

  register(title, description, type = "idea") {
    const entry = {
      title,
      description: description.slice(0, 2000),
      keywords: this._keywords(`${title} ${description}`),
      registeredAt: new Date().toISOString(),
    };

    if (type === "project") {
      this.index.projects.push(entry);
    } else {
      this.index.ideas.push(entry);
    }
    this._save();
  }

  _keywords(text) {
    const stopwords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "it",
      "its",
      "this",
      "that",
      "these",
      "those",
      "i",
      "we",
      "you",
      "they",
      "he",
      "she",
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w));
  }

  _overlap(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = [...setA].filter((x) => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }
}

// ─── Discussion Board ─────────────────────────────────────────
class DiscussionBoard {
  constructor() {
    fs.mkdirSync(DISCUSS_DIR, { recursive: true });
  }

  /**
   * Start a discussion thread about a proposal
   */
  startThread(proposalId, topic) {
    const thread = {
      id: proposalId,
      topic,
      messages: [],
      startedAt: new Date().toISOString(),
      status: "open",
    };
    this._saveThread(thread);
    return thread;
  }

  /**
   * Agent posts a message to a thread
   */
  post(threadId, agentName, message) {
    const thread = this.getThread(threadId);
    if (!thread) return;

    thread.messages.push({
      from: agentName.toUpperCase(),
      message,
      at: new Date().toISOString(),
    });
    this._saveThread(thread);
  }

  closeThread(threadId, resolution) {
    const thread = this.getThread(threadId);
    if (!thread) return;
    thread.status = "closed";
    thread.resolution = resolution;
    thread.closedAt = new Date().toISOString();
    this._saveThread(thread);
  }

  getThread(id) {
    const f = path.join(DISCUSS_DIR, `${id}.json`);
    if (!fs.existsSync(f)) return null;
    try {
      return JSON.parse(fs.readFileSync(f, "utf8"));
    } catch {
      return null;
    }
  }

  getAllOpen() {
    if (!fs.existsSync(DISCUSS_DIR)) return [];
    return fs
      .readdirSync(DISCUSS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(DISCUSS_DIR, f), "utf8"));
        } catch {
          return null;
        }
      })
      .filter((t) => t && t.status === "open");
  }

  _saveThread(thread) {
    fs.writeFileSync(
      path.join(DISCUSS_DIR, `${thread.id}.json`),
      JSON.stringify(thread, null, 2),
    );
  }

  formatThread(thread) {
    return thread.messages.map((m) => `[${m.from}]: ${m.message}`).join("\n");
  }
}

// ─── Deadline Tracker ─────────────────────────────────────────
class DeadlineTracker {
  constructor() {
    this.deadlines = this._load();
  }

  _load() {
    if (fs.existsSync(DEADLINES_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(DEADLINES_FILE, "utf8"));
      } catch {}
    }
    return [];
  }

  _save() {
    fs.writeFileSync(DEADLINES_FILE, JSON.stringify(this.deadlines, null, 2));
  }

  /**
   * Set a deadline for an agent task
   * @param {string} projectName
   * @param {string} stage  - e.g. 'implementation'
   * @param {string} agent  - e.g. 'forge'
   * @param {number} hours  - hours from now
   */
  set(projectName, stage, agent, hours) {
    const deadline = {
      id: `${projectName}::${stage}`,
      projectName,
      stage,
      agent,
      dueAt: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
      setAt: new Date().toISOString(),
      status: "active",
    };

    // Replace if exists
    const idx = this.deadlines.findIndex((d) => d.id === deadline.id);
    if (idx >= 0) this.deadlines[idx] = deadline;
    else this.deadlines.push(deadline);

    this._save();
    return deadline;
  }

  complete(projectName, stage) {
    const d = this.deadlines.find((d) => d.id === `${projectName}::${stage}`);
    if (d) {
      d.status = "complete";
      d.completedAt = new Date().toISOString();
      this._save();
    }
  }

  /**
   * Get all overdue tasks
   */
  getOverdue() {
    const now = new Date();
    return this.deadlines.filter(
      (d) => d.status === "active" && new Date(d.dueAt) < now,
    );
  }

  getActive() {
    return this.deadlines.filter((d) => d.status === "active");
  }

  hoursUntil(dueAt) {
    return ((new Date(dueAt) - Date.now()) / 3600000).toFixed(1);
  }
}

// ─── Autonomous State ─────────────────────────────────────────
class AutonomousState {
  constructor() {
    this.state = this._load();
  }

  _load() {
    if (fs.existsSync(STATE_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      } catch {}
    }
    return {
      running: false,
      lastCycle: null,
      cycleCount: 0,
      agentLastRun: {},
      agentCadenceMinutes: {},
      stats: {
        proposed: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        duplicatesBlocked: 0,
      },
    };
  }

  save() {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  getCycleMinutes(agentName) {
    const base = AGENT_SCHEDULE[agentName]?.cycleMinutes || 60;
    const override = this.state.agentCadenceMinutes?.[agentName];
    const candidate = Number.isFinite(override) ? override : base;
    if (agentName === "forge") return 15;
    return Math.max(
      MIN_AGENT_CADENCE_MINUTES,
      Math.min(MAX_AGENT_CADENCE_MINUTES, candidate),
    );
  }

  markAgentRun(agentName, meta = {}) {
    const { worked = false, success = true, retryImmediately = false } = meta;
    if (retryImmediately) {
      delete this.state.agentLastRun[agentName];
    } else {
      this.state.agentLastRun[agentName] = new Date().toISOString();
    }

    if (!this.state.agentCadenceMinutes) this.state.agentCadenceMinutes = {};
    if (agentName === "forge") {
      this.state.agentCadenceMinutes[agentName] = 15;
      this.save();
      return;
    }

    const current = this.getCycleMinutes(agentName);

    if (worked && success) {
      this.state.agentCadenceMinutes[agentName] = Math.max(
        MIN_AGENT_CADENCE_MINUTES,
        current - 15,
      );
    } else if (worked && !success) {
      this.state.agentCadenceMinutes[agentName] = Math.min(
        MAX_AGENT_CADENCE_MINUTES,
        current + 15,
      );
    } else if (!Number.isFinite(this.state.agentCadenceMinutes[agentName])) {
      this.state.agentCadenceMinutes[agentName] = current;
    }

    this.save();
  }

  isAgentDue(agentName) {
    const last = this.state.agentLastRun[agentName];
    if (!last) return true;
    const cycleMinutes = this.getCycleMinutes(agentName);
    const minutesSince = (Date.now() - new Date(last)) / 60000;
    return minutesSince >= cycleMinutes;
  }

  increment(stat) {
    if (this.state.stats[stat] !== undefined) {
      this.state.stats[stat]++;
      this.save();
    }
  }
}

module.exports = {
  DuplicateDetector,
  DiscussionBoard,
  DeadlineTracker,
  AutonomousState,
  AGENT_SCHEDULE,
};
