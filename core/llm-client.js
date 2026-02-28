/**
 * Multi-provider LLM Client
 * Supports OpenRouter + Groq with provider-specific model maps.
 * Backward-compatible export name is kept as OpenRouterClient.
 */

const { OpenRouter } = require("@openrouter/sdk");
const GroqModule = require("groq-sdk");
const Groq = GroqModule.default || GroqModule;

const SUPPORTED_PROVIDERS = ["openrouter", "groq", "local"];
const DEFAULT_PROVIDER = normalizeProvider(
  process.env.LLM_PROVIDER || "openrouter",
);

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
    apex: "DeepSeek-Coder-V2",
    nova: "DeepSeek-Coder-V2",
    scout: "DeepSeek-Coder-V2",
    atlas: "DeepSeek-Coder-V2",
    forge: "DeepSeek-Coder-V2",
    lens: "DeepSeek-Coder-V2",
    pulse: "DeepSeek-Coder-V2",
    sage: "DeepSeek-Coder-V2",
    echo: "DeepSeek-Coder-V2",
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
  local: [
    "DeepSeek-Coder-V2",
    "DeepSeek-Coder-V2",
    "DeepSeek-Coder-V2",
    "DeepSeek-Coder-V2",
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeProvider(provider) {
  const normalized = String(provider || "")
    .trim()
    .toLowerCase();
  if (SUPPORTED_PROVIDERS.includes(normalized)) return normalized;
  return "openrouter";
}

function buildAgentModels(provider) {
  const selected = normalizeProvider(provider);
  const models = { ...PROVIDER_DEFAULT_MODELS[selected] };

  Object.keys(models).forEach((agentName) => {
    const upperAgent = agentName.toUpperCase();
    const providerPrefix = selected.toUpperCase();
    const providerEnvKey = `${providerPrefix}_MODEL_${upperAgent}`;
    const globalEnvKey = `MODEL_${upperAgent}`;
    const legacyOpenRouterEnvKey = `OPENROUTER_MODEL_${upperAgent}`;

    models[agentName] =
      process.env[providerEnvKey] ||
      process.env[globalEnvKey] ||
      (selected === "openrouter" ? process.env[legacyOpenRouterEnvKey] : "") ||
      models[agentName];
  });

  return models;
}

class LLMClient {
  constructor(opts = {}) {
    const options = typeof opts === "string" ? { apiKey: opts } : opts;
    this.provider = normalizeProvider(
      options.provider || process.env.LLM_PROVIDER || DEFAULT_PROVIDER,
    );
    this.agentModels = buildAgentModels(this.provider);
    this.fallbackModels = [...PROVIDER_FALLBACK_MODELS[this.provider]];
    this.localBaseUrl = String(
      options.localBaseUrl ||
        process.env.LOCAL_LLM_BASE_URL ||
        process.env.OLLAMA_BASE_URL ||
        "http://localhost:11434",
    ).replace(/\/+$/, "");

    this.apiKey =
      options.apiKey ||
      (this.provider === "groq"
        ? process.env.GROQ_API_KEY
        : this.provider === "openrouter"
          ? process.env.OPENROUTER_API_KEY
          : "");

    if (this.provider !== "local" && !this.apiKey) {
      const keyName =
        this.provider === "groq" ? "GROQ_API_KEY" : "OPENROUTER_API_KEY";
      throw new Error(`${keyName} is not set. Check your .env file.`);
    }

    if (this.provider === "local") {
      this.sdk = null;
    } else if (this.provider === "groq") {
      this.sdk = new Groq({ apiKey: this.apiKey });
    } else {
      this.sdk = new OpenRouter({ apiKey: this.apiKey });
    }
  }

  async chat(agentName, messages, opts = {}) {
    const primaryModel = opts.model || this.agentModels[agentName];
    if (!primaryModel) throw new Error(`Unknown agent: ${agentName}`);

    const modelChain = [
      primaryModel,
      ...this.fallbackModels.filter((m) => m !== primaryModel),
    ];

    let lastError;
    for (const model of modelChain) {
      try {
        const result = await this._callWithRetry(model, messages, opts);
        if (model !== primaryModel) {
          console.log(
            `  [${agentName.toUpperCase()}] Used ${this.provider} fallback model: ${model}`,
          );
        }
        return result;
      } catch (err) {
        lastError = err;
        if (!this._shouldFallback(err)) {
          throw err;
        }
        const firstLine = String(err.message || "").split("\n")[0];
        console.log(
          `  [${agentName.toUpperCase()}] ${model} unavailable (${firstLine}). Trying next...`,
        );
      }
    }

    throw new Error(
      `All ${this.provider} models failed for ${agentName}: ${lastError?.message}`,
    );
  }

  async _callWithRetry(model, messages, opts = {}, maxRetries = 5) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (this.provider === "local") {
          const response = await fetch(`${this.localBaseUrl}/api/chat`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              model,
              messages,
              stream: false,
              options: {
                temperature: opts.temperature ?? 0.7,
                num_predict: opts.maxTokens || 2048,
                top_p: opts.topP ?? 1,
              },
            }),
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(
              `Local API error (${response.status}): ${body.slice(0, 500)}`,
            );
          }

          const json = await response.json();
          return json?.message?.content || "";
        } else if (this.provider === "groq") {
          const response = await this.sdk.chat.completions.create({
            model,
            messages,
            temperature: opts.temperature ?? 0.7,
            max_completion_tokens: opts.maxTokens || 2048,
            top_p: opts.topP ?? 1,
            stream: false,
            ...(opts.reasoningEffort
              ? { reasoning_effort: opts.reasoningEffort }
              : {}),
          });
          return response.choices?.[0]?.message?.content || "";
        }

        const response = await this.sdk.chat.send({
          chatGenerationParams: {
            model,
            messages,
            max_tokens: opts.maxTokens || 2048,
            temperature: opts.temperature ?? 0.7,
          },
          httpReferer: "https://github.com/hive-mind",
          xTitle: "Hive Mind Multi-Agent",
        });
        return response.choices?.[0]?.message?.content || "";
      } catch (err) {
        const isTransient = this._isTransientError(err);
        if (
          (this._isRateLimitError(err) || isTransient) &&
          attempt < maxRetries
        ) {
          const waitMs = isTransient
            ? Math.min(15000, Math.pow(2, attempt) * 3000) // 3s, 6s, 12s, 15s...
            : Math.pow(2, attempt) * 5000;
          const reason = isTransient ? "connection error" : "rate limit";
          console.log(
            `  [${model}] ${reason} on attempt ${attempt + 1}/${maxRetries}. Retrying in ${waitMs / 1000}s...`,
          );
          await sleep(waitMs);
          continue;
        }
        throw err;
      }
    }
  }

  _errorCode(err) {
    const raw =
      err?.statusCode ??
      err?.status ??
      err?.code ??
      err?.error?.code ??
      err?.response?.status ??
      "";

    const direct = Number(raw);
    if (Number.isFinite(direct) && direct > 0) return direct;

    const msg = String(err?.message || "");
    const byLabel = msg.match(/\b(?:error|status)\s*\(?(\d{3})\)?/i);
    if (byLabel?.[1]) return Number(byLabel[1]);

    const any3xx4xx5xx = msg.match(/\b([1-5]\d{2})\b/);
    if (any3xx4xx5xx?.[1]) return Number(any3xx4xx5xx[1]);

    return raw;
  }

  _isRateLimitError(err) {
    const code = this._errorCode(err);
    const msg = String(err?.message || "").toLowerCase();
    return (
      code === 429 ||
      msg.includes("rate limit") ||
      msg.includes("too many requests") ||
      msg.includes("429")
    );
  }

  _isTransientError(err) {
    const msg = String(err?.message || "").toLowerCase();
    return (
      msg.includes("fetch failed") ||
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("socket hang up") ||
      msg.includes("etimedout") ||
      msg.includes("network error") ||
      msg.includes("connect timeout") ||
      msg.includes("failed to fetch")
    );
  }

  _shouldFallback(err) {
    const code = this._errorCode(err);
    const msg = String(err?.message || "").toLowerCase();
    return (
      code === 429 ||
      code === 402 ||
      code === 404 ||
      code === 408 ||
      code === 500 ||
      code === 502 ||
      code === 503 ||
      code === 504 ||
      msg.includes("429") ||
      msg.includes("rate") ||
      msg.includes("no endpoints") ||
      msg.includes("spend limit") ||
      msg.includes("insufficient credits") ||
      msg.includes("temporarily unavailable") ||
      msg.includes("connect") ||
      msg.includes("econnrefused") ||
      msg.includes("socket hang up") ||
      (msg.includes("model") && msg.includes("not found"))
    );
  }

  getModelForAgent(agentName) {
    return this.agentModels[agentName];
  }

  listAgents() {
    return Object.keys(this.agentModels);
  }
}

const AGENT_MODELS = buildAgentModels("openrouter");
const ACTIVE_AGENT_MODELS = buildAgentModels(DEFAULT_PROVIDER);

module.exports = {
  LLMClient,
  OpenRouterClient: LLMClient, // Backward-compatible alias
  AGENT_MODELS,
  ACTIVE_AGENT_MODELS,
  buildAgentModels,
  SUPPORTED_PROVIDERS,
};
