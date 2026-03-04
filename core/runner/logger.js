"use strict";
/**
 * core/runner/logger.js
 * ─────────────────────
 * Colour-coded console + rotating daily log file output.
 * Every agent and system message goes through `log()`.
 */

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

/** Maps agent name → chalk colour function for terminal output. */
const AGENT_COLORS = {
  apex: chalk.yellow,
  scout: chalk.cyan,
  forge: chalk.green,
  lens: chalk.magenta,
  pulse: chalk.red,
  echo: chalk.blue,
  atlas: chalk.blueBright,
  sage: chalk.white,
  nova: chalk.yellowBright,
  system: chalk.gray,
};

/** Root directory for log files (repo-root/logs/). */
const LOGS_DIR = path.join(__dirname, "..", "..", "logs");

/**
 * Log a message from an agent or the system.
 *
 * @param {string} agent - Agent name ("forge", "system", etc.)
 * @param {string} msg   - Human-readable message body
 * @param {"info"|"warn"|"error"} [type] - Severity hint (currently cosmetic)
 */
function log(agent, msg, type = "info") {
  const color = AGENT_COLORS[agent] || chalk.white;
  const time = new Date().toLocaleTimeString();

  // Pretty-print to console
  console.log(
    `${chalk.gray(time)} ${color(`[${agent.toUpperCase()}]`)} ${msg}`,
  );

  // Persist to a daily rotating file so runs are auditable
  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(LOGS_DIR, `${today}-autonomous.log`);
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.appendFileSync(
    logFile,
    `[${new Date().toISOString()}] [${agent.toUpperCase()}] ${msg}\n`,
  );
}

module.exports = { log };
