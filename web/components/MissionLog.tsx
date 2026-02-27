// MissionLog: typed component with Tailwind utility classes
 'use client';
import { useRef, useEffect } from 'react';

type LogEntry = {
  time: string;
  agent: string;
  message: string;
};

interface MissionLogProps {
  logs: string[];
}

const AGENT_COLORS: Record<string, string> = {
  APEX: '#f0b429', NOVA: '#a78bfa', SCOUT: '#34d399', FORGE: '#f97316',
  LENS: '#ec4899', PULSE: '#ef4444', ECHO: '#60a5fa', ATLAS: '#38bdf8',
  SAGE: '#e2e8f0', SYSTEM: '#3d6180',
};

function parseLogLine(line: string): LogEntry | null {
  // Format: [2026-01-01T00:00:00.000Z] [AGENT] message
  const match = line.match(/\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)/);
  if (!match) return null;
  const time = new Date(match[1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return { time, agent: match[2], message: match[3] };
}

export default function MissionLog({ logs }: MissionLogProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const parsed = logs.map(parseLogLine).filter(Boolean) as LogEntry[];

  return (
    <div className="flex h-[420px] flex-col overflow-hidden rounded-lg border border-(--border-dim) bg-[rgba(20,45,69,0.86)]">
      <div className="flex items-center gap-3 border-b border-(--border-dim) px-5 py-4 text-[0.92rem] font-bold tracking-[0.1em] text-(--text-secondary)">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-[blink_1.5s_infinite]" />
        MISSION LOG
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {parsed.length === 0 ? (
          <div className="p-4 text-center text-[0.9rem] text-(--text-dim)">
            Waiting for agent activity...
          </div>
        ) : (
          parsed.map((entry, i) => (
            <LogLine key={i} entry={entry} isNew={i === parsed.length - 1} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

interface LogLineProps {
  entry: LogEntry;
  isNew?: boolean;
}

function LogLine({ entry, isNew }: LogLineProps) {
  const color = AGENT_COLORS[entry.agent] || '#b3d9ff';
  return (
    <div className={`flex gap-3 rounded px-2 py-1.5 text-[0.88rem] leading-[1.55] ${isNew ? 'bg-[rgba(255,255,255,0.1)] animate-[fadeSlideUp_0.3s_ease]' : ''}`}>
      <span className="flex-shrink-0 tabular-nums text-[0.78rem] text-(--text-dim)">
        {entry.time}
      </span>
      <span className="min-w-[4.2rem] flex-shrink-0 text-[0.82rem] font-bold" style={{ color }}>
        [{entry.agent}]
      </span>
      <span className="break-words text-(--text-secondary)">
        {entry.message}
      </span>
    </div>
  );
}
