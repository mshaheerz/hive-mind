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
    <div className="flex flex-col overflow-hidden rounded-lg h-[400px] bg-[rgba(20,45,69,0.8)] border border-(--border-dim)">
      <div className="px-4 py-4 border-b border-(--border-dim) flex items-center gap-3 text-[0.75rem] font-bold tracking-widest text-(--text-secondary)">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-[blink_1.5s_infinite]" />
        MISSION LOG
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-[0.25rem]">
        {parsed.length === 0 ? (
          <div className="p-4 text-[0.75rem] text-center text-(--text-dim)">
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
    <div className={`flex gap-3 px-1.5 py-1 rounded text-[0.7rem] leading-[1.6] ${isNew ? 'bg-[rgba(255,255,255,0.1)] animate-[fadeSlideUp_0.3s_ease]' : ''}`}>
      <span className="flex-shrink-0 tabular-nums text-(--text-dim) text-[0.65rem]">
        {entry.time}
      </span>
      <span className="flex-shrink-0 font-bold min-w-[3.5rem] text-[0.7rem]" style={{ color }}>
        [{entry.agent}]
      </span>
      <span className="break-words text-(--text-secondary)">
        {entry.message}
      </span>
    </div>
  );
}