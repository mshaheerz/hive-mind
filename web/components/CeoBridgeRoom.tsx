'use client';
import { useEffect, useMemo, useState } from 'react';

type BridgeMsg = {
  id: string;
  from: 'ceo' | 'apex' | string;
  message: string;
  at: string;
};

function ago(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export default function CeoBridgeRoom() {
  const [messages, setMessages] = useState<BridgeMsg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/ceo-bridge', { cache: 'no-store' });
      const data = await res.json();
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch {}
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const send = async (preset?: string) => {
    const payload = String(preset || text).trim();
    if (!payload || busy) return;
    setBusy(true);
    try {
      await fetch('/api/ceo-bridge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: payload }),
      });
      setText('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const quick = useMemo(
    () => [
      'strict wake forge',
      'why forge not working',
      'strict wake forge lens',
      'strict wake all agents',
    ],
    []
  );
  const forceWakeAgents = useMemo(
    () => ['all agents', 'apex', 'atlas', 'forge', 'lens', 'pulse', 'sage', 'echo', 'scout', 'nova'],
    []
  );

  return (
    <section className="mt-8 rounded-2xl border border-(--border-dim) bg-[rgba(10,18,30,0.94)] p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <div className="font-display text-[0.95rem] font-bold tracking-[0.1em] text-(--text-secondary)">
          CEO BRIDGE — HUMAN TO APEX OPERATOR
        </div>
        <div className="text-[0.75rem] tracking-[0.06em] text-(--text-dim)">
          APEX HAS FULL CONTROL · CEO CAN ISSUE ORDERS
        </div>
      </div>

      <div className="h-[320px] overflow-y-auto rounded-xl border border-(--border-dim) bg-[rgba(0,0,0,0.28)] p-4">
        <div className="flex flex-col gap-2.5">
          {messages.map((m) => {
            const ceo = m.from === 'ceo';
            return (
              <div key={m.id} className={`flex ${ceo ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl border px-4 py-3 ${ceo ? 'rounded-tr-sm border-[rgba(251,146,60,0.6)] bg-[rgba(251,146,60,0.16)]' : 'rounded-tl-sm border-[rgba(240,180,40,0.55)] bg-[rgba(240,180,40,0.12)]'}`}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`text-[0.78rem] font-bold tracking-wide ${ceo ? 'text-[#fb923c]' : 'text-[#f0b429]'}`}>
                      {ceo ? 'CEO' : 'APEX'}
                    </span>
                    <span className="text-[0.7rem] text-(--text-dim)">{ago(m.at)} ago</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words text-[0.95rem] leading-[1.6] text-(--text-secondary)">
                    {m.message}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="text-[0.9rem] text-(--text-dim)">
              No messages yet. Ask APEX something like: `why forge not working`
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {quick.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="rounded-full border border-(--border-dim) bg-white/5 px-3.5 py-1.5 text-[0.78rem] tracking-wide text-(--text-secondary) hover:bg-white/10"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-(--border-dim) bg-[rgba(0,0,0,0.2)] p-3">
        <div className="mb-2.5 text-[0.75rem] tracking-[0.08em] text-(--text-dim)">
          FORCE WAKE CONTROLS
        </div>
        <div className="flex flex-wrap gap-2">
          {forceWakeAgents.map((name) => {
            const label = name === 'all agents' ? 'WAKE ALL' : `WAKE ${name.toUpperCase()}`;
            return (
              <button
                key={name}
                onClick={() => send(`strict wake ${name}`)}
                className="rounded-full border border-[rgba(240,180,40,0.45)] bg-[rgba(240,180,40,0.12)] px-3.5 py-1.5 text-[0.74rem] tracking-wide text-[#f0b429] hover:bg-[rgba(240,180,40,0.2)]"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-2.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="CEO command to APEX..."
          className="flex-1 rounded-xl border border-(--border-dim) bg-[rgba(0,0,0,0.28)] px-4 py-2.5 text-[0.95rem] text-(--text-primary) outline-none focus:border-(--apex-color)"
        />
        <button
          onClick={() => send()}
          disabled={busy}
          className="rounded-xl border border-[rgba(240,180,40,0.55)] bg-[rgba(240,180,40,0.16)] px-5 py-2.5 text-[0.86rem] font-semibold tracking-wide text-[#f0b429] disabled:opacity-50"
        >
          SEND
        </button>
      </div>
    </section>
  );
}
