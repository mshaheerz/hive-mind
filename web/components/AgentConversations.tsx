'use client';
import { useMemo, useState } from 'react';

type Message = {
  from: string;
  at?: string | number | Date;
  message: string;
};

type Discussion = {
  id?: string | number;
  topic: string;
  messages?: Message[];
  status?: string;
  startedAt?: string | number | Date;
};

interface AgentConversationsProps {
  discussions: Discussion[];
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
};

function ago(iso?: string | number | Date): string {
  if (!iso) return '';
  const ts = typeof iso === 'number' ? iso : new Date(iso).getTime();
  if (!Number.isFinite(ts)) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string): string {
  const clean = String(name || '').trim().toUpperCase();
  if (!clean) return '?';
  return clean.length > 2 ? clean.slice(0, 2) : clean;
}

export default function AgentConversations({ discussions }: AgentConversationsProps) {
  const [active, setActive] = useState(0);
  const safe = discussions || [];
  const thread = safe[active];

  const participants = useMemo(() => {
    if (!thread?.messages?.length) return [];
    return [...new Set(thread.messages.map((m) => m.from).filter(Boolean))];
  }, [thread]);

  const sideMap = useMemo(() => {
    const map: Record<string, 'left' | 'right'> = {};
    if (participants[0]) map[participants[0]] = 'left';
    if (participants[1]) map[participants[1]] = 'right';
    return map;
  }, [participants]);

  if (!safe.length) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-(--border-dim) bg-[rgba(8,16,28,0.88)]">
      <div className="flex items-center justify-between border-b border-(--border-dim) px-5 py-4">
        <h3 className="font-display text-[0.78rem] font-bold tracking-[0.16em] text-(--text-secondary)">
          LIVE AGENT CONVERSATIONS
        </h3>
        <span className="text-[0.62rem] tracking-[0.12em] text-(--text-dim)">{safe.length} THREADS</span>
      </div>

      <div className="grid md:grid-cols-[320px_1fr]">
        <aside className="max-h-[420px] overflow-y-auto border-b border-(--border-dim) md:border-b-0 md:border-r">
          {safe.map((d, idx) => {
            const picked = idx === active;
            const msgs = d.messages || [];
            const peers = [...new Set(msgs.map((m) => m.from))].slice(0, 3);
            return (
              <button
                key={d.id || idx}
                onClick={() => setActive(idx)}
                className={`block w-full border-b border-(--border-dim) px-4 py-3 text-left transition ${picked ? 'bg-(--echo-color)/12' : 'hover:bg-white/5'}`}
              >
                <div className="truncate font-display text-[0.74rem] font-semibold text-(--text-primary)">{d.topic}</div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {peers.map((name) => (
                      <span
                        key={name}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[0.42rem] font-bold text-black"
                        style={{ background: AGENT_COLORS[name] || '#b3d9ff' }}
                      >
                        {initials(name).slice(0, 1)}
                      </span>
                    ))}
                  </div>
                  <span className="text-[0.58rem] text-(--text-dim)">{msgs.length} msgs</span>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="max-h-[420px] overflow-y-auto px-4 py-4 md:px-6">
          {thread ? (
            <>
              <div className="mb-4 border-b border-(--border-dim) pb-3">
                <div className="font-display text-sm font-semibold tracking-wide text-(--text-primary)">{thread.topic}</div>
                <div className="mt-1 text-[0.62rem] tracking-wide text-(--text-dim)">
                  started {ago(thread.startedAt)} {thread.status ? `· ${thread.status}` : ''}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {participants.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border px-2 py-0.5 text-[0.58rem] font-semibold tracking-wide"
                      style={{ borderColor: `${AGENT_COLORS[p] || '#7d9ac3'}66`, color: AGENT_COLORS[p] || '#7d9ac3' }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {(thread.messages || []).map((msg, i) => {
                  const side = sideMap[msg.from] || 'left';
                  const mine = side === 'right';
                  const color = AGENT_COLORS[msg.from] || '#7d9ac3';
                  return (
                    <div key={`${msg.from}-${i}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] rounded-2xl border px-3 py-2 ${mine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} style={{ borderColor: `${color}66`, background: mine ? `${color}1f` : 'rgba(255,255,255,0.04)' }}>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[0.62rem] font-bold tracking-wide" style={{ color }}>{msg.from}</span>
                          <span className="text-[0.55rem] text-(--text-dim)">{ago(msg.at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-[0.72rem] leading-[1.65] text-(--text-secondary)">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-[0.7rem] text-(--text-dim)">Select a thread to view conversation.</div>
          )}
        </div>
      </div>
    </section>
  );
}
