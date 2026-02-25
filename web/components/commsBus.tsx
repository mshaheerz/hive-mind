'use client';
import { useState } from 'react';

const AGENT_COLORS = {
  APEX: '#f0b429', NOVA: '#a78bfa', SCOUT: '#34d399', FORGE: '#f97316',
  LENS: '#ec4899', PULSE: '#ef4444', ECHO: '#60a5fa', ATLAS: '#38bdf8',
  SAGE: '#e2e8f0',
};

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

export default function CommsBus({ discussions }) {
  const [active, setActive] = useState(0);
  if (!discussions.length) return null;

  const thread = discussions[active];

  return (
    <div style={{
      marginTop: '1.5rem',
      background: 'rgba(5,13,22,0.7)',
      border: '1px solid var(--border-dim)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-dim)',
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        color: 'var(--text-dim)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>◈ AGENT COMMUNICATIONS — DISCUSSION THREADS</span>
        <span style={{ color: 'var(--text-dim)' }}>{discussions.length} THREADS</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr' }}>
        {/* Thread list */}
        <div style={{
          borderRight: '1px solid var(--border-dim)',
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          {discussions.map((d, i) => (
            <button key={d.id || i} onClick={() => setActive(i)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '0.65rem 1rem',
              background: active === i ? 'rgba(255,255,255,0.04)' : 'none',
              border: 'none',
              borderBottom: '1px solid var(--border-dim)',
              cursor: 'pointer',
              borderLeft: active === i ? '2px solid #60a5fa' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              <div style={{
                fontSize: '0.6rem',
                color: active === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                marginBottom: '0.2rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {d.topic}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {[...new Set(d.messages?.map(m => m.from) || [])].slice(0, 4).map(agent => (
                    <div key={agent} style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: AGENT_COLORS[agent] || '#3d6180',
                      fontSize: '0.4rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#000',
                    }}>
                      {agent[0]}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.48rem', color: 'var(--text-dim)' }}>
                    {d.messages?.length || 0} msg
                  </span>
                  <span style={{
                    fontSize: '0.45rem',
                    padding: '0.1rem 0.3rem',
                    background: d.status === 'open' ? 'rgba(52,211,153,0.1)' : 'rgba(100,100,100,0.1)',
                    border: `1px solid ${d.status === 'open' ? 'rgba(52,211,153,0.3)' : 'rgba(100,100,100,0.2)'}`,
                    borderRadius: '3px',
                    color: d.status === 'open' ? '#34d399' : 'var(--text-dim)',
                  }}>
                    {d.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Message view */}
        <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0.75rem 1rem' }}>
          {thread ? (
            <>
              <div style={{
                fontSize: '0.55rem',
                color: 'var(--text-dim)',
                letterSpacing: '0.15em',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-dim)',
              }}>
                THREAD: {thread.topic} · Started {timeAgo(thread.startedAt)} ago
                {thread.resolution && (
                  <span style={{ marginLeft: '0.5rem', color: '#a78bfa' }}>
                    · RESOLVED: {thread.resolution.slice(0, 40)}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(thread.messages || []).map((msg, i) => {
                  const color = AGENT_COLORS[msg.from] || '#7aa5c8';
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: '0.7rem',
                      animation: 'fadeSlideUp 0.3s ease',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '6px', flexShrink: 0,
                        background: `${color}20`,
                        border: `1px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.55rem', fontWeight: 700, color,
                        fontFamily: 'var(--font-display)',
                      }}>
                        {msg.from?.slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.6rem', color, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                            {msg.from}
                          </span>
                          <span style={{ fontSize: '0.48rem', color: 'var(--text-dim)' }}>
                            {timeAgo(msg.at)} ago
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.6rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.5rem 0.7rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-dim)',
                          borderLeft: `2px solid ${color}40`,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', padding: '1rem' }}>
              Select a thread to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}