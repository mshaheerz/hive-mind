// CommsBus.tsx — converted to TypeScript with prop types and safer date handling
'use client';
import React, { useState } from 'react';

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
  resolution?: string;
};

interface CommsBusProps {
  discussions: Discussion[];
}

const AGENT_COLORS: Record<string, string> = {
  APEX: '#f0b429', NOVA: '#a78bfa', SCOUT: '#34d399', FORGE: '#f97316',
  LENS: '#ec4899', PULSE: '#ef4444', ECHO: '#60a5fa', ATLAS: '#38bdf8',
  SAGE: '#e2e8f0',
};

function timeAgo(iso?: string | number | Date | null): string {
  if (!iso) return '';
  const t = typeof iso === 'number' ? iso : new Date(iso).getTime();
  if (!isFinite(t)) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export default function CommsBus({ discussions }: CommsBusProps) {
  const [active, setActive] = useState<number>(0);
  if (!discussions || discussions.length === 0) return null;

  const thread = discussions[active];

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-(--border-dim) bg-[rgba(15,23,37,0.85)]">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between text-[0.75rem] font-bold tracking-widest border-b border-(--border-dim) text-(--text-secondary)">
        <span>◈ AGENT COMMUNICATIONS — DISCUSSION THREADS</span>
        <span className="text-(--text-dim)">{discussions.length} THREADS</span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '300px 1fr' }}>
        {/* Thread list */}
        <div style={{ borderRight: '1px solid var(--border-dim)', maxHeight: 350, overflowY: 'auto' }}>
          {discussions.map((d, i) => (
            <button key={d.id || i} onClick={() => setActive(i)} className={`block w-full text-left transition-all px-4 py-2.5 border-b border-(--border-dim) ${active === i ? 'bg-(--echo-color)/15 border-l-4 border-l-echo font-bold shadow-[inset_4px_0_0_var(--echo-color)]' : 'border-l-4 border-l-transparent hover:bg-white/08 active:bg-white/12'}`}>
              <div className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.75rem] font-display font-semibold transition-colors" style={{ color: active === i ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                {d.topic}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[...new Set(d.messages?.map(m => m.from) || [])].slice(0, 4).map(agent => (
                    <div key={agent} className="flex items-center justify-center text-[0.4rem] w-4 h-4 rounded-full text-black font-display font-bold" style={{ background: AGENT_COLORS[agent] || '#b3d9ff' }}>
                      {agent[0]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.6rem] text-(--text-dim)">{d.messages?.length || 0} msg</span>
                  <span className={`text-[0.55rem] px-1.5 rounded border font-semibold ${d.status === 'open' ? 'bg-green-500/15 border-green-500/50 text-green-400' : 'bg-gray-500/15 border-gray-500/30 text-(--text-dim)'}`}>{d.status?.toUpperCase()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Message view */}
        <div className="h-[350px] overflow-y-auto px-5 py-4 bg-[rgba(0,0,0,0.2)]">
          {thread ? (
            <>
              <div className="mb-4 pb-3 text-[0.7rem] font-semibold tracking-wide border-b-2 border-(--echo-color)/40 text-(--text-primary)">
                🧵 {thread.topic}
                <div className="text-[0.65rem] text-(--text-dim) font-normal mt-1">
                  Started {timeAgo(thread.startedAt)} ago
                  {thread.resolution && (
                    <span className="block mt-1 text-nova">✓ RESOLVED: {thread.resolution.slice(0, 50)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-[0.8rem]">
                {(thread.messages || []).map((msg, i) => {
                  const bg = AGENT_COLORS[msg.from];
                  const borderLeft = bg ? `${bg}80` : 'var(--border-dim)';
                  return (
                    <div key={i} className="flex gap-2 animate-[fadeSlideUp_0.3s_ease]">
                      <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 text-[0.6rem] font-display font-bold rounded text-black" style={{ background: bg || '#b3d9ff' }}>{msg.from?.slice(0, 2)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.75">
                          <span className="text-[0.7rem] font-display font-bold" style={{ color: bg || '#b3d9ff' }}>{msg.from}</span>
                          <span className="text-[0.6rem] text-(--text-dim)">{timeAgo(msg.at)} ago</span>
                        </div>
                        <div className="text-[0.7rem] text-(--text-secondary) leading-[1.7] bg-black/40 px-3 py-2.5 rounded border border-(--border-dim)/60" style={{ borderLeft: `3px solid ${borderLeft}`, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-[0.65rem] text-(--text-dim) p-4">Select a thread to view messages</div>
          )}
        </div>
      </div>
    </div>
  );
}
