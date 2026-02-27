import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const HIVE_ROOT = path.join(process.cwd(), '..');
const BRIDGE_FILE = path.join(HIVE_ROOT, '.hive', 'ceo-bridge.json');

function loadBridge() {
  if (!fs.existsSync(BRIDGE_FILE)) return { messages: [] };
  try {
    const data = JSON.parse(fs.readFileSync(BRIDGE_FILE, 'utf8'));
    if (!Array.isArray(data.messages)) return { messages: [] };
    return data;
  } catch {
    return { messages: [] };
  }
}

function saveBridge(bridge: { messages: any[] }) {
  fs.mkdirSync(path.dirname(BRIDGE_FILE), { recursive: true });
  fs.writeFileSync(
    BRIDGE_FILE,
    JSON.stringify({ messages: bridge.messages, updatedAt: new Date().toISOString() }, null, 2)
  );
}

export async function GET() {
  const bridge = loadBridge();
  return NextResponse.json({
    messages: bridge.messages
      .slice(-120)
      .sort((a: any, b: any) => new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime()),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.message || '').trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: 'message is required' }, { status: 400 });
  }

  const bridge = loadBridge();
  bridge.messages.push({
    id: `ceo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    from: 'ceo',
    message: text,
    at: new Date().toISOString(),
  });
  saveBridge(bridge);

  return NextResponse.json({ ok: true });
}
