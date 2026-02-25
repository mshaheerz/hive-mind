/**
 * OpenRouter API Client
 * Wraps the OpenRouter API for all agents
 * - Each agent uses a DIFFERENT model to avoid rate limits
 * - Automatic retry with exponential backoff on 429
 * - Fallback model chain if primary is rate-limited
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Every agent gets a DIFFERENT model — spreads rate limit quota across providers
// All support system prompts. Verified free tier as of 2026.
const AGENT_MODELS = {
  apex:  'nousresearch/hermes-3-llama-3.1-405b:free',       // Hermes 405B  — best reasoning
  nova:  'mistralai/mistral-small-3.1-24b-instruct:free',   // Mistral 24B  — creative proposals
  scout: 'meta-llama/llama-3.1-8b-instruct:free',           // Llama 3.1 8B — research
  atlas: 'qwen/qwen-2.5-72b-instruct:free',                 // Qwen 72B     — architecture
  forge: 'meta-llama/llama-3.2-3b-instruct:free',           // Llama 3.2 3B — coding
  lens:  'qwen/qwen-2.5-coder-32b-instruct:free',           // Qwen Coder   — code review
  pulse: 'mistralai/mistral-7b-instruct:free',               // Mistral 7B   — testing
  sage:  'nousresearch/hermes-3-llama-3.1-405b:free',       // Hermes 405B  — documentation
  echo:  'meta-llama/llama-3.1-8b-instruct:free',           // Llama 3.1 8B — social media
};

// Fallback chain — if primary is 429, try these in order
const FALLBACK_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'meta-llama/llama-3.1-8b-instruct:free',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set. Check your .env file.');
    }
  }

  /**
   * Send a message to a specific agent's model
   * Auto-retries on 429 with exponential backoff + model fallback
   */
  async chat(agentName, messages, opts = {}) {
    const primaryModel = opts.model || AGENT_MODELS[agentName];
    if (!primaryModel) throw new Error(`Unknown agent: ${agentName}`);

    // Build model attempt chain: primary first, then fallbacks (skip primary if already in list)
    const modelChain = [
      primaryModel,
      ...FALLBACK_MODELS.filter(m => m !== primaryModel),
    ];

    let lastError;
    for (const model of modelChain) {
      try {
        const result = await this._callWithRetry(model, messages, opts);
        // Log if we used a fallback
        if (model !== primaryModel) {
          console.log(`  [${agentName.toUpperCase()}] Used fallback model: ${model}`);
        }
        return result;
      } catch (err) {
        lastError = err;
        // Only try next model on rate limit errors
        if (!err.message.includes('429') && !err.message.includes('rate')) {
          throw err;
        }
        console.log(`  [${agentName.toUpperCase()}] ${model} rate limited, trying next...`);
      }
    }

    throw new Error(`All models rate limited for ${agentName}: ${lastError?.message}`);
  }

  /**
   * Call one model with up to 3 retries using exponential backoff
   */
  async _callWithRetry(model, messages, opts = {}, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/hive-mind',
          'X-Title': 'Hive Mind Multi-Agent',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: opts.maxTokens || 2048,
          temperature: opts.temperature ?? 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }

      const errText = await res.text();

      // 429 — rate limited: wait then retry
      if (res.status === 429) {
        if (attempt < maxRetries) {
          const waitMs = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
          console.log(`  Rate limited on ${model}. Waiting ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
          await sleep(waitMs);
          continue;
        }
      }

      throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }
  }

  getModelForAgent(agentName) {
    return AGENT_MODELS[agentName];
  }

  listAgents() {
    return Object.keys(AGENT_MODELS);
  }
}

module.exports = { OpenRouterClient, AGENT_MODELS };