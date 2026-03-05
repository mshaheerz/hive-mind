"use strict";
/**
 * core/llm/client.js
 * ──────────────────
 * Multi-provider LLM Client logic. Handles retries, chunking, and streaming.
 */

const { OpenRouter } = require("@openrouter/sdk");
const GroqModule = require("groq-sdk");
const Groq = GroqModule.default || GroqModule;
const {
  normalizeProvider,
  buildAgentModels,
  PROVIDER_FALLBACK_MODELS,
} = require("./models");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Health check for local Ollama. */
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

class LLMClient {
  constructor(opts = {}) {
    const options = typeof opts === "string" ? { apiKey: opts } : opts;
    this.provider = normalizeProvider(
      options.provider || process.env.LLM_PROVIDER || "openrouter",
    );
    this.agentModels = buildAgentModels(this.provider);
    this.fallbackModels = [...(PROVIDER_FALLBACK_MODELS[this.provider] || [])];
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
      throw new Error(`${this.provider.toUpperCase()}_API_KEY is not set.`);
    }

    if (this.provider === "local") {
      this.sdk = null;
    } else if (this.provider === "groq") {
      this.sdk = new Groq({ apiKey: this.apiKey });
    } else {
      this.sdk = new OpenRouter({ apiKey: this.apiKey });
    }
  }

  /**
   * Main chat entry point. Logic for falling back to cheaper/faster models on failure.
   */
  async chat(agentName, messages, opts = {}) {
    let primaryModel = opts.model || this.agentModels[agentName];

    // Tier-based model overrides (Advanced projects get stronger models)
    if (opts.tier === "advanced") {
      const advancedOverrides = {
        openrouter: "anthropic/claude-3-7-sonnet",
        groq: "llama-3.3-70b-versatile",
      };
      if (advancedOverrides[this.provider]) {
        primaryModel = advancedOverrides[this.provider];
      }
    }

    if (!primaryModel) throw new Error(`Unknown agent: ${agentName}`);

    const modelChain = [
      primaryModel,
      ...this.fallbackModels.filter((m) => m !== primaryModel),
    ];

    let fullOutput = "";
    let currentMessages = [...messages];
    let lastError;

    for (const modelData of modelChain) {
      const model = typeof modelData === "string" ? modelData : modelData.id;
      const info =
        typeof modelData === "string" ? { contextWindow: 128000 } : modelData;

      try {
        // ─── Token Awareness & Pruning ─────────────────────────────────────────
        const estimatedTokens = this._estimateTokens(currentMessages);
        const threshold = info.contextWindow * 0.8;

        if (estimatedTokens > threshold) {
          console.log(
            `  [${agentName.toUpperCase()}] ⚠️ Context near limit (${estimatedTokens}/${info.contextWindow}). Pruning history...`,
          );
          currentMessages = this._pruneMessages(
            currentMessages,
            info.contextWindow,
          );
        }

        let result;
        try {
          result = await this._callWithRetry(model, currentMessages, opts);
        } catch (err) {
          // If context is too large, try chunked delivery
          if (this._isEntityTooLargeError(err) && !opts._isChunkRetry) {
            result = await this._handleLargeContext(
              agentName,
              model,
              currentMessages,
              opts,
            );
          } else {
            throw err;
          }
        }

        fullOutput += result.content;

        // Auto-resume if truncated
        let loopCount = 0;
        while (
          (result.finishReason === "length" ||
            result.finishReason === "max_tokens") &&
          loopCount < 3
        ) {
          console.log(
            `  [${agentName.toUpperCase()}] Auto-resuming generation...`,
          );
          currentMessages.push({ role: "assistant", content: result.content });
          currentMessages.push({
            role: "user",
            content:
              "Continue exactly where you left off. Do not repeat previous content.",
          });
          result = await this._callWithRetry(model, currentMessages, opts);
          fullOutput += result.content;
          loopCount++;
        }

        return fullOutput;
      } catch (err) {
        lastError = err;
        if (!this._shouldFallback(err)) throw err;
        console.log(
          `  [${agentName.toUpperCase()}] ${model} error: ${err.message.split("\n")[0]}. Trying fallback...`,
        );
      }
    }
    throw new Error(
      `All models failed for ${agentName}: ${lastError?.message}`,
    );
  }

  async _handleLargeContext(agentName, model, messages, opts) {
    let currentChunkSize = opts.chunkSize || 12000;
    while (currentChunkSize >= 3000) {
      try {
        return await this._chunkedChat(agentName, model, messages, {
          ...opts,
          chunkSize: currentChunkSize,
        });
      } catch (err) {
        if (this._isEntityTooLargeError(err) && currentChunkSize > 3000) {
          currentChunkSize = Math.floor(currentChunkSize / 2);
          continue;
        }
        throw err;
      }
    }
    throw new Error("Request too large even after maximum chunking.");
  }

  async _chunkedChat(agentName, model, messages, opts = {}) {
    let largestIdx = -1;
    let maxLength = -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].content.length > maxLength) {
        maxLength = messages[i].content.length;
        largestIdx = i;
      }
    }

    const originalMessage = messages[largestIdx];
    const chunkSize = opts.chunkSize || 20000;
    const chunks = [];
    for (let i = 0; i < originalMessage.content.length; i += chunkSize) {
      chunks.push(originalMessage.content.substring(i, i + chunkSize));
    }

    let currentHistory = [...messages.slice(0, largestIdx)];
    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      const content = `[CHUNK ${i + 1}/${chunks.length}]\n${chunks[i]}\n\n${
        isLast ? "Process complete context now." : "ACK and wait for next part."
      }`;

      currentHistory.push({ role: originalMessage.role, content });
      const response = await this._callWithRetry(model, currentHistory, {
        ...opts,
        _isChunkRetry: true,
      });

      if (!isLast) {
        currentHistory.push({ role: "assistant", content: response.content });
        await sleep(1000);
      } else {
        return response;
      }
    }
  }

  async _callWithRetry(model, messages, opts = {}, maxRetries = 5) {
    const effectiveMaxRetries = this.provider === "local" ? 3 : maxRetries;
    for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
      try {
        if (this.provider === "local") {
          return await this._callLocal(model, messages, opts);
        } else if (this.provider === "groq") {
          const res = await this.sdk.chat.completions.create({
            model,
            messages,
            temperature: opts.temperature ?? 0.7,
            max_completion_tokens: opts.maxTokens || 8192,
            stream: false,
          });
          return {
            content: res.choices?.[0]?.message?.content || "",
            finishReason: res.choices?.[0]?.finish_reason,
          };
        } else {
          const res = await this.sdk.chat.send({
            chatGenerationParams: {
              model,
              messages,
              max_tokens: opts.maxTokens || 8192,
              temperature: opts.temperature ?? 0.7,
            },
          });
          return {
            content: res.choices?.[0]?.message?.content || "",
            finishReason: res.choices?.[0]?.finish_reason,
          };
        }
      } catch (err) {
        if (this._isTransientError(err) && attempt < effectiveMaxRetries) {
          const wait = Math.pow(2, attempt) * 2000;
          await sleep(wait);
          continue;
        }
        throw err;
      }
    }
  }

  async _callLocal(model, messages, opts) {
    if (!(await pingOllama(this.localBaseUrl)))
      throw new Error("Ollama offline.");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4 * 60 * 1000);
    try {
      const res = await fetch(`${this.localBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          keep_alive: "30m",
          options: {
            temperature: opts.temperature ?? 0.7,
            num_predict: opts.maxTokens || 1536,
          },
        }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      return {
        content: json?.message?.content || "",
        finishReason: json?.done_reason,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  _estimateTokens(messages) {
    const totalChars = messages.reduce(
      (acc, m) => acc + (m.content || "").length,
      0,
    );
    return Math.ceil(totalChars / 4);
  }

  _pruneMessages(messages, limit) {
    if (messages.length <= 5) return messages; // Cannot prune further

    const system = messages.filter((m) => m.role === "system");
    const others = messages.filter((m) => m.role !== "system");

    // Keep the first user message (the task) and the last 4 messages (recent context)
    const firstUser = others[0];
    const recent = others.slice(-4);

    // Filter out intermediate messages that are likely too old
    const preserved = [
      ...system,
      firstUser,
      {
        role: "user",
        content:
          "... [Old conversation history pruned to save context window] ...",
      },
      ...recent,
    ];

    return preserved;
  }

  _isEntityTooLargeError(err) {
    const msg = String(err?.message || "").toLowerCase();
    return (
      msg.includes("too large") ||
      msg.includes("context_length") ||
      msg.includes("413")
    );
  }

  _isTransientError(err) {
    const msg = String(err?.message || "").toLowerCase();
    return (
      msg.includes("fetch failed") ||
      msg.includes("timeout") ||
      msg.includes("connect")
    );
  }

  _shouldFallback(err) {
    const msg = String(err?.message || "").toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate") ||
      msg.includes("unavailable") ||
      msg.includes("not found")
    );
  }
}

module.exports = { LLMClient };
