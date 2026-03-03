import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const HIVE_ROOT = path.join(process.cwd(), '..');
const STATE_FILE = path.join(HIVE_ROOT, '.hive', 'autonomous-state.json');
const ENV_FILE = path.join(HIVE_ROOT, '.env');

const DEFAULT_CONFIG = {
  totalSkillBudget: 12000,
  perSkillLimit: 6000,
  contextLimit: 20000,
};

function readEnvValue(key: string): string {
  try {
    if (!fs.existsSync(ENV_FILE)) return '';
    const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [k, ...rest] = trimmed.split('=');
      if (k.trim() === key) return rest.join('=').trim();
    }
  } catch {}
  return '';
}

function writeEnvValue(key: string, value: string) {
  let lines: string[] = [];
  if (fs.existsSync(ENV_FILE)) {
    lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
  }
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('#')) continue;
    const [k] = trimmed.split('=');
    if (k?.trim() === key) {
      lines[i] = `${key}=${value}`;
      found = true;
      break;
    }
  }
  if (!found) lines.push(`${key}=${value}`);
  fs.writeFileSync(ENV_FILE, lines.join('\n'));
}

export async function GET() {
  try {
    let config = { ...DEFAULT_CONFIG };
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      config = { ...config, ...(state.config || {}) };
    }
    const provider = readEnvValue('LLM_PROVIDER') || 'openrouter';
    const localModel = readEnvValue('LOCAL_MODEL') || readEnvValue('LOCAL_MODEL_FORGE') || '';
    return NextResponse.json({ config, provider, localModel });
  } catch {
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { totalSkillBudget, perSkillLimit, contextLimit, provider, localModel } = body;

    if (!fs.existsSync(STATE_FILE)) {
      return NextResponse.json({ error: 'State file not found' }, { status: 404 });
    }

    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

    // Update config in state
    if (totalSkillBudget !== undefined || perSkillLimit !== undefined || contextLimit !== undefined) {
      state.config = {
        ...state.config,
        ...(totalSkillBudget !== undefined ? { totalSkillBudget: Number(totalSkillBudget) } : {}),
        ...(perSkillLimit !== undefined ? { perSkillLimit: Number(perSkillLimit) } : {}),
        ...(contextLimit !== undefined ? { contextLimit: Number(contextLimit) } : {}),
      };
    }

    // Update provider in state + .env
    if (provider) {
      state.llmProvider = provider;
      writeEnvValue('LLM_PROVIDER', provider);
    }

    // Update local model in .env
    if (localModel !== undefined) {
      writeEnvValue('LOCAL_MODEL', localModel);
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    return NextResponse.json({ success: true, config: state.config, provider: state.llmProvider });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
