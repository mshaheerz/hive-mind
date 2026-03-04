"use strict";
/**
 * core/llm-client.js
 * ──────────────────
 * Backward-compatibility bridge for the LLM client.
 * New code should prefer core/llm/client.js and core/llm/models.js.
 */

const { LLMClient } = require("./llm/client");
const { buildAgentModels, SUPPORTED_PROVIDERS } = require("./llm/models");

module.exports = {
  LLMClient,
  OpenRouterClient: LLMClient, // Legacy alias
  buildAgentModels,
  SUPPORTED_PROVIDERS,
  ACTIVE_AGENT_MODELS: buildAgentModels(
    process.env.LLM_PROVIDER || "openrouter",
  ),
};
