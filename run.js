"use strict";
/**
 * run.js
 * ──────
 * Entry point for the Hive Mind Autonomous Runner.
 *
 * This file handles CLI argument parsing, environment setup,
 * and boots the AutonomousRunner engine.
 *
 * Usage:
 *   node run.js --provider groq
 */

require("dotenv").config();
const { AutonomousRunner } = require("./core/runner/orchestrator");

/** CLI options helper. */
function printUsage() {
  console.log(`
Usage: node run.js [options]

Starts the autonomous Hive runner.

Options:
  --provider <provider>  LLM provider (openrouter|groq|local|ollama)
  -h, --help             Display this help message
`);
}

/** CLI argument resolver for --provider. */
function resolveProviderArg(argv) {
  const args = argv || [];
  const direct = args.find((a) => a.startsWith("--provider="));
  if (direct) return direct.split("=")[1];
  const idx = args.indexOf("--provider");
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return "";
}

// ─── Main Execution ───────────────────────────────────────────────────────────

const ARGS = process.argv.slice(2);

if (ARGS.includes("-h") || ARGS.includes("--help")) {
  printUsage();
  process.exit(0);
}

const providerArg = resolveProviderArg(ARGS);
if (providerArg) {
  process.env.LLM_PROVIDER = providerArg.toLowerCase();
}

// Boot the autonomous orchestrator
const runner = new AutonomousRunner();

runner.start().catch((err) => {
  console.error("\n[CRITICAL ERROR] Runner failed to start:");
  console.error(err);
  process.exit(1);
});
