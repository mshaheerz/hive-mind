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

function safeRead(file, fallback) {
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
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
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

export async function GET() {
  const state     = safeRead(path.join(HIVE_DIR, 'autonomous-state.json'), {
    running: false, cycleCount: 0, agentLastRun: {}, stats: {}
  });
  const queue     = safeRead(path.join(HIVE_DIR, 'queue.json'), []);
  const deadlines = safeRead(path.join(HIVE_DIR, 'deadlines.json'), []);
  const ideaIndex = safeRead(path.join(HIVE_DIR, 'idea-index.json'), { ideas: [], projects: [] });
  const projects  = getProjects();
  const discussions = getDiscussions();
  const logs      = getRecentLogs();

  return NextResponse.json({
    state,
    queue,
    deadlines,
    ideaIndex,
    projects,
    discussions,
    logs,
    fetchedAt: new Date().toISOString(),
  });
}