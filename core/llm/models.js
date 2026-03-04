"use strict";
/**
 * core/llm/models.js
 * ──────────────────
 * Defines model maps and fallback lists for each supported provider.
 */

const PROVIDER_DEFAULT_MODELS = {
  openrouter: {
    apex: "arcee-ai/trinity-large-preview:free",
    nova: "stepfun/step-3.5-flash:free",
    scout: "z-ai/glm-4.5-air:free",
    atlas: "nvidia/nemotron-3-nano-30b-a3b:free",
    forge: "upstage/solar-pro-3:free",
    lens: "openai/gpt-oss-120b:free",
    pulse: "arcee-ai/trinity-mini:free",
    sage: "nvidia/nemotron-nano-12b-v2-vl:free",
    echo: "z-ai/glm-4.5-air:free",
  },
  groq: {
    apex: "groq/compound",
    nova: "groq/compound-mini",
    scout: "llama-3.3-70b-versatile",
    atlas: "meta-llama/llama-4-scout-17b-16e-instruct",
    forge: "openai/gpt-oss-120b",
    lens: "openai/gpt-oss-120b",
    pulse: "openai/gpt-oss-20b",
    sage: "moonshotai/kimi-k2-instruct",
    echo: "llama-3.1-8b-instant",
  },
  local: {
    // Override with LOCAL_MODEL env var in .env
    apex: "qwen2.5-coder:3b-instruct",
    nova: "qwen2.5-coder:3b-instruct",
    scout: "qwen2.5-coder:3b-instruct",
    atlas: "qwen2.5-coder:3b-instruct",
    forge: "qwen2.5-coder:3b-instruct",
    lens: "qwen2.5-coder:3b-instruct",
    pulse: "qwen2.5-coder:3b-instruct",
    sage: "qwen2.5-coder:3b-instruct",
    echo: "qwen2.5-coder:3b-instruct",
  },
};

const PROVIDER_FALLBACK_MODELS = {
  openrouter: [
    "arcee-ai/trinity-mini:free",
    "stepfun/step-3.5-flash:free",
    "z-ai/glm-4.5-air:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
  ],
  groq: [
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
  ],
  local: [],
};

const SUPPORTED_PROVIDERS = ["openrouter", "groq", "local"];

/**
 * Metadata for common models to handle context management and optimization.
 * Inspired by Cline's model info system.
 */
const MODEL_INFO = {
  // Anthropic
  "anthropic/claude-3-7-sonnet": {
    contextWindow: 200000,
    maxTokens: 128000,
    supportsImages: true,
    supportsReasoning: true,
  },
  "anthropic/claude-3-5-sonnet": {
    contextWindow: 200000,
    maxTokens: 8192,
    supportsImages: true,
  },

  // Meta
  "meta-llama/llama-3.3-70b-instruct": {
    contextWindow: 128000,
    maxTokens: 4096,
  },
  "meta-llama/llama-3.1-8b-instant": { contextWindow: 128000, maxTokens: 4096 },

  // Qwen
  "qwen/qwen2.5-coder-32b-instruct": { contextWindow: 128000, maxTokens: 8192 },

  // Default values for common unknown models
  default: {
    contextWindow: 128000,
    maxTokens: 4096,
    supportsImages: false,
    supportsReasoning: false,
  },
};

function getModelInfo(modelId) {
  // Check for exact match
  if (MODEL_INFO[modelId]) return MODEL_INFO[modelId];

  // Check for partial match (provider/family)
  for (const [key, info] of Object.entries(MODEL_INFO)) {
    if (key !== "default" && modelId.startsWith(key)) return info;
  }

  return MODEL_INFO.default;
}

function normalizeProvider(provider) {
  const normalized = String(provider || "")
    .trim()
    .toLowerCase();
  if (SUPPORTED_PROVIDERS.includes(normalized)) return normalized;
  return "openrouter";
}

/**
 * Merges defaults with environment variable overrides.
 * Overrides follow: PROVIDER_MODEL_AGENT > MODEL_AGENT > GLOBAL_MODEL.
 */
function buildAgentModels(provider) {
  const selected = normalizeProvider(provider);
  const models = { ...PROVIDER_DEFAULT_MODELS[selected] };
  const globalLocalModel = process.env.LOCAL_MODEL;

  const result = {};

  Object.keys(models).forEach((agentName) => {
    const upperAgent = agentName.toUpperCase();
    const providerPrefix = selected.toUpperCase();

    // e.g. GROQ_MODEL_FORGE
    const providerEnvKey = `${providerPrefix}_MODEL_${upperAgent}`;
    // e.g. MODEL_FORGE
    const globalEnvKey = `MODEL_${upperAgent}`;
    // Support legacy naming
    const legacyOpenRouterEnvKey = `OPENROUTER_MODEL_${upperAgent}`;

    let id;
    if (selected === "local") {
      id =
        process.env[providerEnvKey] ||
        process.env[globalEnvKey] ||
        globalLocalModel ||
        models[agentName];
    } else {
      id =
        process.env[providerEnvKey] ||
        process.env[globalEnvKey] ||
        (selected === "openrouter"
          ? process.env[legacyOpenRouterEnvKey]
          : "") ||
        models[agentName];
    }

    result[agentName] = {
      id,
      ...getModelInfo(id),
    };
  });

  return result;
}

module.exports = {
  SUPPORTED_PROVIDERS,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_FALLBACK_MODELS,
  MODEL_INFO,
  normalizeProvider,
  buildAgentModels,
  getModelInfo,
};
