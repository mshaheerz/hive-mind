/**
 * OpenRouter API Client
 * Wraps the OpenRouter API for all agents
 * - Each agent uses a DIFFERENT model to avoid rate limits
 * - Automatic retry with exponential backoff on 429
 * - Fallback model chain if primary is rate-limited
 */

// we now use the official SDK instead of hand-rolling fetch logic
const { OpenRouter } = require('@openrouter/sdk');
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Every agent gets a DIFFERENT model — spreads rate limit quota across providers
// All support system prompts. Verified free tier as of 2026.
let AGENT_MODELS = {
  // switched to endpoints that are confirmed live and free in Feb 2026
  apex:  'arcee-ai/trinity-large-preview:free',      // creative reasoning / planning
  nova:  'stepfun/step-3.5-flash:free',              // proposal generation
  scout: 'z-ai/glm-4.5-air:free',                    // research & analysis
  atlas: 'nvidia/nemotron-3-nano-30b-a3b:free',      // architecture / design
  forge: 'upstage/solar-pro-3:free',                 // coding / code review
  lens:  'openai/gpt-oss-120b:free',                 // deep code understanding
  pulse: 'arcee-ai/trinity-mini:free',               // testing & QA
  sage:  'nvidia/nemotron-nano-12b-v2-vl:free',      // documentation
  echo:  'z-ai/glm-4.5-air:free',                    // social media chatter
};

// Allow overriding per-agent model via environment variables, e.g. OPENROUTER_MODEL_NOVA
Object.keys(AGENT_MODELS).forEach((k) => {
  const envKey = `OPENROUTER_MODEL_${k.toUpperCase()}`;
  if (process.env[envKey]) AGENT_MODELS[k] = process.env[envKey];
});

// Fallback chain — if primary is 429 or otherwise unavailable, try these in order
// choose a mix of providers that have historically stayed live
const FALLBACK_MODELS = [
  'arcee-ai/trinity-mini:free',
  'stepfun/step-3.5-flash:free',
  'z-ai/glm-4.5-air:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set. Check your .env file.');
    }
    // create a shared SDK instance; the SDK handles auth internally
    this.orsdk = new OpenRouter({ apiKey: this.apiKey });
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
        // determine whether this error should trigger a fallback
        const code = err.statusCode || err.code || '';
        const m = (err.message || '').toLowerCase();
        const shouldFallback =
          code === 429 || code === 402 || code === 404 ||
          m.includes('429') || m.includes('rate') || m.includes('no endpoints') || m.includes('spend limit');
        if (!shouldFallback) {
          throw err;
        }
        console.log(`  [${agentName.toUpperCase()}] ${model} unavailable (${err.message.split('\n')[0]}). Trying next...`);
      }
    }

    // if we get here, none of the models succeeded
    throw new Error(`All models rate limited for ${agentName}: ${lastError?.message}`);
  }

  /**
   * Call one model with up to 3 retries using exponential backoff
   */
  async _callWithRetry(model, messages, opts = {}, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.orsdk.chat.send({
          chatGenerationParams: {
            model,
            messages,
            max_tokens: opts.maxTokens || 2048,
            temperature: opts.temperature ?? 0.7,
          },
          httpReferer: 'https://github.com/hive-mind',
          xTitle: 'Hive Mind Multi-Agent',
        });

        // SDK returns a ChatResponse object when not streaming
        return response.choices?.[0]?.message?.content || '';
      } catch (err) {
        // if it's a rate limit error, retry
        if (err.statusCode === 429) {
          if (attempt < maxRetries) {
            const waitMs = Math.pow(2, attempt) * 5000;
            console.log(`  Rate limited on ${model}. Waiting ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
            await sleep(waitMs);
            continue;
          }
        }
        // otherwise propagate error to caller for fallback logic
        throw err;
      }
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