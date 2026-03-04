"use strict";
/**
 * core/runner/deadlines.js
 * ───────────────────────
 * Monitors agent task deadlines and identifies overdue projects.
 */

const fs = require("fs");
const path = require("path");
const { DEADLINES_FILE } = require("./config");

class DeadlineTracker {
  constructor() {
    this.deadlines = this._load();
  }

  _load() {
    if (fs.existsSync(DEADLINES_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(DEADLINES_FILE, "utf8"));
      } catch {
        // Fall through
      }
    }
    return [];
  }

  _save() {
    fs.mkdirSync(path.dirname(DEADLINES_FILE), { recursive: true });
    fs.writeFileSync(DEADLINES_FILE, JSON.stringify(this.deadlines, null, 2));
  }

  /**
   * Set a deadline for a specific project task.
   * Overwrites if the project/stage tuple already exists.
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

    const idx = this.deadlines.findIndex((d) => d.id === deadline.id);
    if (idx >= 0) this.deadlines[idx] = deadline;
    else this.deadlines.push(deadline);

    this._save();
    return deadline;
  }

  /**
   * Mark a task as completed on time.
   */
  complete(projectName, stage) {
    const d = this.deadlines.find((d) => d.id === `${projectName}::${stage}`);
    if (d) {
      d.status = "complete";
      d.completedAt = new Date().toISOString();
      this._save();
    }
  }

  /**
   * Find all active tasks where the due time has passed.
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

  /**
   * Helper to show human-friendly time until due.
   */
  hoursRemaining(dueAt) {
    const diff = (new Date(dueAt) - Date.now()) / 3600000;
    return precision(diff, 1);
  }
}

function precision(num, dec) {
  const f = Math.pow(10, dec);
  return Math.round(num * f) / f;
}

module.exports = { DeadlineTracker };
