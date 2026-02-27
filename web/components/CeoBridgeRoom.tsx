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
    ],
    []
  );

  return (
    <section className="mt-6 rounded-2xl border border-(--border-dim) bg-[rgba(10,18,30,0.9)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-[0.78rem] font-bold tracking-[0.14em] text-(--text-secondary)">
          CEO BRIDGE — HUMAN TO APEX OPERATOR
        </div>
        <div className="text-[0.58rem] tracking-[0.12em] text-(--text-dim)">
          APEX HAS FULL CONTROL · CEO CAN ISSUE ORDERS
        </div>
      </div>

      <div className="h-[240px] overflow-y-auto rounded-xl border border-(--border-dim) bg-[rgba(0,0,0,0.28)] p-3">
        <div className="flex flex-col gap-2.5">
          {messages.map((m) => {
            const ceo = m.from === 'ceo';
            return (
              <div key={m.id} className={`flex ${ceo ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl border px-3 py-2 ${ceo ? 'rounded-tr-sm border-[rgba(251,146,60,0.6)] bg-[rgba(251,146,60,0.16)]' : 'rounded-tl-sm border-[rgba(240,180,40,0.55)] bg-[rgba(240,180,40,0.12)]'}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`text-[0.62rem] font-bold tracking-wide ${ceo ? 'text-[#fb923c]' : 'text-[#f0b429]'}`}>
                      {ceo ? 'CEO' : 'APEX'}
                    </span>
                    <span className="text-[0.55rem] text-(--text-dim)">{ago(m.at)} ago</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words text-[0.72rem] leading-[1.6] text-(--text-secondary)">
                    {m.message}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="text-[0.68rem] text-(--text-dim)">
              No messages yet. Ask APEX something like: `why forge not working`
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="rounded-full border border-(--border-dim) bg-white/5 px-3 py-1 text-[0.6rem] tracking-wide text-(--text-secondary) hover:bg-white/10"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="CEO command to APEX..."
          className="flex-1 rounded-xl border border-(--border-dim) bg-[rgba(0,0,0,0.28)] px-3 py-2 text-[0.72rem] text-(--text-primary) outline-none focus:border-(--apex-color)"
        />
        <button
          onClick={() => send()}
          disabled={busy}
          className="rounded-xl border border-[rgba(240,180,40,0.55)] bg-[rgba(240,180,40,0.16)] px-4 py-2 text-[0.7rem] font-semibold tracking-wide text-[#f0b429] disabled:opacity-50"
        >
          SEND
        </button>
      </div>
    </section>
  );
}
