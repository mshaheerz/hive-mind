#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function searchRules(keyword) {
  const rules = fs.readdirSync(path.join(__dirname, 'references', 'rules'));
  return rules.filter(rule => rule.includes(keyword));
}

async function main() {
  const keyword = process.argv[2];
  if (!keyword) {
    console.error("Please provide a keyword to search for.");
    return;
  }

  const rules = searchRules(keyword);
  rules.forEach(rule => {
    console.log(`- ${rule}`);
  });
}

if (require.main === module) {
  main();
}
