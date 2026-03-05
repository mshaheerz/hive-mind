"use strict";
/**
 * core/runner/state.js
 * ────────────────────
 * Manages the global autonomous runner state, agent cadences, and stats.
 */

const fs = require("fs");
const path = require("path");
const { STATE_FILE, AGENT_SCHEDULE } = require("./config");

const MIN_AGENT_CADENCE_MINUTES = 1;
const MAX_AGENT_CADENCE_MINUTES = 120;

class AutonomousState {
  constructor() {
    this.state = this._load();
  }

  _load() {
    if (fs.existsSync(STATE_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      } catch {
        // Fall through to default
      }
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
      llmProvider: process.env.LLM_PROVIDER || "openrouter",
      activeAgentModels: {},
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

    // Forge always runs fast to keep implementation loops tight
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

    // Adaptive cadence: speed up on success, slow down on failure
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
    if (this.state.stats && this.state.stats[stat] !== undefined) {
      this.state.stats[stat]++;
      this.save();
    }
  }
}

module.exports = { AutonomousState };
