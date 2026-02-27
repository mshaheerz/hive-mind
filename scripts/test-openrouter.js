#!/usr/bin/env node
require('dotenv').config();
const { LLMClient, AGENT_MODELS } = require('../core/llm-client');

(async function run() {
  console.log('OPENROUTER_API_KEY present?', Boolean(process.env.OPENROUTER_API_KEY));
  const client = new LLMClient();
  console.log('Testing OpenRouter connectivity and agent models...');

  for (const [agent, model] of Object.entries(AGENT_MODELS)) {
    console.log(`\n→ Testing ${agent} -> ${model}`);
    try {
      const res = await client.chat(agent, [
        { role: 'system', content: `This is a quick connectivity test for agent ${agent}. Respond with OK.` },
        { role: 'user', content: 'Ping' }
      ], { model, maxTokens: 32, temperature: 0 });

      const snippet = ('' + res).slice(0, 200).replace(/\n/g, ' ');
      console.log(`  OK — response: ${snippet}`);
    } catch (err) {
      // include status code / error name for debugging
      const code = err.statusCode || err.status || '';
      const name = err.name || 'Error';
      console.error(`  ERROR — ${name} ${code}: ${err.message}`);
    }
    // small delay to avoid immediate rate bursts
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\nTest complete.');
})();
