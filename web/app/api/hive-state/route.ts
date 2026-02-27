// web/app/api/hive-state/route.js
// Reads all .hive/ and projects/ state files and returns them as JSON
// The frontend polls this every 5 seconds for live updates

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the hive-mind root (parent of web/)
const HIVE_ROOT    = path.join(process.cwd(), '..');
const PROJECTS_DIR = path.join(HIVE_ROOT, 'projects');
const HIVE_DIR     = path.join(HIVE_ROOT, '.hive');
const DISCUSS_DIR  = path.join(HIVE_DIR, 'discussions');
const LOGS_DIR     = path.join(HIVE_ROOT, 'logs');
const RUNNER_LOCK  = path.join(HIVE_DIR, 'runner.lock.json');
const SUPPORTED_PROVIDERS = ['openrouter', 'groq', 'local'];
const AGENTS = ['apex', 'nova', 'scout', 'atlas', 'forge', 'lens', 'pulse', 'sage', 'echo'] as const;
type AgentName = (typeof AGENTS)[number];

const PROVIDER_DEFAULT_MODELS: Record<string, Record<AgentName, string>> = {
  openrouter: {
    apex: 'arcee-ai/trinity-large-preview:free',
    nova: 'stepfun/step-3.5-flash:free',
    scout: 'z-ai/glm-4.5-air:free',
    atlas: 'nvidia/nemotron-3-nano-30b-a3b:free',
    forge: 'upstage/solar-pro-3:free',
    lens: 'openai/gpt-oss-120b:free',
    pulse: 'arcee-ai/trinity-mini:free',
    sage: 'nvidia/nemotron-nano-12b-v2-vl:free',
    echo: 'z-ai/glm-4.5-air:free',
  },
  groq: {
    apex: 'groq/compound',
    nova: 'groq/compound-mini',
    scout: 'llama-3.3-70b-versatile',
    atlas: 'meta-llama/llama-4-scout-17b-16e-instruct',
    forge: 'openai/gpt-oss-120b',
    lens: 'openai/gpt-oss-120b',
    pulse: 'openai/gpt-oss-20b',
    sage: 'moonshotai/kimi-k2-instruct',
    echo: 'llama-3.1-8b-instant',
  },
  local: {
    apex: 'qwen2.5-coder:3b-instruct',
    nova: 'qwen2.5-coder:3b-instruct',
    scout: 'qwen2.5-coder:3b-instruct',
    atlas: 'qwen2.5-coder:3b-instruct',
    forge: 'qwen2.5-coder:3b-instruct',
    lens: 'qwen2.5-coder:3b-instruct',
    pulse: 'qwen2.5-coder:3b-instruct',
    sage: 'qwen2.5-coder:3b-instruct',
    echo: 'qwen2.5-coder:3b-instruct',
  },
};

function safeRead(file: string, fallback: any): any {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return fallback; }
}

function getProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR)
    .filter(f => {
      try {
        return fs.statSync(path.join(PROJECTS_DIR, f)).isDirectory() && !f.startsWith('_');
      } catch { return false; }
    })
    .map(name => {
      const status  = safeRead(path.join(PROJECTS_DIR, name, 'status.json'), { stage: 'new' });
      const readme  = (() => {
        try {
          const p = path.join(PROJECTS_DIR, name, 'README.md');
          if (!fs.existsSync(p)) return '';
          return fs.readFileSync(p, 'utf8').split('\n').slice(0, 5).join('\n');
        } catch { return ''; }
      })();
      return { name, status, readme };
    });
}

function getDiscussions() {
  if (!fs.existsSync(DISCUSS_DIR)) return [];
  return fs.readdirSync(DISCUSS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => safeRead(path.join(DISCUSS_DIR, f), null))
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 10);
}

function getRecentLogs() {
  if (!fs.existsSync(LOGS_DIR)) return [];
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOGS_DIR, `${today}-autonomous.log`);
  if (!fs.existsSync(logFile)) return [];
  try {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    return lines.slice(-50); // last 50 log lines
  } catch { return []; }
}

function normalizeProvider(value: string): string {
  const provider = String(value || '').trim().toLowerCase();
  return SUPPORTED_PROVIDERS.includes(provider) ? provider : 'openrouter';
}

