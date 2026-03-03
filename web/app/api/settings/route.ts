import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const HIVE_ROOT = path.join(process.cwd(), '..');
const STATE_FILE = path.join(HIVE_ROOT, '.hive', 'autonomous-state.json');

export async function GET() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return NextResponse.json({ config: { totalSkillBudget: 12000, perSkillLimit: 6000 } });
    }
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return NextResponse.json({ config: state.config || { totalSkillBudget: 12000, perSkillLimit: 6000 } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { totalSkillBudget, perSkillLimit } = body;

    if (!fs.existsSync(STATE_FILE)) {
        // Should not happen if app is running, but for safety:
        return NextResponse.json({ error: 'State file not found' }, { status: 404 });
    }

    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    state.config = {
      ...state.config,
      totalSkillBudget: Number(totalSkillBudget),
      perSkillLimit: Number(perSkillLimit),
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    return NextResponse.json({ success: true, config: state.config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
