'use client';
import { useRef, useEffect } from 'react';

const AGENT_COLORS = {
  APEX: '#f0b429', NOVA: '#a78bfa', SCOUT: '#34d399', FORGE: '#f97316',
  LENS: '#ec4899', PULSE: '#ef4444', ECHO: '#60a5fa', ATLAS: '#38bdf8',
  SAGE: '#e2e8f0', SYSTEM: '#3d6180',
};

function parseLogLine(line) {
  // Format: [2026-01-01T00:00:00.000Z] [AGENT] message
  const match = line.match(/\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)/);
  if (!match) return null;
  return {
    time: new Date(match[1]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    agent: match[2],
    message: match[3],
  };
}

export default function MissionLog({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  const parsed = logs.map(parseLogLine).filter(Boolean);

  return (
    <div style={{
      background: 'rgba(5,13,22,0.7)',
      border: '1px solid var(--border-dim)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: 320,
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-dim)',
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        color: 'var(--text-dim)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexShrink: 0,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'blink 1.5s infinite' }} />
        MISSION LOG
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
      }}>
        {parsed.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.65rem', textAlign: 'center' }}>
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

function LogLine({ entry, isNew }) {
  const color = AGENT_COLORS[entry.agent] || '#7aa5c8';
  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '0.25rem 0.4rem',
      borderRadius: '4px',
      background: isNew ? 'rgba(255,255,255,0.03)' : 'transparent',
      animation: isNew ? 'fadeSlideUp 0.3s ease' : 'none',
      fontSize: '0.58rem',
      lineHeight: 1.5,
    }}>
      <span style={{ color: 'var(--text-dim)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {entry.time}
      </span>
      <span style={{
        color, fontWeight: 700, flexShrink: 0,
        minWidth: '3.5rem',
      }}>
        [{entry.agent}]
      </span>
      <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
        {entry.message}
      </span>
    </div>
  );
}