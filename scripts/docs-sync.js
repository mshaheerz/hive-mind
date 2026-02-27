#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_FILE = path.join(ROOT, 'skills', 'manifest.json');
const OUT_FILE = path.join(ROOT, 'docs', 'skills-catalog.md');

function main() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error('skills/manifest.json not found. Run: npm run skills:sync');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  const skills = Array.isArray(manifest.skills) ? manifest.skills : [];

  const rows = skills.map((s) => {
    const agents = Array.isArray(s.agents) && s.agents.length ? s.agents.join(', ') : '—';
    return `| \`${s.name}\` | \`${s.stage || 'tool'}\` | \`${s.file}\` | ${agents} | ${s.description || '—'} |`;
  }).join('\n');

  const content = `# Skills Catalog

Generated from \`skills/manifest.json\`. Do not edit manually.

| Name | Stage | File | Agents | Summary |
|------|-------|------|--------|---------|
${rows}
`;

  fs.writeFileSync(OUT_FILE, content);
  console.log(`Synced docs catalog -> ${path.relative(ROOT, OUT_FILE)} (${skills.length} skills)`);
}

main();
