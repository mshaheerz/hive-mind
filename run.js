/**
 * HIVE AUTONOMOUS RUNNER
 * Run once: node run.js
 * The agents take over from there — researching, proposing, building.
 *
 * How it works:
 *   Every 5 minutes, the runner checks which agents are "due"
 *   Each agent does their job based on current state
 *   NOVA → SCOUT → APEX discussion → pipeline → repeat
 *   Human can interact any time via: node hive.js [command]
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const chalk = require('chalk');
const { spawnSync } = require('child_process');

const ApexAgent  = require('./agents/apex');
const { ScoutAgent, ForgeAgent, LensAgent, PulseAgent,
        EchoAgent, AtlasAgent, SageAgent, NovaAgent } = require('./agents/agents');
const {
  DuplicateDetector,
  DiscussionBoard,
  DeadlineTracker,
  AutonomousState,
  AGENT_SCHEDULE,
} = require('./core/autonomous');
const { buildAgentModels } = require('./core/llm-client');

const PROJECTS_DIR = path.join(__dirname, 'projects');
const QUEUE_FILE   = path.join(__dirname, '.hive', 'queue.json');
const CEO_BRIDGE_FILE = path.join(__dirname, '.hive', 'ceo-bridge.json');
const RUNNER_ARGS = process.argv.slice(2);
const MAX_ACTIVE_PROJECTS = Number(process.env.HIVE_MAX_ACTIVE_PROJECTS || 2);
const MAX_LENS_REJECTS_BEFORE_BYPASS = Number(process.env.HIVE_ESCALATION_REJECT_THRESHOLD || process.env.MAX_LENS_REJECTS_BEFORE_BYPASS || 3);
const RUNNER_LOCK_FILE = path.join(__dirname, '.hive', 'runner.lock.json');
const APPROVAL_MODE = String(process.env.HIVE_APPROVAL_MODE || 'risk_based').toLowerCase();
const STRICT_ORDER_OVERRIDE = /^(1|true|yes|on)$/i.test(String(process.env.HIVE_STRICT_ORDER_OVERRIDE || 'false'));

const STAGE_RESPONSIBLE_AGENT = {
  approved: 'scout',
  research: 'atlas',
  architecture: 'forge',
  implementation: 'lens',
  review: 'pulse',
  tests: 'sage',
  docs: 'echo',
  launch: null,
  complete: null,
  failed: null,
  new: null,
};

function printUsage() {
  console.log(`Usage: node run.js [options]

Starts the autonomous Hive runner.

Options:
  --provider <provider>  LLM provider (openrouter|groq|local)
  -h, --help             display help for command`);
}

function resolveProviderArg(argv) {
  const args = argv || [];
  const direct = args.find((a) => a.startsWith('--provider='));
  if (direct) return direct.split('=')[1];
  const idx = args.indexOf('--provider');
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return '';
}

if (RUNNER_ARGS.includes('-h') || RUNNER_ARGS.includes('--help')) {
  printUsage();
  process.exit(0);
}

if (RUNNER_ARGS.includes('--provider') && !resolveProviderArg(RUNNER_ARGS)) {
  console.error('Missing value for --provider');
  printUsage();
  process.exit(1);
}

process.env.LLM_PROVIDER = String(
  resolveProviderArg(RUNNER_ARGS) || process.env.LLM_PROVIDER || 'openrouter'
).toLowerCase();

// ─── Check interval: every 5 minutes ──────────────────────────
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────
const log = (agent, msg, type = 'info') => {
  const colors = {
    apex: chalk.yellow, scout: chalk.cyan, forge: chalk.green,
    lens: chalk.magenta, pulse: chalk.red, echo: chalk.blue,
    atlas: chalk.blueBright, sage: chalk.white, nova: chalk.yellowBright,
    system: chalk.gray,
  };
  const color = colors[agent] || chalk.white;
  const time  = new Date().toLocaleTimeString();
  console.log(`${chalk.gray(time)} ${color(`[${agent.toUpperCase()}]`)} ${msg}`);

  // Also write to log file
  const today   = new Date().toISOString().split('T')[0];
  const logFile = path.join(__dirname, 'logs', `${today}-autonomous.log`);
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] [${agent.toUpperCase()}] ${msg}\n`);
};

function loadQueue() {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch { return []; }
}

function loadCeoBridge() {
  if (!fs.existsSync(CEO_BRIDGE_FILE)) return { messages: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(CEO_BRIDGE_FILE, 'utf8'));
    if (!Array.isArray(parsed.messages)) return { messages: [] };
    return parsed;
  } catch {
    return { messages: [] };
  }
}

function saveCeoBridge(data) {
  fs.mkdirSync(path.dirname(CEO_BRIDGE_FILE), { recursive: true });
  const payload = {
    messages: Array.isArray(data?.messages) ? data.messages : [],
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CEO_BRIDGE_FILE, JSON.stringify(payload, null, 2));
}

function saveQueue(q) {
  fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2));
}

function getProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR).filter(f => {
    const d = path.join(PROJECTS_DIR, f);
    return fs.statSync(d).isDirectory() && !f.startsWith('_');
  });
}

function getProjectStatus(name) {
  const sf = path.join(PROJECTS_DIR, name, 'status.json');
  if (!fs.existsSync(sf)) return schemaNormalizedStatus({ stage: 'new' });
  try {
    const parsed = schemaNormalizedStatus(JSON.parse(fs.readFileSync(sf)));
    fs.writeFileSync(sf, JSON.stringify(parsed, null, 2));
    return parsed;
  } catch {
    return schemaNormalizedStatus({ stage: 'new' });
  }
}

function getActiveProjectsWithStatus() {
  return getProjects()
    .map((name) => ({ name, status: getProjectStatus(name) }))
    .filter(({ status }) => !['complete', 'failed', 'new'].includes(status.stage));
}

function projectPriorityTs(status = {}) {
  const approved = status.approvedAt ? new Date(status.approvedAt).getTime() : 0;
  const proposed = status.proposedAt ? new Date(status.proposedAt).getTime() : 0;
  const updated = status.updatedAt ? new Date(status.updatedAt).getTime() : 0;
  return approved || proposed || updated || 0;
}

const PIPELINE_STAGE_ORDER = [
  'approved',
  'research',
  'architecture',
  'implementation',
  'review',
  'tests',
  'docs',
  'launch',
  'complete',
];

function stageRank(stage) {
  const idx = PIPELINE_STAGE_ORDER.indexOf(String(stage || '').toLowerCase());
  return idx >= 0 ? idx : -1;
}

function schemaNormalizedStatus(status = {}) {
  const normalized = { ...(status || {}) };
  normalized.stage = String(normalized.stage || 'new').toLowerCase();
  if (!Number.isFinite(Number(normalized.stageAttempt)) || Number(normalized.stageAttempt) < 1) normalized.stageAttempt = 1;
  if (!['APPROVED', 'NEEDS_CHANGES', null].includes(normalized.lensVerdict)) {
    if (normalized.lensRejected === true) normalized.lensVerdict = 'NEEDS_CHANGES';
    else if (normalized.lensRejected === false || normalized.lensApproved) normalized.lensVerdict = 'APPROVED';
    else normalized.lensVerdict = null;
  }
  if (!Array.isArray(normalized.lensActionItems)) normalized.lensActionItems = [];
  normalized.lensActionItems = normalized.lensActionItems
    .map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `L${idx + 1}`, severity: 'critical', requirement: item };
      }
      return {
        id: String(item?.id || `L${idx + 1}`),
        severity: String(item?.severity || 'critical').toLowerCase() === 'warning' ? 'warning' : 'critical',
        file: item?.file ? String(item.file) : undefined,
        requirement: String(item?.requirement || item?.action || '').trim(),
      };
    })
    .filter((item) => item.requirement);
  if (!normalized.blockedReason || typeof normalized.blockedReason !== 'object') normalized.blockedReason = null;
  if (!['none', 'apex_watch', 'force_progress'].includes(normalized.escalationLevel)) {
    normalized.escalationLevel = normalized.escalationNeeded ? 'apex_watch' : 'none';
  }
  normalized.lastHandoffRunId = normalized.lastHandoffRunId || null;
  normalized.stageOwner = normalized.stageOwner || STAGE_RESPONSIBLE_AGENT[normalized.stage] || null;
  if (!normalized.lensIssueRepeats || typeof normalized.lensIssueRepeats !== 'object') normalized.lensIssueRepeats = {};
  return normalized;
}

function classifyRisk(action = '') {
  const text = String(action || '').toLowerCase();
  if (/deploy|publish|release|migration|drop|truncate|delete from|secret write|secretsmanager put|keyvault set|destroy|rm -rf|git reset --hard/.test(text)) {
    return 'high';
  }
  if (/install|npm i|npm install|pip install|build|workspace generation|materializ|bootstrap|scaffold/.test(text)) {
    return 'moderate';
  }
  return 'safe';
}

function createRunId(agentKey = 'agent') {
  return `${Date.now()}-${agentKey}-${Math.random().toString(36).slice(2, 7)}`;
}

function runDir(projectName, runId) {
  return path.join(PROJECTS_DIR, projectName, 'runs', runId);
}

function writeRunFile(projectName, runId, rel, content) {
  const full = path.join(runDir(projectName, runId), rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (typeof content === 'string') fs.writeFileSync(full, content);
  else fs.writeFileSync(full, JSON.stringify(content, null, 2));
}

function beginRunArtifact({ projectName, stage, agentKey, status, parentRunId, provider, model }) {
  const runId = createRunId(agentKey);
  const startedAt = new Date().toISOString();
  const context = {
    project: projectName,
    stage,
    agent: agentKey,
    runId,
    parentRunId: parentRunId || null,
    startedAt,
    provider: provider || process.env.LLM_PROVIDER || 'openrouter',
    model: model || null,
    statusSnapshot: status || {},
  };
  writeRunFile(projectName, runId, 'proposal.md', `# Stage Run Proposal\n\n- Project: ${projectName}\n- Stage: ${stage}\n- Agent: ${agentKey}\n- Run ID: ${runId}\n`);
  writeRunFile(projectName, runId, 'tasks.md', `# Tasks\n\n- [ ] Execute ${stage}\n- [ ] Emit decision + handoff\n- [ ] Attach evidence\n`);
  writeRunFile(projectName, runId, 'context.json', context);
  return { runId, context };
}

function appendRunEvidence(projectName, runId, fileName, content) {
  const safeName = String(fileName || 'evidence.txt').replace(/[^\w.\-]+/g, '-');
  writeRunFile(projectName, runId, path.join('evidence', safeName), String(content || ''));
}

function setProjectStatus(name, updates) {
  const dir = path.join(PROJECTS_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  const sf  = path.join(dir, 'status.json');
  let status = {};
  if (fs.existsSync(sf)) { try { status = schemaNormalizedStatus(JSON.parse(fs.readFileSync(sf))); } catch {} }
  Object.assign(status, updates, { updatedAt: new Date().toISOString() });
  status = schemaNormalizedStatus(status);
  fs.writeFileSync(sf, JSON.stringify(status, null, 2));
}

function transitionProjectStage(projectName, nextStage, opts = {}) {
  const { reason = '', allowBackward = false, runId = null } = opts;
  const current = getProjectStatus(projectName);
  const currentStage = String(current.stage || 'new').toLowerCase();
  const target = String(nextStage || currentStage).toLowerCase();
  const curRank = stageRank(currentStage);
  const nextRank = stageRank(target);

  if (!allowBackward && curRank >= 0 && nextRank >= 0 && nextRank < curRank) {
    throw new Error(`Illegal stage regression ${currentStage} -> ${target} without decision artifact`);
  }

  const sameStage = currentStage === target;
  const updates = {
    stage: target,
    stageOwner: STAGE_RESPONSIBLE_AGENT[target] || null,
    stageAttempt: sameStage ? Number(current.stageAttempt || 1) + 1 : 1,
    blockedReason: null,
    ...(runId ? { lastHandoffRunId: runId } : {}),
  };
  if (reason) updates.transitionReason = reason;
  setProjectStatus(projectName, updates);
}

function readOutput(projectName, file) {
  const p = path.join(PROJECTS_DIR, projectName, 'output', file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function writeOutput(projectName, file, content) {
  const dir = path.join(PROJECTS_DIR, projectName, 'output');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
}

function runWorkspaceChecks(projectName) {
  const root = path.join(PROJECTS_DIR, projectName, 'workspace');
  if (!fs.existsSync(root)) return { checked: 0, passed: 0, failed: 0, report: 'No workspace to validate.' };
  const files = listWorkspaceFiles(projectName);
  let checked = 0;
  let passed = 0;
  let failed = 0;
  const reportLines = [];

  for (const rel of files) {
    const full = path.join(root, rel);
    if (/\.(js|mjs|cjs)$/i.test(rel)) {
      checked += 1;
      const run = spawnSync('node', ['--check', full], { encoding: 'utf8', timeout: 20000 });
      if (run.status === 0) {
        passed += 1;
      } else {
        failed += 1;
        reportLines.push(`[FAIL] node --check ${rel}\n${(run.stderr || run.stdout || '').trim()}`);
      }
      continue;
    }
    if (/\.py$/i.test(rel)) {
      checked += 1;
      const run = spawnSync('python3', ['-m', 'py_compile', full], { encoding: 'utf8', timeout: 20000 });
      if (run.status === 0) {
        passed += 1;
      } else {
        failed += 1;
        reportLines.push(`[FAIL] python3 -m py_compile ${rel}\n${(run.stderr || run.stdout || '').trim()}`);
      }
    }
  }

  const summary = `Checked=${checked} Passed=${passed} Failed=${failed}`;
  return { checked, passed, failed, report: `${summary}\n${reportLines.join('\n\n')}`.trim() };
}

function summarizeExecutionOutput(text = '', maxLines = 6) {
  const lines = String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, maxLines);
  return lines.length ? lines.join(' | ') : 'No output.';
}

function commandExists(cmd) {
  const check = spawnSync('bash', ['-lc', `command -v ${cmd}`], { encoding: 'utf8' });
  return check.status === 0;
}

function copyDirContents(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name === '.git') continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) {
      copyDirContents(from, to);
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
}

function inferBootstrapTemplate(status = {}, readme = '') {
  const raw = `${status.preferredStack || ''} ${status.template || ''} ${readme || ''}`.toLowerCase();
  if (raw.includes('next.js') || raw.includes('nextjs') || raw.includes('nextjs-starter')) return 'nextjs';
  if (raw.includes('react') || raw.includes('vite') || raw.includes('react-vite')) return 'react-vite';
  if (raw.includes('python') || raw.includes('pytest') || raw.includes('python-cli')) return 'python-cli';
  if (raw.includes('api_service') || raw.includes('node-cli') || raw.includes('node')) return 'node-cli';
  return 'node-cli';
}

function ensureProjectBootstrap(projectName, status = {}, readme = '') {
  const root = path.join(PROJECTS_DIR, projectName, 'workspace');
  fs.mkdirSync(root, { recursive: true });
  const packageJson = path.join(root, 'package.json');
  const pyProject = path.join(root, 'pyproject.toml');
  const requirements = path.join(root, 'requirements.txt');
  const template = inferBootstrapTemplate(status, readme);
  const notes = [];

  if (template === 'nextjs' && !fs.existsSync(packageJson)) {
    if (!commandExists('npx')) return { ok: false, template, notes: ['npx not installed; falling back to manual FORGE generation.'] };
    const tmp = path.join(PROJECTS_DIR, projectName, '.bootstrap-next');
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    const run = spawnSync('npx', [
      'create-next-app@latest', tmp, '--ts', '--tailwind', '--eslint', '--app', '--src-dir', '--use-npm', '--yes',
    ], { encoding: 'utf8', timeout: 420000 });
    if (run.status === 0) {
      copyDirContents(tmp, root);
      notes.push('Bootstrapped Next.js via create-next-app.');
    } else {
      notes.push(`create-next-app failed: ${summarizeExecutionOutput(`${run.stdout || ''}\n${run.stderr || ''}`)}`);
    }
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    return { ok: fs.existsSync(packageJson), template, notes };
  }

  if (template === 'react-vite' && !fs.existsSync(packageJson)) {
    if (!commandExists('npx')) return { ok: false, template, notes: ['npx not installed; falling back to manual FORGE generation.'] };
    const tmp = path.join(PROJECTS_DIR, projectName, '.bootstrap-react');
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    const run = spawnSync('npx', ['create-vite@latest', tmp, '--template', 'react-ts'], { encoding: 'utf8', timeout: 240000 });
    if (run.status === 0) {
      copyDirContents(tmp, root);
      notes.push('Bootstrapped React+Vite via create-vite.');
    } else {
      notes.push(`create-vite failed: ${summarizeExecutionOutput(`${run.stdout || ''}\n${run.stderr || ''}`)}`);
    }
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    return { ok: fs.existsSync(packageJson), template, notes };
  }

  if (template === 'python-cli' && !fs.existsSync(pyProject) && !fs.existsSync(requirements)) {
    if (!commandExists('python3')) {
      return { ok: false, template, notes: ['python3 not installed; falling back to manual FORGE generation.'] };
    }
    fs.writeFileSync(requirements, 'pytest\n');
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    notes.push('Bootstrapped minimal Python CLI structure.');
    return { ok: true, template, notes };
  }

  if (template === 'node-cli' && !fs.existsSync(packageJson)) {
    if (!commandExists('npm')) return { ok: false, template, notes: ['npm not installed; falling back to manual FORGE generation.'] };
    const run = spawnSync('npm', ['init', '-y'], { cwd: root, encoding: 'utf8', timeout: 60000 });
    if (run.status === 0) {
      notes.push('Bootstrapped Node project via npm init -y.');
      return { ok: true, template, notes };
    }
    notes.push(`npm init failed: ${summarizeExecutionOutput(`${run.stdout || ''}\n${run.stderr || ''}`)}`);
    return { ok: false, template, notes };
  }

  return { ok: true, template, notes: ['Bootstrap already present.'] };
}

function runProjectTests(projectName) {
  const root = path.join(PROJECTS_DIR, projectName, 'workspace');
  if (!fs.existsSync(root)) {
    return {
      attempted: false,
      passed: false,
      summary: 'No workspace found.',
      actionItems: ['Workspace missing; FORGE must generate project files first.'],
      raw: '',
    };
  }

  const pkgJson = path.join(root, 'package.json');
  if (fs.existsSync(pkgJson)) {
    if (!fs.existsSync(path.join(root, 'node_modules'))) {
      const install = spawnSync('npm', ['install', '--no-fund', '--no-audit'], { cwd: root, encoding: 'utf8', timeout: 240000 });
      if (install.status !== 0) {
        const installOutput = `${install.stdout || ''}\n${install.stderr || ''}`.trim();
        return {
          attempted: true,
          passed: false,
          summary: `npm install failed: ${summarizeExecutionOutput(installOutput)}`,
          actionItems: ['Fix dependency installation errors (npm install).', summarizeExecutionOutput(installOutput)],
          raw: installOutput,
        };
      }
    }
    const run = spawnSync('npm', ['test', '--', '--watch=false'], { cwd: root, encoding: 'utf8', timeout: 180000 });
    const output = `${run.stdout || ''}\n${run.stderr || ''}`.trim();
    if (run.status === 0) return { attempted: true, passed: true, summary: 'npm test passed.', actionItems: [], raw: output };
    return {
      attempted: true,
      passed: false,
      summary: `npm test failed: ${summarizeExecutionOutput(output)}`,
      actionItems: ['Fix failing tests reported by npm test.', summarizeExecutionOutput(output)],
      raw: output,
    };
  }

  const hasPyTests = fs.existsSync(path.join(root, 'tests')) || fs.existsSync(path.join(root, 'test'));
  if (hasPyTests) {
    const run = spawnSync('python3', ['-m', 'pytest', '-q'], { cwd: root, encoding: 'utf8', timeout: 180000 });
    const output = `${run.stdout || ''}\n${run.stderr || ''}`.trim();
    if (run.status === 0) return { attempted: true, passed: true, summary: 'pytest passed.', actionItems: [], raw: output };
    return {
      attempted: true,
      passed: false,
      summary: `pytest failed: ${summarizeExecutionOutput(output)}`,
      actionItems: ['Fix failing tests reported by pytest.', summarizeExecutionOutput(output)],
      raw: output,
    };
  }

  return {
    attempted: false,
    passed: false,
    summary: 'No runnable test command detected (expected package.json or pytest tests).',
    actionItems: ['Create runnable tests and declare how to run them (npm test or pytest).'],
    raw: '',
  };
}

function safeWorkspacePath(projectName, relPath) {
  const clean = String(relPath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .trim();
  if (!clean || clean.includes('..')) return null;
  const root = path.join(PROJECTS_DIR, projectName, 'workspace');
  const full = path.resolve(root, clean);
  if (!full.startsWith(root + path.sep) && full !== root) return null;
  return full;
}

function parseFilesFromForgeOutput(text = '') {
  const source = String(text || '');
  const items = [];
  const patterns = [
    /\*\*File:\s*`([^`]+)`\*\*[\s\S]*?```[^\n]*\n([\s\S]*?)```/g,
    /(?:^|\n)File:\s*`?([^\n`]+)`?[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
    /(?:^|\n)###\s*`?([^\n`]+)`?[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
    /(?:^|\n)#{1,6}[^\n`]*`([^`]+\.[^`]+)`[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
    /(?:^|\n)\d+\.\s*`([^`]+\.[^`]+)`[^\n]*\n```[^\n]*\n([\s\S]*?)```/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) {
      const relPath = String(match[1] || '').trim();
      const content = String(match[2] || '');
      if (!relPath || !content.trim()) continue;
      const existingIdx = items.findIndex((x) => x.path === relPath);
      if (existingIdx >= 0) {
        items[existingIdx] = { path: relPath, content };
      } else {
        items.push({ path: relPath, content });
      }
    }
  }

  return items;
}

function isLikelyMarkdownTableBlob(content = '') {
  const lines = String(content || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const tableish = lines.filter((l) => l.startsWith('|') && l.endsWith('|')).length;
  const hasDivider = lines.some((l) => /^\|\s*-+/.test(l));
  return tableish >= 2 && hasDivider;
}

function materializeForgeFiles(projectName, forgeOutput, opts = {}) {
  const { pathAllowList = null } = opts;
  const files = parseFilesFromForgeOutput(forgeOutput);
  const written = [];
  for (const item of files) {
    if (Array.isArray(pathAllowList) && pathAllowList.length) {
      const allowed = pathAllowList.some((rx) => rx.test(item.path));
      if (!allowed) continue;
    }
    if (isLikelyMarkdownTableBlob(item.content)) continue;
    const target = safeWorkspacePath(projectName, item.path);
    if (!target) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, item.content);
    written.push(item.path);
  }
  return written;
}

function listWorkspaceFiles(projectName) {
  const root = path.join(PROJECTS_DIR, projectName, 'workspace');
  if (!fs.existsSync(root)) return [];
  const out = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else out.push(path.relative(root, full).replace(/\\/g, '/'));
    }
  };
  walk(root);
  return out;
}

function hasRealProjectFiles(projectName) {
  const files = listWorkspaceFiles(projectName);
  return files.some((f) => !/\.md$/i.test(f));
}

function scaffoldGitignore(stack = '') {
  const s = String(stack || '').toLowerCase();
  const common = ['.DS_Store', '*.log', '.env', '.env.local', ''];
  if (s.includes('next')) return [...common, 'node_modules/', '.next/', 'out/', 'coverage/', '.turbo/'].join('\n');
  if (s.includes('react') || s.includes('vite') || s.includes('node') || s.includes('javascript') || s.includes('typescript')) {
    return [...common, 'node_modules/', 'dist/', 'build/', 'coverage/'].join('\n');
  }
  if (s.includes('python')) return [...common, '__pycache__/', '*.pyc', '.pytest_cache/', '.venv/', 'venv/'].join('\n');
  return [...common, 'node_modules/', 'dist/', 'build/', '__pycache__/', '*.pyc'].join('\n');
}

function ensureWorkspaceScaffold(projectName, stack = '') {
  const root = path.join(PROJECTS_DIR, projectName, 'workspace');
  fs.mkdirSync(root, { recursive: true });
  const gitignorePath = path.join(root, '.gitignore');
  if (!fs.existsSync(gitignorePath)) fs.writeFileSync(gitignorePath, `${scaffoldGitignore(stack)}\n`);
  const envExamplePath = path.join(root, '.env.example');
  if (!fs.existsSync(envExamplePath)) fs.writeFileSync(envExamplePath, 'APP_ENV=development\nAPI_BASE_URL=\nAPI_KEY=\n');
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) fs.writeFileSync(envPath, 'APP_ENV=development\n');
}

function hydrateWorkspaceFromOutputs(projectName) {
  const impl = readOutput(projectName, 'implementation.md');
  if (!impl.trim()) return 0;
  const written = materializeForgeFiles(projectName, impl);
  if (written.length) {
    const status = getProjectStatus(projectName);
    ensureWorkspaceScaffold(projectName, status.preferredStack || status.stack || status.template || '');
    setProjectStatus(projectName, {
      workspaceFiles: written,
      workspaceUpdatedAt: new Date().toISOString(),
    });
  }
  return written.length;
}

function summarizeLensReview(text = '') {
  const raw = String(text || '').replace(/\r/g, '');
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const picked = [];

  const verdict = lines.find((l) => /verdict\s*:/i.test(l));
  if (verdict) picked.push(verdict);

  const critical = lines.filter((l) => /critical|must fix|security|needs_changes|rejected/i.test(l));
  for (const line of critical) {
    if (picked.length >= 4) break;
    if (!picked.includes(line)) picked.push(line);
  }

  if (!picked.length) {
    const first = lines.slice(0, 2).join(' ');
    return first.slice(0, 260) || 'LENS requested changes before merge.';
  }

  return picked.join(' | ').slice(0, 520);
}

function extractLensActionItems(text = '', maxItems = 5) {
  const raw = String(text || '').replace(/\r/g, '');
  const lines = raw.split('\n');
  const items = [];

  // Prefer markdown table rows from CRITICAL section.
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    if (/^\|\s*-+/.test(trimmed)) continue;

    const cols = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
    if (cols.length < 4) continue;
    if (/^#$/i.test(cols[0])) continue;

    const issue = cols[2] || '';
    const fix = cols[4] || cols[3] || '';
    const requirement = `${issue} ${fix}`.replace(/\s+/g, ' ').trim();
    if (!requirement) continue;
    const severityRaw = `${cols[1] || ''} ${cols[2] || ''}`.toLowerCase();
    const severity = /warn|non.?critical|should/.test(severityRaw) ? 'warning' : 'critical';
    const idCandidate = String(cols[0] || '').replace(/[^\w-]/g, '').toUpperCase() || `L${items.length + 1}`;
    const file = (cols[2] || '').includes('.') ? cols[2] : undefined;
    items.push({ id: idCandidate, severity, file, requirement });
    if (items.length >= maxItems) break;
  }

  if (items.length) return items;

  // Fallback: collect high-signal lines.
  const fallback = lines
    .map((l) => l.trim())
    .filter((l) => /critical|must fix|security|validation|tests|injection/i.test(l))
    .slice(0, maxItems)
    .map((l, idx) => ({
      id: `L${idx + 1}`,
      severity: /warning|should/i.test(l) ? 'warning' : 'critical',
      requirement: l.replace(/\s+/g, ' ').trim(),
    }));

  return fallback;
}

function parseForgeFixMap(text = '') {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const mappings = {};
  for (const line of lines) {
    const m = line.match(/(?:^|\s)([A-Z]\d+)\s*(?:=>|->|:)\s*(.+)$/i);
    if (!m) continue;
    mappings[m[1].toUpperCase()] = String(m[2] || '').trim();
  }
  return mappings;
}

function finalizeRunArtifact(projectName, runId, payload = {}) {
  const decision = {
    outcome: payload.outcome || 'deferred',
    rationale: payload.rationale || '',
    risk: payload.risk || 'safe',
    approvedBy: payload.approvedBy || (payload.risk === 'high' ? 'apex' : 'system'),
    approved: payload.approved !== false,
    decidedAt: new Date().toISOString(),
  };
  const handoff = {
    fromAgent: payload.fromAgent || 'system',
    toAgent: payload.toAgent || null,
    project: payload.project,
    stage: payload.stage || null,
    runId,
    summary: payload.summary || '',
    artifacts: Array.isArray(payload.artifacts) ? payload.artifacts : [],
    requiredActions: Array.isArray(payload.requiredActions) ? payload.requiredActions : [],
    acceptanceChecks: Array.isArray(payload.acceptanceChecks) ? payload.acceptanceChecks : [],
    modelInfo: payload.modelInfo || { provider: process.env.LLM_PROVIDER || 'openrouter', model: 'unknown' },
  };
  writeRunFile(projectName, runId, 'decision.json', decision);
  writeRunFile(projectName, runId, 'handoff.json', handoff);
}

function isProcessAlive(pid) {
  if (!pid || pid === process.pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireRunnerLock() {
  fs.mkdirSync(path.dirname(RUNNER_LOCK_FILE), { recursive: true });
  if (fs.existsSync(RUNNER_LOCK_FILE)) {
    try {
      const lock = JSON.parse(fs.readFileSync(RUNNER_LOCK_FILE, 'utf8'));
      if (isProcessAlive(lock.pid)) {
        console.log(chalk.yellow(`Another autonomous runner is already active (pid ${lock.pid}). Exiting this instance.`));
        process.exit(0);
      }
    } catch {}
  }

  fs.writeFileSync(RUNNER_LOCK_FILE, JSON.stringify({
    pid: process.pid,
    provider: process.env.LLM_PROVIDER,
    startedAt: new Date().toISOString(),
  }, null, 2));
}

function releaseRunnerLock() {
  if (!fs.existsSync(RUNNER_LOCK_FILE)) return;
  try {
    const lock = JSON.parse(fs.readFileSync(RUNNER_LOCK_FILE, 'utf8'));
    if (lock.pid === process.pid) fs.unlinkSync(RUNNER_LOCK_FILE);
  } catch {}
}

// ─── Main Autonomous Runner ───────────────────────────────────
class AutonomousRunner {
  constructor() {
    this.state      = new AutonomousState();
    this.duplicates = new DuplicateDetector();
    this.discussion = new DiscussionBoard();
    this.deadlines  = new DeadlineTracker();

    this.agents = {
      apex:  new ApexAgent(),
      scout: new ScoutAgent(),
      forge: new ForgeAgent(),
      lens:  new LensAgent(),
      pulse: new PulseAgent(),
      echo:  new EchoAgent(),
      atlas: new AtlasAgent(),
      sage:  new SageAgent(),
      nova:  new NovaAgent(),
    };

    this._syncProviderState();
    this.cycleInProgress = false;
  }

  cleanupOldRuns() {
    const retentionDays = Number(process.env.HIVE_RUNS_RETENTION_DAYS || 30);
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) return;
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    for (const projectName of getProjects()) {
      const runsRoot = path.join(PROJECTS_DIR, projectName, 'runs');
      if (!fs.existsSync(runsRoot)) continue;
      for (const entry of fs.readdirSync(runsRoot)) {
        const full = path.join(runsRoot, entry);
        let st;
        try { st = fs.statSync(full); } catch { continue; }
        if (!st.isDirectory()) continue;
        if (st.mtimeMs < cutoff) {
          try { fs.rmSync(full, { recursive: true, force: true }); } catch {}
        }
      }
    }
  }

  _syncProviderState() {
    const current = String(process.env.LLM_PROVIDER || 'openrouter').toLowerCase();
    const previous = String(this.state.state.llmProvider || '').toLowerCase();

    // If provider changed between restarts, wake agents immediately on the new backend.
    if (previous && previous !== current) {
      this.state.state.agentLastRun = {};
      log('system', `Provider changed (${previous} -> ${current}). Resetting agent schedules for immediate cycle activity.`);
    }

    if (!this.state.state.agentCadenceMinutes) this.state.state.agentCadenceMinutes = {};
    this.state.state.agentCadenceMinutes.forge = 15;
    this.state.state.llmProvider = current;
    this.state.state.activeAgentModels = buildAgentModels(current);
    this.state.save();
  }

  // ─── Entry point ────────────────────────────────────────────

  async start() {
    acquireRunnerLock();

    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.yellow('  🦾 HIVE MIND — Autonomous Mode       ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));

    log('system', 'Autonomous runner started. Agents will work on their schedules.');
    log('system', `LLM provider: ${process.env.LLM_PROVIDER}`);
    log('system', `Check interval: every ${CHECK_INTERVAL_MS / 60000} minutes`);
    log('system', 'Press Ctrl+C to stop. Human commands still work in another terminal.\n');

    this.state.state.running = true;
    this.state.save();

    // Run immediately on start
    await this.cycle();

    // Then on interval
    this.intervalId = setInterval(async () => {
      if (this.cycleInProgress) {
        log('system', 'Previous cycle still running; skipping this interval tick.');
        return;
      }
      await this.cycle();
    }, CHECK_INTERVAL_MS);

    // CEO bridge is processed more frequently than full cycles for faster replies.
    this.bridgeIntervalId = setInterval(async () => {
      try {
        await this.processCeoBridge();
      } catch (err) {
        log('system', `CEO bridge error: ${err.message}`);
      }
    }, 10 * 1000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      log('system', 'Shutting down gracefully...');
      clearInterval(this.intervalId);
      clearInterval(this.bridgeIntervalId);
      this.state.state.running = false;
      this.state.save();
      releaseRunnerLock();
      process.exit(0);
    });

    process.on('exit', () => {
      releaseRunnerLock();
    });
  }

  // ─── Deadline enforcement ────────────────────────────────────

  _isStaleDeadline(task) {
    const status = getProjectStatus(task.projectName);
    const current = String(status.stage || '').toLowerCase();
    const target = String(task.stage || '').toLowerCase();

    const curRank = stageRank(current);
    const targetRank = stageRank(target);
    if (curRank < 0 || targetRank < 0) return false;

    // Deadline stage has already been reached/passed, or is too far ahead after a stage regression.
    return curRank >= targetRank || targetRank > curRank + 1;
  }

  _reconcileOverdue(overdue) {
    const actionable = [];
    for (const task of overdue) {
      if (this._isStaleDeadline(task)) {
        this.deadlines.complete(task.projectName, task.stage);
        log('system', `Cleared stale deadline: ${task.projectName}::${task.stage} (already reached).`);
        continue;
      }
      actionable.push(task);
    }
    return actionable;
  }

  async checkDeadlines() {
    const overdue = this._reconcileOverdue(this.deadlines.getOverdue());
    if (!overdue.length) return;

    log('apex', `⚠ ${overdue.length} overdue task(s) detected`);
    for (const task of overdue) {
      const hoursLate = ((Date.now() - new Date(task.dueAt)) / 3600000).toFixed(1);
      log('apex', `  • "${task.projectName}" → ${task.stage} (${task.agent.toUpperCase()} is ${hoursLate}h late)`);

      setProjectStatus(task.projectName, {
        deadlineMissed: true,
        missedStage: task.stage,
        missedAgent: task.agent,
        missedAt: new Date().toISOString(),
      });

      // Wake the responsible agent by clearing their last-run timestamp
      delete this.state.state.agentLastRun[task.agent];
      this.state.save();
      log('apex', `  → Waking ${task.agent.toUpperCase()} to retry`);
    }
  }

  _mentionedAgents(text = '') {
    const msg = String(text || '').toLowerCase();
    return Object.keys(AGENT_SCHEDULE).filter((name) => msg.includes(name));
  }

  _agentOpsSummary(agent) {
    const last = this.state.state.agentLastRun?.[agent];
    const cycle = this.state.getCycleMinutes(agent);
    const due = this.state.isAgentDue(agent);
    const minsSince = last ? Math.floor((Date.now() - new Date(last).getTime()) / 60000) : null;
    const wait = minsSince === null ? 0 : Math.max(0, cycle - minsSince);

    const stageOwners = STAGE_RESPONSIBLE_AGENT;
    const assigned = getActiveProjectsWithStatus()
      .filter(({ status }) => stageOwners[status.stage] === agent)
      .map(({ name, status }) => `${name}:${status.stage}`);

    return `${agent.toUpperCase()} status=${due ? 'DUE' : 'REST'} cycle=${cycle}m last=${minsSince === null ? 'never' : `${minsSince}m ago`} next=${wait}m assignments=${assigned.length ? assigned.join(', ') : 'none'}`;
  }

  async processCeoBridge() {
    const bridge = loadCeoBridge();
    const pending = bridge.messages.filter((m) => m?.from === 'ceo' && !m.handledAt);
    if (!pending.length) return;

    for (const msg of pending) {
      const text = String(msg.message || '');
      const lower = text.toLowerCase();
      const mentioned = this._mentionedAgents(text);
      const strictOrder =
        lower.includes('strict') ||
        lower.includes('stop resting') ||
        lower.includes('wake') ||
        lower.includes('immediate');
      const asksWhy = lower.includes('why') || lower.includes('status') || lower.includes('not working');

      const responseParts = [];

      if (strictOrder && mentioned.length) {
        for (const agent of mentioned) {
          delete this.state.state.agentLastRun[agent];
        }
        this.state.save();
        responseParts.push(`Strict order accepted. Forced wake: ${mentioned.map((a) => a.toUpperCase()).join(', ')}.`);
      }

      if (asksWhy) {
        const targets = mentioned.length ? mentioned : ['apex', 'forge'];
        responseParts.push(...targets.map((agent) => this._agentOpsSummary(agent)));
      }

      if (!responseParts.length) {
        try {
          const convo = await this.agents.apex.think(
            `You are speaking directly to the HUMAN CEO in a private bridge.
Respond naturally and briefly (2-5 lines), with operational clarity.
Do not ask for approval. You remain in full control of execution.

CEO message:
${text}`
          );
          responseParts.push(String(convo || '').trim() || 'Acknowledged. I am monitoring execution and will enforce discipline.');
        } catch (err) {
          responseParts.push('Acknowledged. I am monitoring execution and will enforce discipline.');
        }
      }

      const reply = {
        id: `apex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        from: 'apex',
        message: responseParts.join('\n'),
        at: new Date().toISOString(),
        inReplyTo: msg.id || null,
      };

      msg.handledAt = new Date().toISOString();
      msg.handledBy = 'apex';
      bridge.messages.push(reply);
      log('apex', `CEO bridge: processed command "${text.slice(0, 90)}"`);
    }

    saveCeoBridge(bridge);
  }

  // ─── One full cycle ─────────────────────────────────────────

  async cycle() {
    if (this.cycleInProgress) {
      log('system', 'Cycle already in progress; ignoring duplicate trigger.');
      return;
    }
    this.cycleInProgress = true;

    this.state.state.cycleCount++;
    this.state.state.lastCycle = new Date().toISOString();
    this.state.save();

    log('system', `\n── Cycle #${this.state.state.cycleCount} ─────────────────────────`);
    const dueSnapshot = Object.fromEntries(
      Object.keys(AGENT_SCHEDULE).map((name) => [name, this.state.isAgentDue(name)])
    );
    const dueAgents = Object.keys(dueSnapshot).filter((name) => dueSnapshot[name]);
    if (dueAgents.length) {
      log('system', `Due agents this cycle: ${dueAgents.map((a) => a.toUpperCase()).join(', ')}`);
    } else {
      log('system', 'No agents due this cycle (waiting for schedules).');
    }

    try {
      this.cleanupOldRuns();
      // 0.5 Ensure projects have real workspace files and revoke invalid "complete" states.
      for (const name of getProjects()) {
        const projectStatus = getProjectStatus(name);
        ensureWorkspaceScaffold(name, projectStatus.preferredStack || projectStatus.stack || projectStatus.template || '');
        if (!hasRealProjectFiles(name)) {
          const count = hydrateWorkspaceFromOutputs(name);
          if (count) log('system', `Backfilled ${count} workspace file(s) for "${name}" from implementation output.`);
        }
        const status = getProjectStatus(name);
        if (status.stage === 'complete' && !hasRealProjectFiles(name)) {
          setProjectStatus(name, {
            stage: 'architecture',
            stageOwner: STAGE_RESPONSIBLE_AGENT.architecture,
            stageAttempt: 1,
            completionRevoked: true,
            completionRevokedAt: new Date().toISOString(),
            completionRevokedReason: 'No real source files materialized in workspace',
          });
          log('system', `Reopened "${name}": completion revoked because no real source files exist.`);
        }
      }

      // 0. CEO -> APEX bridge commands
      await this.processCeoBridge();

      const activeProjects = getActiveProjectsWithStatus();
      const capacityFull = activeProjects.length >= MAX_ACTIVE_PROJECTS;
      if (capacityFull) {
        log('system', `Capacity mode: ${activeProjects.length} active project(s). Holding new intake until fewer than ${MAX_ACTIVE_PROJECTS}.`);
      }

      // 1. Check & enforce deadlines
      await this.checkDeadlines();

      // 2. NOVA generates new ideas (if due)
      if (dueSnapshot.nova && !capacityFull) {
        const ok = await this.novaGeneratesIdeas();
        this.state.markAgentRun('nova', { worked: true, success: ok !== false });
      } else if (dueSnapshot.nova && capacityFull) {
        log('nova', `Skipping idea generation: active project limit reached (${activeProjects.length}/${MAX_ACTIVE_PROJECTS}).`);
        this.state.markAgentRun('nova', { worked: false });
      }

      // 3. SCOUT validates pending proposals (if due)
      if (dueSnapshot.scout && !capacityFull) {
        const ok = await this.scoutValidatesProposals();
        this.state.markAgentRun('scout', { worked: true, success: ok !== false });
      } else if (dueSnapshot.scout && capacityFull) {
        const pendingScout = loadQueue().filter((p) => p.status === 'pending_scout').length;
        if (pendingScout) {
          log('scout', `Holding ${pendingScout} pending proposal(s): capacity gate active.`);
        } else {
          log('scout', 'No proposal intake while capacity gate is active.');
        }
        this.state.markAgentRun('scout', { worked: false });
      }

      // 4. APEX reviews validated proposals (if due)
      if (dueSnapshot.apex) {
        const ok = await this.apexReviewsAndDecides({ blockApprovals: capacityFull, activeCount: activeProjects.length });
        this.state.markAgentRun('apex', { worked: ok === true, success: ok !== false });
      }

      // 5. Advance active projects through pipeline
      await this.advanceProjects(dueSnapshot);

    } catch (err) {
      log('system', `Cycle error: ${err.message}`);
    } finally {
      this.cycleInProgress = false;
    }
  }

  // ─── NOVA: Generate new ideas autonomously ──────────────────

  async novaGeneratesIdeas() {
    log('nova', 'Waking up... thinking of new project ideas');

    // Give NOVA context about existing projects to avoid duplication
    const existingProjects = getProjects().join(', ') || 'none yet';
    const existingIdeas    = this.duplicates.index.ideas.map(i => i.title).join(', ') || 'none yet';

    const context = `Existing projects: ${existingProjects}. Already proposed ideas: ${existingIdeas}.
Do NOT propose anything similar to these. Think of genuinely new, useful developer tools or automation projects.`;

    let proposals;
    try {
      proposals = await this.agents.nova.generateProposals(context);
      if (!Array.isArray(proposals)) throw new Error('Invalid response format');
    } catch (err) {
      log('nova', `Failed to generate proposals: ${err.message}`);
      return false;
    }

    let newCount = 0;
    for (const proposal of proposals) {
      if (!proposal.title || !proposal.description) continue;

      // Duplicate check
      const dupCheck = this.duplicates.isDuplicate(proposal.title, proposal.description);
      if (dupCheck.isDuplicate) {
        log('nova', `⚠ Skipping "${proposal.title}" — too similar to "${dupCheck.similarTo.title}" (${(dupCheck.similarity * 100).toFixed(0)}% match)`);
        this.state.increment('duplicatesBlocked');
        continue;
      }

      // Add to queue
      const queue = loadQueue();
      const id    = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      queue.push({
        id,
        title:       proposal.title,
        description: proposal.description,
        goal:        proposal.problem,
        audience:    proposal.audience,
        complexity:  proposal.complexity,
        reasoning:   proposal.reasoning,
        projectType: proposal.projectType || 'tooling',
        preferredStack: proposal.preferredStack || proposal.stack || '',
        template: proposal.template || '',
        proposedBy:  'nova',
        proposedAt:  new Date().toISOString(),
        status:      'pending_scout', // SCOUT validates first
      });
      saveQueue(queue);
      this.duplicates.register(proposal.title, proposal.description, 'idea');
      this.state.increment('proposed');
      newCount++;

      log('nova', `💡 Proposed: "${proposal.title}" (${proposal.complexity})`);
    }

    if (newCount === 0) {
      log('nova', 'No new unique ideas this cycle. Resting.');
    } else {
      log('nova', `✓ Submitted ${newCount} new proposal(s) for SCOUT review. Going to rest.`);
    }
    return true;
  }

  // ─── SCOUT: Validate & research proposals ───────────────────

  async scoutValidatesProposals() {
    const queue    = loadQueue();
    const pending  = queue.filter(p => p.status === 'pending_scout');

    if (!pending.length) {
      log('scout', 'No proposals to validate. Resting.');
      return false;
    }

    log('scout', `Validating ${pending.length} proposal(s)...`);

    for (const proposal of pending) {
      log('scout', `Researching: "${proposal.title}"`);

      try {
        const research = await this.agents.scout.research(
          `${proposal.title}: ${proposal.description}`,
          `Problem it solves: ${proposal.goal}. Audience: ${proposal.audience}`
        );

        // SCOUT posts findings to a discussion thread
        const threadId = proposal.id;
        this.discussion.startThread(threadId, proposal.title);
        this.discussion.post(threadId, 'nova', `I propose: ${proposal.description}. Reasoning: ${proposal.reasoning}`);
        this.discussion.post(threadId, 'scout', `Research findings:\n${research.slice(0, 600)}`);

        // Update proposal with research
        const idx = queue.findIndex(p => p.id === proposal.id);
        queue[idx].status       = 'pending_apex';
        queue[idx].scoutNotes   = research.slice(0, 800);
        queue[idx].threadId     = threadId;
        queue[idx].scoutedAt    = new Date().toISOString();

        log('scout', `✓ Research complete for "${proposal.title}". Forwarding to APEX.`);
      } catch (err) {
        log('scout', `✗ Failed to research "${proposal.title}": ${err.message}`);
      }
    }

    saveQueue(queue);
    log('scout', 'Done validating. Going to rest.');
    return true;
  }

  // ─── APEX: Review, discuss, decide ──────────────────────────

  async apexReviewsAndDecides(opts = {}) {
    const { blockApprovals = false, activeCount = 0 } = opts;
    const queue   = loadQueue();
    const pending = queue.filter(p => p.status === 'pending_apex');

    if (!pending.length) {
      log('apex', 'No pending proposals.');
      return false;
    }

    if (blockApprovals) {
      log('apex', `Capacity gate active (${activeCount}/${MAX_ACTIVE_PROJECTS} active). Holding ${pending.length} pending APEX decision(s).`);
      return false;
    }

    log('apex', `Reviewing ${pending.length} proposal(s)...`);

    for (const proposal of pending) {
      try {
        // APEX reads the discussion thread
        const thread = this.discussion.getThread(proposal.threadId || proposal.id);
        const discussion = thread ? this.discussion.formatThread(thread) : '';

        // APEX adds their own input before deciding
        const apexThought = await this.agents.apex.agents?.nova
          ? '' // don't self-consult
          : await this.agents.scout.think(
              `Given this discussion about "${proposal.title}", what are the key concerns an operations head should weigh?\nDiscussion:\n${discussion}`,
              []
            );

        if (thread && apexThought) {
          this.discussion.post(proposal.threadId, 'apex', apexThought.slice(0, 400));
        }

        // Make the decision
        const decision = await this.agents.apex.reviewProposal({
          ...proposal,
          additionalContext: `Scout research notes:\n${proposal.scoutNotes || ''}\n\nTeam discussion:\n${discussion}`,
        });

        const idx = queue.findIndex(p => p.id === proposal.id);
        queue[idx].decision   = decision;
        queue[idx].decidedAt  = new Date().toISOString();

        if (decision.decision === 'APPROVED') {
          queue[idx].status = 'approved';
          this.state.increment('approved');
          this.discussion.closeThread(proposal.id, 'APPROVED');

          // Create project folder
          await this.createProjectFolder(proposal, decision);
          log('apex', `✅ APPROVED: "${proposal.title}" — folder created`);

        } else if (decision.decision === 'REJECTED') {
          queue[idx].status = 'rejected';
          this.state.increment('rejected');
          this.discussion.closeThread(proposal.id, `REJECTED: ${decision.reasoning}`);
          log('apex', `❌ REJECTED: "${proposal.title}" — ${decision.reasoning}`);

        } else {
          // REVISION_REQUESTED — NOVA will see this and resubmit
          queue[idx].status          = 'needs_revision';
          queue[idx].revisionFeedback = decision.feedback;
          this.discussion.post(proposal.id, 'apex', `Revision needed: ${decision.feedback}`);
          log('apex', `🔄 REVISION REQUESTED: "${proposal.title}"`);
        }

      } catch (err) {
        log('apex', `Error reviewing "${proposal.title}": ${err.message}`);
      }
    }

    saveQueue(queue);
    log('apex', 'Reviews complete. Going to rest.');
    return true;
  }

  // ─── APEX: Health check on active projects ───────────────────

  async apexChecksProjectHealth() {
    const overdue = this._reconcileOverdue(this.deadlines.getOverdue());
    if (!overdue.length) return;

    log('apex', `⚠ Found ${overdue.length} overdue task(s)!`);

    for (const task of overdue) {
      const hoursLate = ((Date.now() - new Date(task.dueAt)) / 3600000).toFixed(1);
      log('apex', `  • "${task.projectName}" → ${task.stage} (${task.agent.toUpperCase()} is ${hoursLate}h late)`);

      // Mark as overdue, pipeline will retry next cycle
      setProjectStatus(task.projectName, {
        deadlineMissed: true,
        missedStage: task.stage,
        missedAgent: task.agent,
        missedAt: new Date().toISOString(),
      });

      // "Wake up" the responsible agent by clearing their last-run
      delete this.state.state.agentLastRun[task.agent];
      this.state.save();
      log('apex', `  → Reassigning ${task.stage} to ${task.agent.toUpperCase()} (deadline reset)`);
    }
  }

  // ─── Create project folder (AI-initiated) ───────────────────

  async createProjectFolder(proposal, decision) {
    const slug = proposal.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    const dir = path.join(PROJECTS_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });

    const readme = `# ${proposal.title}

> **Proposed by:** NOVA (AI-generated)  
> **Approved by:** APEX  
> **Approval score:** ${decision.overall}/10  
> **Status:** In Progress  
> **Created:** ${new Date().toLocaleDateString()}

## What It Does

${proposal.description}

## Problem It Solves

${proposal.goal || 'See description above.'}

## Target Audience

${proposal.audience || 'Developers'}

## Complexity

${proposal.complexity || 'Medium'}

## Project Type

${proposal.projectType || 'tooling'}

## Preferred Stack / Template

${proposal.preferredStack || proposal.stack || proposal.template || 'Agent decides based on feasibility'}

## Why Build This

${proposal.reasoning || 'Identified as a valuable addition by the Hive team.'}

## APEX Reasoning

${decision.reasoning}

## Definition of Done

- [ ] Core functionality implemented
- [ ] LENS code review passed
- [ ] PULSE tests passing
- [ ] SAGE documentation complete
- [ ] ECHO launch content ready

---
*This project was autonomously proposed by NOVA and approved by APEX.*  
*Human contributions welcome — edit this README to add requirements.*
`;

    fs.writeFileSync(path.join(dir, 'README.md'), readme);
    ensureWorkspaceScaffold(slug, proposal.preferredStack || proposal.stack || proposal.template || '');
    setProjectStatus(slug, {
      stage: 'approved',
      stageOwner: STAGE_RESPONSIBLE_AGENT.approved,
      stageAttempt: 1,
      blockedReason: null,
      proposedBy: 'nova',
      approvedBy: 'apex',
      approvalScore: decision.overall,
      projectType: proposal.projectType || 'tooling',
      preferredStack: proposal.preferredStack || proposal.stack || '',
      template: proposal.template || '',
      lensVerdict: null,
      lensActionItems: [],
      lastHandoffRunId: null,
      escalationLevel: 'none',
      approvedAt: new Date().toISOString(),
    });

    this.duplicates.register(proposal.title, proposal.description, 'project');
    log('apex', `📁 Created: projects/${slug}/`);
    return slug;
  }

  // ─── Advance projects through the pipeline ──────────────────

  async advanceProjects(dueSnapshot = {}) {
    const all = getActiveProjectsWithStatus()
      .sort((a, b) => projectPriorityTs(a.status) - projectPriorityTs(b.status));
    const prioritized = all.slice(0, MAX_ACTIVE_PROJECTS);
    const deferred = all.slice(MAX_ACTIVE_PROJECTS);
    const blocked = [];
    let progressed = false;
    const MAX_STAGE_HOPS_PER_CYCLE = 3;

    if (deferred.length) {
      log('system', `Project priority active: processing oldest ${MAX_ACTIVE_PROJECTS}, deferring ${deferred.length} newer project(s).`);
    }

    for (const { name, status } of prioritized) {
      let currentStatus = status;
      let hops = 0;

      while (hops < MAX_STAGE_HOPS_PER_CYCLE) {
        // Skip completed, failed, or projects pending approval
        if (['complete', 'failed', 'new'].includes(currentStatus.stage)) break;

        // Map stages to agents
        const stageMap = {
          approved:       { agent: 'scout',  next: 'research',        agentKey: 'scout' },
          research:       { agent: 'atlas',  next: 'architecture',    agentKey: 'atlas' },
          architecture:   { agent: 'forge',  next: 'implementation',  agentKey: 'forge' },
          implementation: { agent: 'lens',   next: 'review',          agentKey: 'lens'  },
          review:         { agent: 'pulse',  next: 'tests',           agentKey: 'pulse' },
          tests:          { agent: 'sage',   next: 'docs',            agentKey: 'sage'  },
          docs:           { agent: 'echo',   next: 'launch',          agentKey: 'echo'  },
          launch:         { agent: null,     next: 'complete',        agentKey: null    },
        };

        const stageInfo = stageMap[currentStatus.stage];
        if (!stageInfo || !stageInfo.agentKey) {
          if (currentStatus.stage === 'launch' && !hasRealProjectFiles(name)) {
            log('system', `Completion blocked for "${name}": no real source files in projects/${name}/workspace`);
            break;
          }
          if (currentStatus.stage !== 'complete') {
            const workspaceFiles = listWorkspaceFiles(name);
            setProjectStatus(name, { stage: 'complete', stageOwner: null, stageAttempt: 1, blockedReason: null, workspaceFiles });
            this.state.increment('completed');
            log('system', `🎉 Project "${name}" is COMPLETE!`);
          }
          break;
        }

        // Only proceed if the responsible agent is due
        if (!dueSnapshot[stageInfo.agentKey]) {
          const last = this.state.state.agentLastRun?.[stageInfo.agentKey];
          const cycleMinutes = this.state.getCycleMinutes(stageInfo.agentKey);
          const minutesSince = last ? (Date.now() - new Date(last).getTime()) / 60000 : cycleMinutes;
          const minsLeft = Math.max(0, Math.ceil(cycleMinutes - minutesSince));
          const forceNow = STRICT_ORDER_OVERRIDE || currentStatus.escalationLevel === 'force_progress';
          if (forceNow) {
            log('apex', `Strict order: waking ${stageInfo.agentKey.toUpperCase()} now for "${name}" (${currentStatus.stage}); skipped wait ${minsLeft}m.`);
            delete this.state.state.agentLastRun[stageInfo.agentKey];
            this.state.save();
            dueSnapshot[stageInfo.agentKey] = true;
          } else {
            blocked.push({ project: name, stage: currentStatus.stage, agent: stageInfo.agentKey, minsLeft });
            break;
          }
        }

        const beforeStage = currentStatus.stage;
        const run = await this.runProjectStage(name, currentStatus.stage, stageInfo, currentStatus);
        this.state.markAgentRun(stageInfo.agentKey, { worked: true, success: run?.success !== false });
        progressed = progressed || run?.worked !== false;

        currentStatus = getProjectStatus(name);
        hops += 1;

        if (run?.haltProjectThisCycle) break;

        // If stage didn't change, don't spin.
        if (currentStatus.stage === beforeStage) break;
      }
    }

    if (!progressed && blocked.length) {
      const lines = blocked
        .map((b) => `${b.project}:${b.stage} waiting for ${b.agent.toUpperCase()} (${b.minsLeft}m)`)
        .join(' | ');
      log('system', `No stage advancement this cycle: ${lines}`);
    }
  }

  async runProjectStage(projectName, stage, stageInfo, status) {
    const readmePath = path.join(PROJECTS_DIR, projectName, 'README.md');
    const readme     = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
    const model = this.state.state.activeAgentModels?.[stageInfo.agentKey] || 'unknown';
    const run = beginRunArtifact({
      projectName,
      stage,
      agentKey: stageInfo.agentKey,
      status,
      parentRunId: status.lastHandoffRunId || null,
      provider: this.state.state.llmProvider || process.env.LLM_PROVIDER,
      model,
    });

    log(stageInfo.agentKey, `Working on "${projectName}" → ${stage}`);
    transitionProjectStage(projectName, stage, { reason: 'agent execution started', runId: run.runId });

    // Set a deadline for this stage
    const hoursMap = { scout: 2, atlas: 3, forge: 6, lens: 2, pulse: 2, sage: 2, echo: 1 };
    this.deadlines.set(projectName, stageInfo.next, stageInfo.agentKey, hoursMap[stageInfo.agentKey] || 4);

    try {
      let output = '';
      const riskClass = classifyRisk(`${stageInfo.agentKey}:${stage}`);
      const decisionApproved = APPROVAL_MODE !== 'risk_based' || riskClass !== 'high';
      if (!decisionApproved) {
        appendRunEvidence(projectName, run.runId, 'risk-gate.txt', `Risk class: ${riskClass}\nMode: ${APPROVAL_MODE}\nAction deferred pending APEX.`);
        finalizeRunArtifact(projectName, run.runId, {
          outcome: 'deferred',
          rationale: 'High-risk action requires APEX decision artifact.',
          risk: riskClass,
          approved: false,
          approvedBy: 'apex',
          fromAgent: stageInfo.agentKey,
          toAgent: 'apex',
          project: projectName,
          stage,
          summary: 'Execution blocked by risk gate.',
          modelInfo: { provider: this.state.state.llmProvider || process.env.LLM_PROVIDER, model },
        });
        setProjectStatus(projectName, {
          blockedReason: { code: 'risk_gate_blocked', message: `High risk action blocked for ${stage}. Await APEX decision.` },
          escalationLevel: 'apex_watch',
        });
        return { worked: false, success: false, haltProjectThisCycle: true };
      }
      appendRunEvidence(projectName, run.runId, 'risk-gate.txt', `Risk class: ${riskClass}\nMode: ${APPROVAL_MODE}\nDecision: auto-approved.`);

      switch (stage) {
        case 'approved':
          output = await this.agents.scout.research(readme);
          writeOutput(projectName, 'research.md', output);
          appendRunEvidence(projectName, run.runId, 'research.md', output.slice(0, 4000));
          break;

        case 'research':
          const research = readOutput(projectName, 'research.md');
          output = await this.agents.atlas.design(readme, research);
          writeOutput(projectName, 'architecture.md', output);
          appendRunEvidence(projectName, run.runId, 'architecture.md', output.slice(0, 4000));
          break;

        case 'architecture':
          const arch = readOutput(projectName, 'architecture.md');
          const res  = readOutput(projectName, 'research.md');
          const previousImplementation = readOutput(projectName, 'implementation.md');
          const bootstrap = ensureProjectBootstrap(projectName, status, readme);
          appendRunEvidence(projectName, run.runId, 'bootstrap.txt', bootstrap.notes.join('\n') || 'No bootstrap notes.');
          const bootstrapBlock = bootstrap.notes.length
            ? `\n\n## Workspace Bootstrap\nTemplate: ${bootstrap.template}\n${bootstrap.notes.map((n) => `- ${n}`).join('\n')}\n`
            : '';
          const remediationItems = [
            ...(Array.isArray(status.lensActionItems) ? status.lensActionItems : []),
            ...(Array.isArray(status.pulseActionItems) ? status.pulseActionItems : []),
          ];
          const mandatoryFixMap = Array.isArray(status.lensActionItems) && status.lensActionItems.length
            ? `\n\n## Required FIX_MAP\nFor every lens action item below, include a FIX_MAP section using "ID -> change".\n${status.lensActionItems.map((x) => `- ${x.id} -> ${x.requirement}`).join('\n')}\n`
            : '';
          const remediationBlock = remediationItems.length
            ? `\n\n## Mandatory Rework (LENS/PULSE)\n${remediationItems.map((x, i) => `${i + 1}. ${x.requirement || x}`).join('\n')}\n`
            : '';
          const previousImplBlock = previousImplementation.trim()
            ? `\n\n## Previous Implementation (fix this, do not restart from scratch)\n${previousImplementation.slice(0, 12000)}\n`
            : '';
          const taskForForge = `${readme}${bootstrapBlock}${mandatoryFixMap}${remediationBlock}${previousImplBlock}`;
          output = await this.agents.forge.implement(taskForForge, arch, res);
          writeOutput(projectName, 'implementation.md', output);
          appendRunEvidence(projectName, run.runId, 'implementation.md', output.slice(0, 6000));
          if (Array.isArray(status.lensActionItems) && status.lensActionItems.length) {
            const fixMap = parseForgeFixMap(output);
            const missing = status.lensActionItems.filter((item) => !fixMap[String(item.id || '').toUpperCase()]);
            if (missing.length) {
              setProjectStatus(projectName, {
                blockedReason: {
                  code: 'missing_fix_map',
                  message: `FORGE response missing FIX_MAP references for: ${missing.map((m) => m.id).join(', ')}`,
                },
              });
              finalizeRunArtifact(projectName, run.runId, {
                outcome: 'rejected',
                rationale: 'FORGE must include FIX_MAP references for all LENS action items.',
                risk: riskClass,
                fromAgent: 'forge',
                toAgent: 'forge',
                project: projectName,
                stage,
                summary: `Missing FIX_MAP IDs: ${missing.map((m) => m.id).join(', ')}`,
                requiredActions: missing.map((m) => `${m.id}: ${m.requirement}`),
                modelInfo: { provider: this.state.state.llmProvider || process.env.LLM_PROVIDER, model },
              });
              return { worked: true, success: false, haltProjectThisCycle: true };
            }
            setProjectStatus(projectName, { forgeFixMap: fixMap });
          }
          {
            ensureWorkspaceScaffold(projectName, status.preferredStack || status.stack || status.template || '');
            const written = materializeForgeFiles(projectName, output);
            if (written.length) {
              const check = runWorkspaceChecks(projectName);
              writeOutput(projectName, 'workspace-check.txt', check.report);
              setProjectStatus(projectName, {
                workspaceFiles: written,
                workspaceUpdatedAt: new Date().toISOString(),
                bootstrapTemplate: bootstrap.template,
                bootstrapNotes: bootstrap.notes,
                blockedReason: check.failed > 0 ? { code: 'workspace_invalid', message: 'Workspace checks failed. FORGE must fix syntax/runtime issues.' } : null,
                workspaceCheck: {
                  checked: check.checked,
                  passed: check.passed,
                  failed: check.failed,
                  ranAt: new Date().toISOString(),
                },
              });
              log('forge', `Materialized ${written.length} code file(s) in projects/${projectName}/workspace (checks: ${check.passed}/${check.checked} passed).`);
            } else {
              log('forge', `No file blocks detected. Kept markdown output only for "${projectName}".`);
            }
          }
          break;

        case 'implementation':
          const impl = readOutput(projectName, 'implementation.md');
          output = await this.agents.lens.review(impl, readme);
          writeOutput(projectName, 'review.md', output);
          appendRunEvidence(projectName, run.runId, 'review.md', output.slice(0, 5000));

          // Check if LENS approved
          if (output.toLowerCase().includes('needs_changes') || output.toLowerCase().includes('rejected')) {
            const lensSummary = summarizeLensReview(output);
            const lensActionItems = extractLensActionItems(output, 8);
            const nextRejectCount = (Number(status.lensRejectCount) || 0) + 1;
            log('lens', `⚠ Code issues found in "${projectName}". Sending back to FORGE.`);
            log('lens', `   Issues: ${lensSummary}`);
            const repeats = { ...(status.lensIssueRepeats || {}) };
            for (const item of lensActionItems) {
              repeats[item.id] = Number(repeats[item.id] || 0) + 1;
            }
            const hasRepeatedCritical = lensActionItems.some((item) => item.severity === 'critical' && Number(repeats[item.id] || 0) >= MAX_LENS_REJECTS_BEFORE_BYPASS);
            const shouldBypass = nextRejectCount >= MAX_LENS_REJECTS_BEFORE_BYPASS || hasRepeatedCritical;

            if (shouldBypass) {
              setProjectStatus(projectName, {
                stage: 'review',
                stageOwner: STAGE_RESPONSIBLE_AGENT.review,
                stageAttempt: 1,
                blockedReason: null,
                lensRejected: false,
                lensApproved: false,
                lensBypassed: true,
                lensBypassReason: `LENS rejected ${nextRejectCount} times. Auto-advanced to unblock pipeline.`,
                lensBypassedAt: new Date().toISOString(),
                lensReviewSummary: null,
                lensVerdict: 'NEEDS_CHANGES',
                lensActionItems: [],
                lensRejectCount: nextRejectCount,
                lensIssueRepeats: repeats,
                lensReviewedAt: new Date().toISOString(),
                escalationNeeded: true,
                escalationReason: 'Repeated LENS rejections',
                escalatedAt: new Date().toISOString(),
                escalationLevel: 'force_progress',
              });
              delete this.state.state.agentLastRun.apex;
              delete this.state.state.agentLastRun.pulse;
              this.state.save();
              log('apex', `🚨 Escalation: "${projectName}" rejected by LENS ${nextRejectCount} times. Auto-bypassing to PULSE review.`);
              this.deadlines.complete(projectName, stageInfo.next);
              finalizeRunArtifact(projectName, run.runId, {
                outcome: 'approved',
                rationale: 'Escalation policy bypassed repeated rejection loop to progress pipeline.',
                risk: riskClass,
                fromAgent: 'lens',
                toAgent: 'pulse',
                project: projectName,
                stage,
                summary: 'LENS bypassed after repeated rejections.',
                requiredActions: [lensSummary],
                modelInfo: { provider: this.state.state.llmProvider || process.env.LLM_PROVIDER, model },
              });
              return { worked: true, success: true, haltProjectThisCycle: true };
            }

            setProjectStatus(projectName, {
              stage: 'architecture',
              stageOwner: STAGE_RESPONSIBLE_AGENT.architecture,
              stageAttempt: Number(status.stageAttempt || 1) + 1,
              blockedReason: {
                code: 'lens_rejected',
                message: lensSummary,
              },
              lensRejected: true,
              lensApproved: false,
              lensVerdict: 'NEEDS_CHANGES',
              lensReviewSummary: lensSummary,
              lensActionItems,
              lensRejectCount: nextRejectCount,
              lensIssueRepeats: repeats,
              escalationLevel: hasRepeatedCritical ? 'apex_watch' : 'none',
              lensReviewedAt: new Date().toISOString(),
              lensBypassed: false,
              lensBypassReason: null,
              lensBypassedAt: null,
            });
            this.deadlines.complete(projectName, stageInfo.next);
            finalizeRunArtifact(projectName, run.runId, {
              outcome: 'rejected',
              rationale: 'LENS found critical issues and sent implementation back to FORGE.',
              risk: riskClass,
              fromAgent: 'lens',
              toAgent: 'forge',
              project: projectName,
              stage,
              summary: lensSummary,
              requiredActions: lensActionItems.map((item) => `${item.id}: ${item.requirement}`),
              modelInfo: { provider: this.state.state.llmProvider || process.env.LLM_PROVIDER, model },
            });
            return { worked: true, success: true, haltProjectThisCycle: true };
          }

          setProjectStatus(projectName, {
            lensRejected: false,
            lensApproved: true,
            lensVerdict: 'APPROVED',
            lensAcceptedAt: new Date().toISOString(),
            lensReviewSummary: null,
            lensActionItems: [],
            lensRejectCount: 0,
            lensReviewedAt: new Date().toISOString(),
            lensBypassed: false,
            lensBypassReason: null,
            lensBypassedAt: null,
            escalationNeeded: false,
            escalationReason: null,
            escalationLevel: 'none',
            blockedReason: null,
          });
          log('lens', `✓ LENS accepted "${projectName}". Moving to PULSE.`);
          break;

        case 'review':
          const code  = readOutput(projectName, 'implementation.md');
          output = await this.agents.pulse.generateTests(code, readme);
          writeOutput(projectName, 'tests.md', output);
          {
            ensureWorkspaceScaffold(projectName, status.preferredStack || status.stack || status.template || '');
            const generatedTestFiles = materializeForgeFiles(projectName, output, {
              pathAllowList: [
                /^tests?\//i,
                /(^|\/).+\.test\.(js|jsx|ts|tsx|py)$/i,
                /(^|\/)(vitest|jest|pytest|playwright|cypress)\.config\.(js|cjs|mjs|ts)$/i,
                /(^|\/)(pytest\.ini|tox\.ini|setup\.cfg)$/i,
              ],
            });
            const testRun = runProjectTests(projectName);
            writeOutput(projectName, 'test-exec.txt', `Summary: ${testRun.summary}\n\n${testRun.raw || ''}`.trim());
            if (!testRun.passed) {
              setProjectStatus(projectName, {
                stage: 'architecture',
                stageOwner: STAGE_RESPONSIBLE_AGENT.architecture,
                stageAttempt: Number(status.stageAttempt || 1) + 1,
                pulseRejected: true,
                pulseSummary: testRun.summary,
                pulseActionItems: testRun.actionItems || [],
                pulseReviewedAt: new Date().toISOString(),
                pulseApproved: false,
                generatedTestFiles,
                blockedReason: {
                  code: 'tests_failed',
                  message: testRun.summary,
                },
              });
              log('pulse', `⚠ Tests/checks failed for "${projectName}". Sending back to FORGE.`);
              log('pulse', `   Issues: ${testRun.summary}`);
              this.deadlines.complete(projectName, stageInfo.next);
              finalizeRunArtifact(projectName, run.runId, {
                outcome: 'rejected',
                rationale: 'PULSE tests failed; implementation sent back for remediation.',
                risk: riskClass,
                fromAgent: 'pulse',
                toAgent: 'forge',
                project: projectName,
                stage,
                summary: testRun.summary,
                requiredActions: testRun.actionItems || [],
                modelInfo: { provider: this.state.state.llmProvider || process.env.LLM_PROVIDER, model },
              });
              return { worked: true, success: true, haltProjectThisCycle: true };
            }
            setProjectStatus(projectName, {
              pulseRejected: false,
              pulseSummary: testRun.summary,
              pulseActionItems: [],
              pulseReviewedAt: new Date().toISOString(),
              pulseApproved: true,
              pulseAcceptedAt: new Date().toISOString(),
              generatedTestFiles,
              blockedReason: null,
            });
            log('pulse', `✓ PULSE accepted "${projectName}" (${testRun.summary}).`);
          }
          break;

        case 'tests':
          output = await this.agents.sage.writeReadme({ name: projectName, description: readme });
          writeOutput(projectName, 'docs.md', output);
          break;

        case 'docs':
          output = await this.agents.echo.createLaunchContent({
            name: projectName,
            description: readme,
            features: readOutput(projectName, 'docs.md').slice(0, 300),
          });
          writeOutput(projectName, 'launch.md', output);
          break;
      }

      this.deadlines.complete(projectName, stageInfo.next);
      const updates = { stage: stageInfo.next, stageOwner: STAGE_RESPONSIBLE_AGENT[stageInfo.next] || null, stageAttempt: 1, blockedReason: null, lastHandoffRunId: run.runId };
      if (stage === 'architecture' && stageInfo.next === 'implementation') {
        updates.lensRejected = false;
        updates.lensApproved = false;
        updates.lensAcceptedAt = null;
        updates.lensReviewSummary = null;
        updates.lensVerdict = null;
        updates.lensActionItems = [];
        updates.lensBypassed = false;
        updates.lensBypassReason = null;
        updates.lensBypassedAt = null;
        updates.pulseRejected = false;
        updates.pulseApproved = false;
        updates.pulseAcceptedAt = null;
        updates.pulseSummary = null;
        updates.pulseActionItems = [];
      }
      setProjectStatus(projectName, updates);
      finalizeRunArtifact(projectName, run.runId, {
        outcome: 'approved',
        rationale: `${stage} completed.`,
        risk: riskClass,
        fromAgent: stageInfo.agentKey,
        toAgent: STAGE_RESPONSIBLE_AGENT[stageInfo.next] || null,
        project: projectName,
        stage,
        summary: `${projectName}: ${stage} -> ${stageInfo.next}`,
        artifacts: [`output/${stage}.md`, `output/${stageInfo.next}.md`],
        acceptanceChecks: stage === 'architecture' ? ['Workspace files materialized'] : [],
        modelInfo: { provider: this.state.state.llmProvider || process.env.LLM_PROVIDER, model },
      });
      log(stageInfo.agentKey, `✓ "${projectName}" → moved to "${stageInfo.next}"`);
      return { worked: true, success: true };

    } catch (err) {
      log(stageInfo.agentKey, `✗ Error on "${projectName}" at ${stage}: ${err.message}`);
      appendRunEvidence(projectName, run.runId, 'error.txt', String(err?.stack || err?.message || err));
      finalizeRunArtifact(projectName, run.runId, {
        outcome: 'rejected',
        rationale: String(err?.message || err),
        risk: 'safe',
        fromAgent: stageInfo.agentKey,
        toAgent: stageInfo.agentKey,
        project: projectName,
        stage,
        summary: `Execution failed at ${stage}: ${err.message}`,
        modelInfo: { provider: this.state.state.llmProvider || process.env.LLM_PROVIDER, model },
      });
      return { worked: true, success: false };
    }
  }
}

// ─── Start ────────────────────────────────────────────────────

const runner = new AutonomousRunner();
runner.start().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
