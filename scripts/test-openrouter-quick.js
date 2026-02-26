#!/usr/bin/env node
require('dotenv').config();
const { OpenRouter } = require('@openrouter/sdk');
const GroqModule = require('groq-sdk');
const Groq = GroqModule.default || GroqModule;
const { buildAgentModels, SUPPORTED_PROVIDERS } = require('../core/llm-client');

function resolveProviderArg(argv) {
  const args = argv || [];
  const direct = args.find((a) => a.startsWith('--provider='));
  if (direct) return direct.split('=')[1];
  const idx = args.indexOf('--provider');
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return process.env.LLM_PROVIDER || 'openrouter';
}

function normalizeProvider(provider) {
  const p = String(provider || '').trim().toLowerCase();
  return SUPPORTED_PROVIDERS.includes(p) ? p : 'openrouter';
}

const provider = normalizeProvider(resolveProviderArg(process.argv.slice(2)));
const AGENT_MODELS = buildAgentModels(provider);

const sdkClient = provider === 'groq'
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

if (provider === 'groq' && !process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is required for --provider groq');
  process.exit(1);
}

if (provider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY is required for --provider openrouter');
  process.exit(1);
}

async function testModel(model){
  try {
    if (provider === 'groq') {
      await sdkClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_completion_tokens: 16,
        temperature: 0,
        stream: false,
      });
      return { status: 200, ok: true };
    }

    await sdkClient.chat.send({
      chatGenerationParams: {
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 16,
      },
      httpReferer: 'https://github.com/hive-mind',
      xTitle: 'Probe',
    })
    return { status: 200, ok: true };
  } catch (err) {
    return { status: err.statusCode || err.status || err.code, error: err.message };
  }
}

(async()=>{
  console.log(`Quick ${provider.toUpperCase()} model probe`);
  for(const [agent, model] of Object.entries(AGENT_MODELS)){
    process.stdout.write(`\n→ ${agent} -> ${model} ... `);
    const r = await testModel(model);
    if(r.error) console.log(`ERROR: ${r.error}`);
    else if(!r.ok) console.log(`FAIL ${r.status || ''}`);
    else console.log(`OK ${r.status}`);
    await new Promise(r=>setTimeout(r,250));
  }
  console.log('\nDone');
})();
