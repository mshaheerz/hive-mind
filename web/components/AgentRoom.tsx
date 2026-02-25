'use client';

const AGENT_INFO = {
  apex:  { color: '#f0b429', emoji: '👁',  model: 'Hermes 3 405B',        desc: 'Reviews all proposals. Never biased. Final authority.' },
  nova:  { color: '#a78bfa', emoji: '💡', model: 'Mistral Small 3.1 24B', desc: 'Generates project ideas autonomously every 60 minutes.' },
  scout: { color: '#34d399', emoji: '🔍', model: 'Mistral Small 3.1 24B', desc: 'Researches every proposal before it reaches APEX.' },
  atlas: { color: '#38bdf8', emoji: '🏗', model: 'Llama 3.2 3B',          desc: 'Designs system architecture before any code is written.' },
  forge: { color: '#f97316', emoji: '⚒', model: 'Llama 3.2 3B',          desc: 'Implements clean, production-ready code with full docs.' },
  lens:  { color: '#ec4899', emoji: '🔎', model: 'Llama 3.2 3B',          desc: 'Reviews all code. No bad code ships.' },
  pulse: { color: '#ef4444', emoji: '🧪', model: 'Mistral Small 3.1 24B', desc: 'Tests adversarially — breaks things before users do.' },
  sage:  { color: '#e2e8f0', emoji: '📖', model: 'Hermes 3 405B',          desc: 'Writes documentation developers actually read.' },
  echo:  { color: '#60a5fa', emoji: '📡', model: 'Mistral Small 3.1 24B', desc: 'Crafts launch content. Twitter threads, Product Hunt, GitHub.' },
};

const SCHEDULE = {
  nova: 60, scout: 45, apex: 30, atlas: 90,
  forge: 120, lens: 60, pulse: 60, sage: 90, echo: 120,
};

function timeSince(iso) {
  if (!iso) return 'never';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function AgentRoom({ agentName, hive, agentStatus, onClose }) {
  const info   = AGENT_INFO[agentName];
  const status = agentStatus(agentName);
  const last   = hive?.state?.agentLastRun?.[agentName];
  const cycle  = SCHEDULE[agentName];
  const minsSince = last ? (Date.now() - new Date(last)) / 60000 : null;
  const progress = minsSince !== null ? Math.min(1, minsSince / cycle) : 0;

  // Find what this agent is working on
  const stageAgentMap = {
    approved: 'scout', research: 'atlas', architecture: 'forge',
    implementation: 'lens', review: 'pulse', tests: 'sage', docs: 'echo',
  };
  const activeProjects = (hive?.projects || []).filter(p =>
    stageAgentMap[p.status?.stage] === agentName
  );

  // Recent discussions involving this agent
  const discussions = (hive?.discussions || []).filter(d =>
    d.messages?.some(m => m.from === agentName.toUpperCase())
  ).slice(0, 3);

  // Deadlines
  const myDeadlines = (hive?.deadlines || []).filter(d =>
    d.agent === agentName && d.status === 'active'
  );

  const statusColors = {
    active:  '#34d399', due: '#f0b429', resting: '#60a5fa', idle: '#3d6180',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(2,4,8,0.85)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeSlideUp 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        background: `linear-gradient(135deg, #091525 0%, #050d16 100%)`,
        border: `1px solid ${info.color}40`,
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: 560,
        boxShadow: `0 0 60px ${info.color}15, 0 20px 60px rgba(0,0,0,0.8)`,
        position: 'relative',
        animation: 'fadeSlideUp 0.25s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: 'var(--text-dim)',
          cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
        }}>✕</button>

        {/* Header */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '12px', flexShrink: 0,
            background: `radial-gradient(circle, ${info.color}25, ${info.color}08)`,
            border: `1px solid ${info.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: `0 0 20px ${info.color}30`,
          }}>{info.emoji}</div>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800,
              color: info.color, letterSpacing: '0.1em', marginBottom: '0.2rem',
            }}>{agentName.toUpperCase()}</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{info.desc}</p>
            <span style={{
              fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.1em',
              padding: '0.2rem 0.5rem', border: '1px solid var(--border-dim)',
              borderRadius: '4px',
            }}>MODEL: {info.model}</span>
          </div>
        </div>

        {/* Status & cycle */}
        <div style={{
          background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
          padding: '1rem', marginBottom: '1rem', border: '1px solid var(--border-dim)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: statusColors[status],
                boxShadow: `0 0 6px ${statusColors[status]}`,
                animation: status === 'active' ? 'blink 1s infinite' : 'none',
              }} />
              <span style={{ fontSize: '0.7rem', color: statusColors[status], letterSpacing: '0.1em', fontWeight: 700 }}>
                {status.toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Last active: {timeSince(last)} · Cycle: {cycle}min
            </span>
          </div>

          {/* Progress bar to next wake */}
          <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginBottom: '0.3rem', letterSpacing: '0.1em' }}>
            CYCLE PROGRESS — {status === 'active' ? 'WORKING NOW' : status === 'due' ? 'DUE TO WAKE' : `RESTING`}
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${progress * 100}%`,
              background: `linear-gradient(to right, ${info.color}80, ${info.color})`,
              transition: 'width 1s ease',
              boxShadow: `0 0 6px ${info.color}80`,
            }} />
          </div>
        </div>

        {/* Active work */}
        {activeProjects.length > 0 && (
          <Section title="CURRENTLY WORKING ON" color={info.color}>
            {activeProjects.map(p => (
              <div key={p.name} style={{
                padding: '0.5rem 0.7rem', background: `${info.color}10`,
                border: `1px solid ${info.color}25`, borderRadius: '6px',
                fontSize: '0.65rem', color: 'var(--text-primary)',
              }}>
                <span style={{ color: info.color }}>▶</span> {p.name}
                <span style={{ color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
                  [{p.status?.stage}]
                </span>
              </div>
            ))}
          </Section>
        )}

        {/* Deadlines */}
        {myDeadlines.length > 0 && (
          <Section title="DEADLINES" color="#f0b429">
            {myDeadlines.map((d, i) => {
              const hoursLeft = ((new Date(d.dueAt) - Date.now()) / 3600000).toFixed(1);
              const overdue   = hoursLeft < 0;
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.6rem', color: overdue ? '#ef4444' : 'var(--text-secondary)',
                  padding: '0.3rem 0',
                  borderBottom: '1px solid var(--border-dim)',
                }}>
                  <span>{d.projectName} → {d.stage}</span>
                  <span style={{ color: overdue ? '#ef4444' : '#f0b429' }}>
                    {overdue ? `${Math.abs(hoursLeft)}h OVERDUE` : `${hoursLeft}h left`}
                  </span>
                </div>
              );
            })}
          </Section>
        )}

        {/* Recent discussions */}
        {discussions.length > 0 && (
          <Section title="RECENT DISCUSSIONS" color="var(--text-dim)">
            {discussions.map((d, i) => (
              <div key={i} style={{
                padding: '0.5rem', background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-dim)', borderRadius: '6px',
                fontSize: '0.6rem',
              }}>
                <div style={{ color: info.color, marginBottom: '0.3rem', letterSpacing: '0.08em' }}>
                  # {d.topic}
                </div>
                {d.messages?.filter(m => m.from === agentName.toUpperCase()).slice(-1).map((m, j) => (
                  <div key={j} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{m.message.slice(0, 120)}..."
                  </div>
                ))}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.2em', color: color || 'var(--text-dim)',
        marginBottom: '0.5rem', paddingBottom: '0.3rem',
        borderBottom: '1px solid var(--border-dim)',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>{children}</div>
    </div>
  );
}