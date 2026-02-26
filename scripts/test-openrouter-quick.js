#!/usr/bin/env node
require('dotenv').config();
const { AGENT_MODELS } = require('../core/openrouter');
const { OpenRouter } = require('@openrouter/sdk');
const sdkClient = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

async function testModel(model){
  try {
    const res = await sdkClient.chat.send({
      chatGenerationParams: {
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 16,
      },
      httpReferer: 'https://github.com/hive-mind',
      xTitle: 'Probe',
    });
    return { status: 200, ok: true };
  } catch (err) {
    return { status: err.statusCode, error: err.message };
  }
}

(async()=>{
  console.log('Quick OpenRouter model probe');
  for(const [agent, model] of Object.entries(AGENT_MODELS)){
    process.stdout.write(`\n→ ${agent} -> ${model} ... `);
    const r = await testModel(model);
    if(r.error) console.log(`ERROR: ${r.error}`);
    else if(!r.ok) console.log(`FAIL ${r.status}: ${r.body.split('\n')[0].slice(0,200)}`);
    else console.log(`OK ${r.status}`);
    await new Promise(r=>setTimeout(r,250));
  }
  console.log('\nDone');
})();