function inferProviderFromLogs(logs: string[]): string | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const line = logs[i];
    const match = line.match(/LLM provider:\s*([a-zA-Z0-9_-]+)/i);
    if (match?.[1]) return normalizeProvider(match[1]);
  }
  return null;
}

function isPidAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function resolveRunningFlag(stateRunning: boolean): boolean {
  if (!fs.existsSync(RUNNER_LOCK)) return false;
  try {
    const lock = JSON.parse(fs.readFileSync(RUNNER_LOCK, 'utf8'));
    const alive = isPidAlive(Number(lock?.pid));
    if (!alive) {
      try { fs.unlinkSync(RUNNER_LOCK); } catch {}
    }
    return alive;
  } catch {
    return Boolean(stateRunning);
  }
}

function resolveProvider(state: any, logs: string[], running: boolean): string {
  let lockProvider = '';
  if (running && fs.existsSync(RUNNER_LOCK)) {
    try {
      const lock = JSON.parse(fs.readFileSync(RUNNER_LOCK, 'utf8'));
      lockProvider = normalizeProvider(lock?.provider || '');
    } catch {}
  }
  return normalizeProvider(
    lockProvider ||
    state?.llmProvider ||
    inferProviderFromLogs(logs) ||
    process.env.LLM_PROVIDER ||
    'openrouter'
  );
}

function buildAgentModels(provider: string): Record<string, string> {
  const normalized = normalizeProvider(provider);
  const base = { ...PROVIDER_DEFAULT_MODELS[normalized] } as Record<string, string>;
  for (const agent of AGENTS) {
    const upper = agent.toUpperCase();
    const providerKey = `${normalized.toUpperCase()}_MODEL_${upper}`;
    const globalKey = `MODEL_${upper}`;
    base[agent] = process.env[providerKey] || process.env[globalKey] || base[agent];
  }
  return base;
}

function deriveStats(queue: any[], projects: any[], stateStats: any = {}) {
  const approvedNow = queue.filter((p) => p?.status === 'approved').length;
  const rejectedNow = queue.filter((p) => p?.status === 'rejected').length;
  const completedNow = projects.filter((p) => p?.status?.stage === 'complete').length;
  const active = projects.filter((p) => {
    const s = p?.status?.stage;
    return s && s !== 'new' && s !== 'failed' && s !== 'complete';
  }).length;
  // Keep dashboard counts stable even if a project is later reopened.
  const approved = Math.max(Number(stateStats?.approved) || 0, approvedNow);
  const rejected = Math.max(Number(stateStats?.rejected) || 0, rejectedNow);
  const completed = Math.max(Number(stateStats?.completed) || 0, completedNow);
  const duplicatesBlocked = Math.max(Number(stateStats?.duplicatesBlocked) || 0, 0);
  return { approved, rejected, completed, active, completedNow, duplicatesBlocked };
}

export async function GET() {
  const state     = safeRead(path.join(HIVE_DIR, 'autonomous-state.json'), {
    running: false, cycleCount: 0, agentLastRun: {}, stats: {}
  });
  const running = resolveRunningFlag(Boolean(state.running));
  const stateWithRuntime = { ...state, running };
  const queue     = safeRead(path.join(HIVE_DIR, 'queue.json'), []);
  const deadlines = safeRead(path.join(HIVE_DIR, 'deadlines.json'), []);
  const ideaIndex = safeRead(path.join(HIVE_DIR, 'idea-index.json'), { ideas: [], projects: [] });
  const projects  = getProjects();
  const discussions = getDiscussions();
  const logs      = getRecentLogs();
  const stats = deriveStats(queue, projects, state.stats || {});
  const provider = resolveProvider(state, logs, running);
  const activeAgentModels = state.activeAgentModels && Object.keys(state.activeAgentModels).length
    ? state.activeAgentModels
    : buildAgentModels(provider);
  const stateWithModels = { ...stateWithRuntime, llmProvider: provider, activeAgentModels };

  return NextResponse.json({
    running,
    state: stateWithModels,
    stats,
    provider,
    activeAgentModels,
    queue,
    deadlines,
    ideaIndex,
    projects,
    discussions,
    logs,
    fetchedAt: new Date().toISOString(),
  });
}
