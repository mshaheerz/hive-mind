#!/usr/bin/env node
require('dotenv').config();
const os = require('os');
const { spawnSync } = require('child_process');

const BASE = String(process.env.LOCAL_LLM_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
const ARGS = process.argv.slice(2);
const INSTALL = ARGS.includes('--install');

function gb(bytes) {
  return Math.round((bytes / (1024 ** 3)) * 10) / 10;
}

function detectGpuVramGiB() {
  const r = spawnSync('nvidia-smi', ['--query-gpu=memory.total', '--format=csv,noheader,nounits'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const first = String(r.stdout || '').split('\n').map((l) => l.trim()).find(Boolean);
  if (!first) return null;
  const mib = Number(first);
  if (!Number.isFinite(mib)) return null;
  return Math.round((mib / 1024) * 10) / 10;
}

function recommendModels(spec) {
  const recs = [];
  const hasGpu = Number.isFinite(spec.gpuVramGiB) && spec.gpuVramGiB > 0;

  if (hasGpu && spec.gpuVramGiB >= 12) {
    recs.push('qwen2.5-coder:14b-instruct', 'qwen2.5:14b-instruct', 'qwen2.5-coder:7b-instruct');
  } else if (hasGpu && spec.gpuVramGiB >= 8) {
    recs.push('qwen2.5-coder:7b-instruct', 'qwen2.5:7b-instruct', 'llama3.1:8b-instruct');
  } else if (spec.totalMemGiB >= 16) {
    recs.push('qwen2.5-coder:7b-instruct', 'qwen2.5:7b-instruct', 'llama3.2:3b-instruct');
  } else if (spec.totalMemGiB >= 12) {
    recs.push('qwen2.5-coder:3b-instruct', 'qwen2.5:3b-instruct', 'llama3.2:3b-instruct');
  } else {
    recs.push('qwen2.5:1.5b-instruct', 'llama3.2:1b-instruct', 'qwen2.5:3b-instruct');
  }

  return recs;
}

async function fetchTags() {
  try {
    const r = await fetch(`${BASE}/api/tags`);
    if (!r.ok) return { ok: false, models: [], error: `HTTP ${r.status}` };
    const json = await r.json();
    return { ok: true, models: (json.models || []).map((m) => m.name) };
  } catch (err) {
    return { ok: false, models: [], error: err.message };
  }
}

async function main() {
  const spec = {
    cpu: os.cpus()?.[0]?.model || 'unknown',
    cpuCores: os.cpus()?.length || 0,
    totalMemGiB: gb(os.totalmem()),
    freeMemGiB: gb(os.freemem()),
    gpuVramGiB: detectGpuVramGiB(),
  };

  const tags = await fetchTags();
  const recs = recommendModels(spec);
  const installed = tags.models;

  console.log('\nLocal Model Advisor');
  console.log(`Endpoint: ${BASE}`);
  console.log(`CPU: ${spec.cpu}`);
  console.log(`Cores: ${spec.cpuCores}`);
  console.log(`RAM: ${spec.totalMemGiB} GiB total, ${spec.freeMemGiB} GiB free`);
  console.log(`GPU VRAM: ${spec.gpuVramGiB == null ? 'not detected' : `${spec.gpuVramGiB} GiB`}`);
  if (!tags.ok) {
    console.log(`Ollama status: unreachable (${tags.error})`);
    process.exitCode = 1;
    return;
  }

  console.log(`Installed models: ${installed.length ? installed.join(', ') : 'none'}`);
  console.log(`Recommended models: ${recs.join(', ')}`);

  const firstInstalledRecommended = recs.find((m) => installed.includes(m));
  if (firstInstalledRecommended) {
    console.log(`Best available now: ${firstInstalledRecommended}`);
    return;
  }

  const target = recs[0];
  console.log(`No recommended models installed yet. Suggested install: ollama pull ${target}`);

  if (INSTALL) {
    console.log(`Installing ${target}...`);
    const pull = spawnSync('ollama', ['pull', target], { stdio: 'inherit' });
    if (pull.status !== 0) {
      console.error(`Failed to install ${target}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Installed ${target}.`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
