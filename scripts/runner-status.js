#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LOCK = path.join(ROOT, '.hive', 'runner.lock.json');

function listRunnerPids() {
  try {
    const out = execSync('ps -eo pid,args', { encoding: 'utf8' });
    const lines = out.split('\n').slice(1);
    return lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(\d+)\s+(.+)$/);
        if (!m) return null;
        return { pid: Number(m[1]), cmd: m[2] };
      })
      .filter((row) => row && /^node(\s+|.*\/)run\.js(\s|$)/.test(row.cmd));
  } catch {
    return [];
  }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const active = listRunnerPids();
console.log(`Active run.js processes: ${active.length}`);
for (const p of active) {
  console.log(`- pid=${p.pid} cmd="${p.cmd}"`);
}

if (fs.existsSync(LOCK)) {
  try {
    const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
    console.log(`Lock file: pid=${lock.pid} alive=${isAlive(lock.pid)} provider=${lock.provider || 'unknown'} startedAt=${lock.startedAt || 'unknown'}`);
  } catch {
    console.log('Lock file: present (invalid JSON)');
  }
} else {
  console.log('Lock file: missing');
}

if (active.length > 1) {
  process.exitCode = 2;
}
