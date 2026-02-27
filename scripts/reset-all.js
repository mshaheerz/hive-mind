#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const HIVE_DIR = path.join(ROOT, '.hive');
const LOGS_DIR = path.join(ROOT, 'logs');
const MEMORY_DIR = path.join(ROOT, 'memory');
const PROJECTS_DIR = path.join(ROOT, 'projects');

const args = new Set(process.argv.slice(2));
const forceYes = args.has('--yes');
const wipeProjectFolders = args.has('--wipe-project-folders');
const noKill = args.has('--no-kill');

function info(msg) {
  console.log(`[reset] ${msg}`);
}

function removeIfExists(target) {
  if (!fs.existsSync(target)) return false;
  fs.rmSync(target, { recursive: true, force: true });
  return true;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function listRunPids() {
  try {
    const out = execSync('ps -eo pid,args', { encoding: 'utf8' });
    return out
      .split('\n')
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(\d+)\s+(.+)$/);
        if (!m) return null;
        return { pid: Number(m[1]), cmd: m[2] };
      })
      .filter(Boolean)
      .filter((row) => /^node(\s+|.*\/)run\.js(\s|$)/.test(row.cmd));
  } catch {
    return [];
  }
}

function killRunners() {
  const pids = listRunPids();
  if (!pids.length) return 0;
  for (const row of pids) {
    try {
      process.kill(row.pid, 'SIGTERM');
      info(`Stopped runner pid=${row.pid}`);
    } catch {}
  }
  return pids.length;
}

function resetHiveFiles() {
  fs.mkdirSync(HIVE_DIR, { recursive: true });
  writeJson(path.join(HIVE_DIR, 'autonomous-state.json'), {
    running: false,
    cycleCount: 0,
    lastCycle: null,
    agentLastRun: {},
    agentCadenceMinutes: {},
    llmProvider: String(process.env.LLM_PROVIDER || 'openrouter').toLowerCase(),
    activeAgentModels: {},
    stats: {
      proposed: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      duplicatesBlocked: 0,
    },
  });
  writeJson(path.join(HIVE_DIR, 'queue.json'), []);
  writeJson(path.join(HIVE_DIR, 'deadlines.json'), []);
  writeJson(path.join(HIVE_DIR, 'idea-index.json'), { ideas: [], projects: [] });
  writeJson(path.join(HIVE_DIR, 'decisions.json'), []);
  writeJson(path.join(HIVE_DIR, 'ceo-bridge.json'), { messages: [], updatedAt: new Date().toISOString() });
  removeIfExists(path.join(HIVE_DIR, 'runner.lock.json'));
  removeIfExists(path.join(HIVE_DIR, 'discussions'));
}

function resetProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return { cleaned: 0, wiped: 0 };
  const entries = fs.readdirSync(PROJECTS_DIR)
    .filter((name) => !name.startsWith('.'))
    .filter((name) => name !== '_template' && name !== 'README.md');

  let cleaned = 0;
  let wiped = 0;

  for (const name of entries) {
    const dir = path.join(PROJECTS_DIR, name);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;

    if (wipeProjectFolders) {
      removeIfExists(dir);
      wiped += 1;
      continue;
    }

    removeIfExists(path.join(dir, 'status.json'));
    removeIfExists(path.join(dir, 'output'));
    removeIfExists(path.join(dir, 'workspace'));
    removeIfExists(path.join(dir, 'runs'));
    removeIfExists(path.join(dir, '.bootstrap-next'));
    removeIfExists(path.join(dir, '.bootstrap-react'));
    cleaned += 1;
  }

  return { cleaned, wiped };
}

function resetLogsAndMemory() {
  removeIfExists(LOGS_DIR);
  removeIfExists(MEMORY_DIR);
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

function main() {
  if (!forceYes) {
    console.error('Refusing to reset without --yes.\nUsage: node scripts/reset-all.js --yes [--wipe-project-folders] [--no-kill]');
    process.exit(1);
  }

  if (!noKill) {
    killRunners();
  } else {
    info('Skipped runner stop (--no-kill).');
  }

  resetLogsAndMemory();
  resetHiveFiles();
  const projectResult = resetProjects();

  info(`Reset complete.`);
  info(`Projects cleaned: ${projectResult.cleaned}`);
  info(`Projects removed: ${projectResult.wiped}`);
  info(`Logs/memory cleared; .hive state reinitialized (cycleCount=0).`);
}

main();
