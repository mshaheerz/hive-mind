"use strict";
/**
 * core/runner/locks.js
 * ─────────────────────
 * Single-process enforcement for the autonomous runner.
 * Prevents two runner instances from fighting over the same projects.
 */

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { RUNNER_LOCK_FILE } = require("./config");

/**
 * Check whether a process with the given PID is still alive.
 * Uses `process.kill(pid, 0)` — the "signal 0" trick — which doesn't
 * actually send a signal but throws if the PID is gone.
 *
 * @param {number} pid
 * @returns {boolean}
 */
function isProcessAlive(pid) {
  if (!pid || pid === process.pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write a lock file containing this process's PID.
 * If a lock file already exists and its PID is still alive, we exit
 * immediately so only one runner runs at a time.
 *
 * Call this at startup before doing any work.
 */
function acquireRunnerLock() {
  fs.mkdirSync(path.dirname(RUNNER_LOCK_FILE), { recursive: true });

  if (fs.existsSync(RUNNER_LOCK_FILE)) {
    try {
      const lock = JSON.parse(fs.readFileSync(RUNNER_LOCK_FILE, "utf8"));
      if (isProcessAlive(lock.pid)) {
        console.log(
          chalk.yellow(
            `Another autonomous runner is already active (pid ${lock.pid}). Exiting this instance.`,
          ),
        );
        process.exit(0);
      }
    } catch {}
  }

  fs.writeFileSync(
    RUNNER_LOCK_FILE,
    JSON.stringify(
      {
        pid: process.pid,
        provider: process.env.LLM_PROVIDER,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
}

/**
 * Remove the lock file if it was written by this process.
 * Called on graceful shutdown so the next start is not blocked.
 */
function releaseRunnerLock() {
  if (!fs.existsSync(RUNNER_LOCK_FILE)) return;
  try {
    const lock = JSON.parse(fs.readFileSync(RUNNER_LOCK_FILE, "utf8"));
    if (lock.pid === process.pid) fs.unlinkSync(RUNNER_LOCK_FILE);
  } catch {}
}

module.exports = { isProcessAlive, acquireRunnerLock, releaseRunnerLock };
