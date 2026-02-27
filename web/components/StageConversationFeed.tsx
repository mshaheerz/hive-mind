'use client';
import { useMemo, useState } from 'react';

type DiscussionMessage = {
  from: string;
  to?: string;
  message: string;
  at?: string | number | Date;
};

type Discussion = {
  topic?: string;
  messages?: DiscussionMessage[];
  startedAt?: string | number | Date;
};

type FeedEntry = {
  id: string;
  at: number;
  actor: string;
  text: string;
  kind: 'chat' | 'move' | 'system';
  replyTo?: string;
  topic?: string;
};

interface StageConversationFeedProps {
  discussions?: Discussion[];
  logs?: string[];
}

const AGENT_COLORS: Record<string, string> = {
  APEX: '#f0b429',
  NOVA: '#a78bfa',
  SCOUT: '#34d399',
  FORGE: '#f97316',
  LENS: '#ec4899',
  PULSE: '#ef4444',
  ECHO: '#60a5fa',
  ATLAS: '#38bdf8',
  SAGE: '#e2e8f0',
  CEO: '#fb923c',
  SYSTEM: '#9aa8c8',
};

const AGENT_EMOJI: Record<string, string> = {
  APEX: '👁',
  NOVA: '💡',
  SCOUT: '🔍',
  FORGE: '⚒',
  LENS: '🔎',
  PULSE: '🧪',
  ECHO: '📡',
  ATLAS: '🏗',
  SAGE: '📖',
  CEO: '🧭',
  SYSTEM: '⚙',
};

function toTs(value?: string | number | Date): number {
  if (!value) return 0;
  const ts = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function ago(ts: number): string {
  if (!ts) return 'now';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function parseLogLine(line: string, i: number): FeedEntry | null {
  const m = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)$/);
  if (!m) return null;
  const at = toTs(m[1]);
  const actor = String(m[2] || 'SYSTEM').toUpperCase();
  const text = String(m[3] || '').trim();
  if (!text) return null;
  const kind: FeedEntry['kind'] =
    /working on|moved to|accepted|rejected|escalation|waking/i.test(text) ? 'move' :
    actor === 'SYSTEM' ? 'system' : 'chat';
  return {
    id: `log-${i}-${at}`,
    at,
    actor,
    text,
    kind,
  };
}

function plainText(input: string): string {
  return String(input || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function brief(input: string, max = 220): string {
  const p = plainText(input);
  if (p.length <= max) return p;
  return `${p.slice(0, max - 1)}…`;
}

export default function StageConversationFeed({ discussions = [], logs = [] }: StageConversationFeedProps) {
  const [mode, setMode] = useState<'all' | 'chat' | 'move' | 'system'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const entries = useMemo(() => {
    const out: FeedEntry[] = [];

    for (let dIdx = 0; dIdx < discussions.length; dIdx += 1) {
      const d = discussions[dIdx];
      const msgs = Array.isArray(d.messages) ? d.messages : [];
      for (let mIdx = 0; mIdx < msgs.length; mIdx += 1) {
        const msg = msgs[mIdx];
        const actor = String(msg.from || 'SYSTEM').toUpperCase();
        out.push({
          id: `disc-${dIdx}-${mIdx}-${toTs(msg.at) || toTs(d.startedAt)}`,
          at: toTs(msg.at) || toTs(d.startedAt),
          actor,
          text: String(msg.message || '').trim(),
          kind: actor === 'SYSTEM' ? 'system' : 'chat',
          replyTo: msg.to ? String(msg.to).toUpperCase() : undefined,
          topic: d.topic,
        });
      }
    }

    for (let i = 0; i < logs.length; i += 1) {
      const parsed = parseLogLine(logs[i], i);
      if (parsed) out.push(parsed);
    }

    return out
      .filter((e) => e.text)
      .sort((a, b) => b.at - a.at)
      .slice(0, 120);
  }, [discussions, logs]);

  const visible = useMemo(
    () => entries.filter((e) => mode === 'all' || e.kind === mode),
    [entries, mode],
  );

  const counters = useMemo(() => ({
    all: entries.length,
    chat: entries.filter((e) => e.kind === 'chat').length,
    move: entries.filter((e) => e.kind === 'move').length,
    system: entries.filter((e) => e.kind === 'system').length,
  }), [entries]);

  return (
    <section className="mt-6 rounded-2xl border border-(--border-dim) bg-[#0a1018] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[0.82rem] font-bold tracking-[0.14em] text-(--text-secondary)">
          LIVE CONVERSATION FEED
        </h3>
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[0.58rem] font-semibold tracking-[0.1em] text-emerald-300">
          LIVE
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-[0.58rem]">
        {(['all', 'chat', 'move', 'system'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={`rounded-md border px-2 py-1 transition ${
              mode === k
                ? 'border-white/20 bg-white/10 text-(--text-secondary)'
                : 'border-white/10 text-(--text-dim) hover:bg-white/5'
            }`}
          >
            {k.toUpperCase()} {counters[k]}
          </button>
        ))}
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-cyan-500/25 bg-[linear-gradient(180deg,#041015_0%,#03090f_100%)] p-2 md:p-3">
        {visible.length === 0 ? (
          <div className="p-4 text-[0.72rem] text-(--text-dim)">No conversation events yet.</div>
        ) : (
          <div className="space-y-1.5">
            {visible.map((entry) => {
              const color = AGENT_COLORS[entry.actor] || '#9aa8c8';
              const emoji = AGENT_EMOJI[entry.actor] || '•';
              const isChat = entry.kind === 'chat';
              const label = isChat ? '💬' : entry.kind === 'move' ? '⚡' : '•';
              const trimmed = brief(entry.text);
              const long = plainText(entry.text).length > trimmed.length;
              const isOpen = Boolean(expanded[entry.id]);
              return (
                <div key={entry.id} className="rounded-lg border border-white/8 bg-black/35 p-2.5">
                  <div className="flex items-center gap-2 text-[0.58rem]">
                    <span className="text-(--text-dim)">{ago(entry.at)}</span>
                    <span style={{ color }} className="font-semibold">{entry.actor}</span>
                    <span className="text-[0.68rem]">{emoji}</span>
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${entry.kind === 'move' ? 'bg-amber-500/15 text-amber-300' : entry.kind === 'chat' ? 'bg-sky-500/15 text-sky-300' : 'bg-white/10 text-(--text-dim)'}`}>
                      {label}
                    </span>
                    {entry.topic ? <span className="ml-auto truncate text-(--text-dim)">{entry.topic}</span> : null}
                  </div>
                  <p className="mt-1 break-words text-[0.73rem] leading-[1.65] text-(--text-primary)">
                    {isChat && entry.replyTo
                      ? `${entry.actor} → ${entry.replyTo}: ${isOpen ? plainText(entry.text) : trimmed}`
                      : isOpen ? plainText(entry.text) : trimmed}
                  </p>
                  {long ? (
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [entry.id]: !isOpen }))}
                      className="mt-1 text-[0.58rem] text-cyan-300 hover:text-cyan-200"
                    >
                      {isOpen ? 'show less' : 'show more'}
                    </button>
                  ) : null}
                  {entry.replyTo ? (
                    <div className="mt-1 text-[0.58rem] text-amber-300">&crarr; {entry.replyTo} → {entry.actor}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
