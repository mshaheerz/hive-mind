const fs = require('fs');
const path = require('path');

const SKILLS_DIR = __dirname;

function loadSkills() {
  const files = fs.readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => !['index.js'].includes(f))
    .sort();

  const registry = {};
  for (const file of files) {
    const mod = require(path.join(SKILLS_DIR, file));
    const name = mod?.name || file.replace(/\.js$/, '');
    registry[name] = mod;
  }
  return registry;
}

module.exports = loadSkills();
