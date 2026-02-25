/**
 * Hive Mind Dashboard
 * Run: node dashboard.js
 * Shows live status of all agents, projects, and the proposal queue
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const chalk = require('chalk');

const PROJECTS_DIR    = path.join(__dirname, 'projects');
const QUEUE_FILE      = path.join(__dirname, '.hive', 'queue.json');
const STATE_FILE      = path.join(__dirname, '.hive', 'autonomous-state.json');
const DEADLINES_FILE  = path.join(__dirname, '.hive', 'deadlines.json');
const DISCUSS_DIR     = path.join(__dirname, '.hive', 'discussions');
const IDEA_INDEX      = path.join(__dirname, '.hive', 'idea-index.json');

function load(file, fallback = {}) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function timeSince(isoString) {
  if (!isoString) return 'never';
  const diff = Date.now() - new Date(isoString);
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeUntil(isoString) {
  if (!isoString) return '?';
  const diff = new Date(isoString) - Date.now();
  if (diff < 0) return chalk.red('OVERDUE');
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return chalk.yellow(`${mins}m`);
  return chalk.green(`${Math.floor(mins / 60)}h`);
}

function render() {
  console.clear();

  const state     = load(STATE_FILE, { running: false, cycleCount: 0, agentLastRun: {}, stats: {} });
  const queue     = load(QUEUE_FILE, []);
  const deadlines = load(DEADLINES_FILE, []);
  const ideaIndex = load(IDEA_INDEX, { ideas: [], projects: [] });

  const statusIcon = state.running ? chalk.green('● RUNNING') : chalk.red('● STOPPED');
  const now = new Date().toLocaleTimeString();

  // ─── Header ───────────────────────────────────────────────
  console.log(chalk.cyan('╔══════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.bold.yellow('  🦾 HIVE MIND DASHBOARD') + chalk.gray(`                     `) + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════════════╝'));
  console.log(`  Status: ${statusIcon}   Cycle: #${state.cycleCount}   Time: ${chalk.white(now)}`);
  console.log(`  Stats: ${chalk.yellow(state.stats?.proposed || 0)} proposed · ${chalk.green(state.stats?.approved || 0)} approved · ${chalk.red(state.stats?.rejected || 0)} rejected · ${chalk.blue(state.stats?.completed || 0)} completed · ${chalk.gray(state.stats?.duplicatesBlocked || 0)} dupes blocked`);

  // ─── Agent Status ─────────────────────────────────────────
  console.log('\n' + chalk.bold('AGENTS'));
  console.log('─'.repeat(52));

  const agents = [
    { key: 'nova',  name: 'NOVA',  role: 'Innovation Scout',  cycle: 60  },
    { key: 'scout', name: 'SCOUT', role: 'Researcher',         cycle: 45  },
    { key: 'apex',  name: 'APEX',  role: 'Operations Head',    cycle: 30  },
    { key: 'atlas', name: 'ATLAS', role: 'Architect',           cycle: 90  },
    { key: 'forge', name: 'FORGE', role: 'Developer',           cycle: 120 },
    { key: 'lens',  name: 'LENS',  role: 'Code Reviewer',       cycle: 60  },
    { key: 'pulse', name: 'PULSE', role: 'Tester',              cycle: 60  },
    { key: 'sage',  name: 'SAGE',  role: 'Documentation',       cycle: 90  },
    { key: 'echo',  name: 'ECHO',  role: 'Social Media',        cycle: 120 },
  ];

  for (const a of agents) {
    const lastRun = state.agentLastRun?.[a.key];
    const minsSince = lastRun ? (Date.now() - new Date(lastRun)) / 60000 : Infinity;
    const isDue = minsSince >= a.cycle;
    const statusDot = isDue ? chalk.yellow('◉ DUE') : chalk.green('◎ REST');
    const lastStr = lastRun ? timeSince(lastRun) : 'never run';
    const nextStr = lastRun
      ? chalk.gray(`next in ${Math.max(0, a.cycle - Math.floor(minsSince))}m`)
      : chalk.gray('next cycle');

    console.log(`  ${statusDot} ${chalk.bold(a.name.padEnd(6))} ${chalk.gray(a.role.padEnd(18))} last: ${lastStr.padEnd(10)} ${nextStr}`);
  }

  // ─── Proposal Queue ───────────────────────────────────────
  console.log('\n' + chalk.bold('PROPOSAL QUEUE'));
  console.log('─'.repeat(52));

  const pending = queue.filter(p => ['pending_scout', 'pending_apex', 'needs_revision'].includes(p.status));
  const recent  = queue.filter(p => ['approved', 'rejected'].includes(p.status)).slice(-5);

  if (!pending.length) {
    console.log(chalk.gray('  No pending proposals'));
  } else {
    for (const p of pending) {
      const icon = p.status === 'pending_scout' ? '🔍' : p.status === 'pending_apex' ? '⏳' : '🔄';
      console.log(`  ${icon} ${chalk.white(p.title.slice(0, 36).padEnd(36))} ${chalk.gray(p.status)}`);
    }
  }

  if (recent.length) {
    console.log(chalk.gray('\n  Recent decisions:'));
    for (const p of recent) {
      const icon = p.status === 'approved' ? chalk.green('✅') : chalk.red('❌');
      console.log(`  ${icon} ${chalk.gray(p.title.slice(0, 40))}`);
    }
  }

  // ─── Active Projects ──────────────────────────────────────
  console.log('\n' + chalk.bold('PROJECTS'));
  console.log('─'.repeat(52));

  const STAGES = ['approved','research','architecture','implementation','review','tests','docs','launch','complete'];
  const BAR_LEN = 20;

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log(chalk.gray('  No projects yet'));
  } else {
    const projects = fs.readdirSync(PROJECTS_DIR).filter(f => {
      return fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory() && !f.startsWith('_');
    });

    if (!projects.length) {
      console.log(chalk.gray('  No projects yet — NOVA will propose soon'));
    }

    for (const name of projects) {
      const sf = path.join(PROJECTS_DIR, name, 'status.json');
      const status = fs.existsSync(sf) ? load(sf) : { stage: 'new' };
      const stageIdx = STAGES.indexOf(status.stage);
      const progress = stageIdx >= 0 ? Math.round((stageIdx / (STAGES.length - 1)) * BAR_LEN) : 0;
      const bar = chalk.green('█'.repeat(progress)) + chalk.gray('░'.repeat(BAR_LEN - progress));

      const stageColor = status.stage === 'complete' ? chalk.green : chalk.yellow;
      console.log(`  ${bar} ${stageColor(status.stage.padEnd(16))} ${chalk.white(name.slice(0, 25))}`);
    }
  }

  // ─── Deadlines ────────────────────────────────────────────
  const active = deadlines.filter ? deadlines.filter(d => d.status === 'active') : [];
  if (active.length) {
    console.log('\n' + chalk.bold('DEADLINES'));
    console.log('─'.repeat(52));
    for (const d of active) {
      console.log(`  ${timeUntil(d.dueAt).padEnd(12)} ${chalk.gray(d.agent.toUpperCase().padEnd(6))} → ${d.projectName}::${d.stage}`);
    }
  }

  // ─── Idea Index ───────────────────────────────────────────
  console.log('\n' + chalk.bold('IDEA INDEX'));
  console.log(`  ${chalk.yellow(ideaIndex.ideas?.length || 0)} ideas registered · ${chalk.green(ideaIndex.projects?.length || 0)} projects created`);
  console.log(chalk.gray('  (duplicate detection prevents repeat proposals)\n'));

  // ─── Footer ───────────────────────────────────────────────
  console.log(chalk.gray('  Refreshes every 30s · Ctrl+C to exit'));
  console.log(chalk.gray('  Human commands: node hive.js [run|propose|agent|status]'));
}

// Initial render
render();

// Auto-refresh every 30 seconds
setInterval(render, 30000);

process.on('SIGINT', () => {
  console.log('\n\nDashboard closed.\n');
  process.exit(0);
});