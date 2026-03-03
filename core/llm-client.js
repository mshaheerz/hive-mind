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
    // All agents use the same model locally to avoid Ollama reloading
    // Override with LOCAL_MODEL env var or LOCAL_MODEL_<AGENT> per agent
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
  local: [], // No fallbacks for local — single model, no swapping
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Quick health check for local Ollama — avoids hanging on a busy/down instance.
 * Returns true if Ollama is reachable, false otherwise.
 */
async function pingOllama(baseUrl, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

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

  // For local: allow a single LOCAL_MODEL env var to override all agents
  const globalLocalModel = process.env.LOCAL_MODEL;

  Object.keys(models).forEach((agentName) => {
    const upperAgent = agentName.toUpperCase();
    const providerPrefix = selected.toUpperCase();
    const providerEnvKey = `${providerPrefix}_MODEL_${upperAgent}`;
    const globalEnvKey = `MODEL_${upperAgent}`;
    const legacyOpenRouterEnvKey = `OPENROUTER_MODEL_${upperAgent}`;

    if (selected === "local") {
      // Per-agent override > global LOCAL_MODEL > default
      models[agentName] =
        process.env[providerEnvKey] ||
        process.env[globalEnvKey] ||
        globalLocalModel ||
        models[agentName];
    } else {
      models[agentName] =
        process.env[providerEnvKey] ||
        process.env[globalEnvKey] ||
        (selected === "openrouter"
          ? process.env[legacyOpenRouterEnvKey]
          : "") ||
        models[agentName];
    }
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

    let fullOutput = "";
    let currentMessages = [...messages];

    let lastError;
    for (const model of modelChain) {
      try {
        let result;

        try {
          result = await this._callWithRetry(model, currentMessages, opts);
        } catch (err) {
          if (this._isEntityTooLargeError(err) && !opts._isChunkRetry) {
            const totalLen = this._totalLength(currentMessages);
            let currentChunkSize = opts.chunkSize || 12000;
            let lastChunkErr;

            while (currentChunkSize >= 3000) {
              console.log(
                `  [${agentName.toUpperCase()}] ${model} error: Request too large (${Math.round(totalLen / 1024)} KB). Attempting chunked delivery (Chunk size: ${Math.round(currentChunkSize / 1024)} KB)...`,
              );
              try {
                result = await this._chunkedChat(
                  agentName,
                  model,
                  currentMessages,
                  { ...opts, chunkSize: currentChunkSize },
                );
                lastChunkErr = null;
                break; // Found a size that works!
              } catch (chunkErr) {
                lastChunkErr = chunkErr;
                if (
                  this._isEntityTooLargeError(chunkErr) &&
                  currentChunkSize > 3000
                ) {
                  currentChunkSize = Math.floor(currentChunkSize / 2);
                  console.log(
                    `  [${agentName.toUpperCase()}] Chunk still too large for ${model}. Reducing size to ${Math.round(currentChunkSize / 1024)} KB...`,
                  );
                  continue;
                }
                throw chunkErr;
              }
            }
            if (lastChunkErr) throw lastChunkErr;
          } else {
            throw err;
          }
        }

        fullOutput += result.content;

        let loopCount = 0;
        // Automatically continue if the AI hit the token length limit
        while (
          (result.finishReason === "length" ||
            result.finishReason === "max_tokens") &&
          loopCount < 3
        ) {
          console.log(
            `  [${agentName.toUpperCase()}] Token limit reached on ${model}. Auto-resuming generation...`,
          );
          currentMessages.push({ role: "assistant", content: result.content });
          currentMessages.push({
            role: "user",
            content:
              "Continue exactly where you left off. Do not repeat previous content or add new markdown blocks unless opening a new file.",
          });
          result = await this._callWithRetry(model, currentMessages, opts);
          fullOutput += result.content;
          loopCount++;
        }

        if (model !== primaryModel) {
          console.log(
            `  [${agentName.toUpperCase()}] Used ${this.provider} fallback model: ${model}`,
          );
        }
        return fullOutput;
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

  async _chunkedChat(agentName, model, messages, opts = {}) {
    // Identify the largest message to split (usually the user task/workspace dump)
    let largestIdx = -1;
    let maxLength = -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].content.length > maxLength) {
        maxLength = messages[i].content.length;
        largestIdx = i;
      }
    }

    if (largestIdx === -1 || maxLength < 4000) {
      throw new Error(
        `Request too large but no large message found to chunk (Max=${maxLength}).`,
      );
    }

    const originalMessage = messages[largestIdx];
    // Conservative chunk size to avoid provider HTTP/token limits
    const chunkSize = opts.chunkSize || 20000;
    const chunks = [];
    for (let i = 0; i < originalMessage.content.length; i += chunkSize) {
      chunks.push(originalMessage.content.substring(i, i + chunkSize));
    }

    console.log(
      `  [${agentName.toUpperCase()}] Splitting large message into ${chunks.length} chunks of ~${Math.round(chunkSize / 1024)}KB.`,
    );

    let currentHistory = [...messages.slice(0, largestIdx)];

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      const content = `[CHUNK ${i + 1}/${chunks.length}]\n${chunks[i]}\n\n${
        isLast
          ? "This is the final part. Please process the complete context above and perform the requested task now according to the original instructions."
          : `There is more context coming in message ${i + 2}. Just reply with a brief "ACK PART ${i + 1}" and nothing else.`
      }`;

      currentHistory.push({ role: originalMessage.role, content });

      const response = await this._callWithRetry(model, currentHistory, {
        ...opts,
        _isChunkRetry: true,
      });

      if (!isLast) {
        currentHistory.push({ role: "assistant", content: response.content });
        // Slow down slightly to avoid rate limits during chunking storm
        await sleep(1500);
      } else {
        return response;
      }
    }
  }

  _totalLength(messages) {
    return messages.reduce((acc, m) => acc + (m.content || "").length, 0);
  }

  _isEntityTooLargeError(err) {
    const code = this._errorCode(err);
    const msg = String(err?.message || "").toLowerCase();
    return (
      code === 413 ||
      msg.includes("too large") ||
      msg.includes("too_large") ||
      msg.includes("request_too_large") ||
      msg.includes("context_length_exceeded") ||
      msg.includes("maximum context length") ||
      msg.includes("413")
    );
  }

  async _callWithRetry(model, messages, opts = {}, maxRetries = 5) {
    // Local Ollama: fewer retries with shorter waits — long waits kill the cycle
    const effectiveMaxRetries = this.provider === "local" ? 3 : maxRetries;
    for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
      try {
        if (this.provider === "local") {
          // ── Pre-call health check: fail fast if Ollama is unreachable ──
          const ollamaAlive = await pingOllama(this.localBaseUrl);
          if (!ollamaAlive) {
            throw new Error(
              `Ollama unreachable at ${this.localBaseUrl}. Is 'ollama serve' running?`,
            );
          }

          // ── Hard timeout: abort if model takes >4 minutes ──
          const ctrl = new AbortController();
          const abortTimer = setTimeout(() => ctrl.abort(), 4 * 60 * 1000);

          let response;
          try {
            response = await fetch(`${this.localBaseUrl}/api/chat`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              signal: ctrl.signal,
              body: JSON.stringify({
                model,
                messages,
                stream: false,
                keep_alive: "30m", // Keep model loaded to avoid reload between agents
                options: {
                  temperature: opts.temperature ?? 0.7,
                  num_predict: opts.maxTokens || 1536, // Capped for speed on consumer hardware
                  top_p: opts.topP ?? 1,
                },
              }),
            });
          } finally {
            clearTimeout(abortTimer);
          }

          if (!response.ok) {
            const body = await response.text();
            throw new Error(
              `Local API error (${response.status}): ${body.slice(0, 1000)}`,
            );
          }

          const json = await response.json();
          return {
            content: json?.message?.content || "",
            finishReason: json?.done_reason || json?.finish_reason,
          };
        } else if (this.provider === "groq") {
          const response = await this.sdk.chat.completions.create({
            model,
            messages,
            temperature: opts.temperature ?? 0.7,
            max_completion_tokens: opts.maxTokens || 8192,
            top_p: opts.topP ?? 1,
            stream: false,
            ...(opts.reasoningEffort
              ? { reasoning_effort: opts.reasoningEffort }
              : {}),
          });
          return {
            content: response.choices?.[0]?.message?.content || "",
            finishReason: response.choices?.[0]?.finish_reason,
          };
        }

        const response = await this.sdk.chat.send({
          chatGenerationParams: {
            model,
            messages,
            max_tokens: opts.maxTokens || 8192,
            temperature: opts.temperature ?? 0.7,
          },
          httpReferer: "https://github.com/hive-mind",
          xTitle: "Hive Mind Multi-Agent",
        });
        return {
          content: response.choices?.[0]?.message?.content || "",
          finishReason: response.choices?.[0]?.finish_reason,
        };
      } catch (err) {
        const isTransient = this._isTransientError(err);
        const isAborted = err?.name === "AbortError";
        if (isAborted) {
          console.log(
            `  [${model}] ⏱ Request timed out after 4 minutes. Ollama may be overloaded.`,
          );
          throw new Error(
            `Local LLM timeout: ${model} took >4 minutes to respond.`,
          );
        }
        if (
          (this._isRateLimitError(err) || isTransient) &&
          attempt < effectiveMaxRetries
        ) {
          // Shorter waits for local: 5s, 10s, 20s (not 3s, 6s, 12s, 15s)
          const waitMs =
            this.provider === "local"
              ? Math.min(20000, Math.pow(2, attempt) * 5000)
              : isTransient
                ? Math.min(15000, Math.pow(2, attempt) * 3000)
                : Math.pow(2, attempt) * 5000;
          const reason = isTransient ? "connection error" : "rate limit";
          console.log(
            `  [${model}] ${reason} on attempt ${attempt + 1}/${effectiveMaxRetries}. Retrying in ${waitMs / 1000}s...`,
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
