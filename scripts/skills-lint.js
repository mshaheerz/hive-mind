#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function main() {
  const files = fs.readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => f !== 'index.js')
    .sort();

  let checked = 0;
  for (const file of files) {
    const full = path.join(SKILLS_DIR, file);
    let mod;
    try {
      mod = require(full);
    } catch (err) {
      fail(`${file}: cannot require module (${err.message})`);
      continue;
    }
    checked += 1;

    const requiredStringFields = ['name', 'version', 'description', 'stage'];
    for (const field of requiredStringFields) {
      if (typeof mod[field] !== 'string' || !mod[field].trim()) {
        fail(`${file}: missing/invalid "${field}"`);
      }
    }

    if (!Array.isArray(mod.agents) || mod.agents.length === 0) {
      fail(`${file}: "agents" must be a non-empty array`);
    }

    if (typeof mod.execute !== 'function') {
      fail(`${file}: missing execute(params) function`);
    }

    if (!mod.contract || typeof mod.contract !== 'object') {
      fail(`${file}: missing contract object { input, output }`);
    } else {
      if (!Array.isArray(mod.contract.input)) fail(`${file}: contract.input must be array`);
      if (!Array.isArray(mod.contract.output)) fail(`${file}: contract.output must be array`);
    }
  }

  if (process.exitCode) {
    console.error(`\nSkills lint failed.`);
    process.exit(process.exitCode);
  }

  console.log(`✅ Skills lint passed (${checked} skill files).`);
}

main();
