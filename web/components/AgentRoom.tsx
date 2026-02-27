// AgentRoom: typed agent detail view panel component
'use client';

type AgentStatus = 'active' | 'due' | 'resting' | 'idle';

type AgentInfo = {
  color: string;
  emoji: string;
  model: string;
  desc: string;
};

type Project = {
  name: string;
  status?: { stage?: string };
};

type Discussion = {
  topic: string;
  messages?: Array<{ from: string; message: string }>;
};

type Deadline = {
  agent: string;
  status: string;
  dueAt: string | number | Date;
  projectName: string;
  stage: string;
};

type Hive = {
  state?: {
    agentLastRun?: Record<string, string | number | Date>;
    agentCadenceMinutes?: Record<string, number>;
  };
  projects?: Project[];
  discussions?: Discussion[];
  deadlines?: Deadline[];
};

interface AgentRoomProps {
  agentName: string;
  anchor: { x: number; y: number };
  hive?: Hive | null;
  agentStatus: (name: string) => AgentStatus;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  color?: string;
  children?: React.ReactNode;
}

const AGENT_INFO: Record<string, AgentInfo> = {
  ceo:   { color: '#fb923c', emoji: '🧭', model: 'Human strategic control', desc: 'Human CEO bridge. Can issue direct operational orders to APEX.' },
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

const SCHEDULE: Record<string, number> = {
  ceo: 15, nova: 60, scout: 45, apex: 15, atlas: 90,
  forge: 15, lens: 60, pulse: 60, sage: 90, echo: 120,
};

function timeSince(iso?: string | number | Date | null): string {
  if (!iso) return 'never';
  const t = typeof iso === 'number' ? iso : new Date(iso).getTime();
  if (!isFinite(t)) return 'never';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function AgentRoom({ agentName, anchor, hive, agentStatus, onClose }: AgentRoomProps) {
  const info   = AGENT_INFO[agentName] || { color: '#7d9ac3', emoji: '•', model: 'Unknown', desc: 'No profile available.' };
  const status = agentStatus(agentName);
  const last   = hive?.state?.agentLastRun?.[agentName];
  const dynamic = Number(hive?.state?.agentCadenceMinutes?.[agentName]);
  const cycle  = Number.isFinite(dynamic) && dynamic > 0 ? dynamic : SCHEDULE[agentName];
  const minsSince = last ? (Date.now() - (typeof last === 'number' ? last : new Date(last).getTime())) / 60000 : null;
  const progress = minsSince !== null ? Math.min(1, minsSince / cycle) : 0;

  // Find what this agent is working on
  const stageAgentMap: Record<string, string> = {
    approved: 'scout', research: 'atlas', architecture: 'forge',
    implementation: 'lens', review: 'pulse', tests: 'sage', docs: 'echo',
  };
  const activeProjects = (hive?.projects || []).filter(p =>
    stageAgentMap[p.status?.stage!] === agentName
  );

  // Recent discussions involving this agent
  const discussions = (hive?.discussions || []).filter(d =>
    d.messages?.some(m => m.from === agentName.toUpperCase())
  ).slice(0, 3);

  // Deadlines
  const myDeadlines = (hive?.deadlines || []).filter(d =>
    d.agent === agentName && d.status === 'active'
  );

  const statusColors: Record<AgentStatus, string> = {
    active:  '#4ade80', due: '#ffd93d', resting: '#60a5fa', idle: '#7d9ac3',
  };

  const panelWidth = 560;
  const margin = 12;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const clampedWidth = Math.min(panelWidth, vw - margin * 2);
  const placeRight = anchor.x + 20 + clampedWidth <= vw - margin;
  const desiredLeft = placeRight ? anchor.x + 20 : anchor.x - clampedWidth - 20;
  const left = Math.max(margin, Math.min(vw - clampedWidth - margin, desiredLeft));
  const top = Math.max(72, Math.min(vh - 120, anchor.y - 160));

  return (
    <div
      className="fixed z-50 animate-[fadeSlideUp_0.2s_ease]"
      style={{
        left,
        top,
        width: clampedWidth,
        maxHeight: vh - top - margin,
      }}
    >
      <div className="h-full overflow-y-auto bg-gradient-to-br from-[#142d45] to-[#0f1725] rounded-2xl p-8 border" style={{ borderColor: `${info.color}66`, boxShadow: `0 0 60px ${info.color}25, 0 20px 60px rgba(0,0,0,0.9)` }}>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-none border-none text-(--text-dim) cursor-pointer text-lg leading-none hover:text-(--text-primary) transition-colors">✕</button>

        {/* Header */}
        <div className="flex gap-4 items-flex-start mb-6">
          <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl border" style={{ background: `radial-gradient(circle, ${info.color}30, ${info.color}10)`, borderColor: `${info.color}60`, boxShadow: `0 0 20px ${info.color}40` }}>{info.emoji}</div>
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
              <div className="w-2 h-2 rounded-full" style={{ background: statusColors[status], boxShadow: `0 0 8px ${statusColors[status]}`, animation: status === 'active' ? 'blink 1s infinite' : 'none' }} />
              <span style={{ fontSize: '0.7rem', color: statusColors[status], letterSpacing: '0.1em', fontWeight: 700 }}>
                {status.toUpperCase()}
              </span>
            </div>
            <span className="text-[0.65rem] text-(--text-dim)">
              Last active: {timeSince(last)} · Cycle: {cycle}min
            </span>
          </div>

          {/* Progress bar to next wake */}
          <div className="text-[0.55rem] text-(--text-dim) mb-0.75 tracking-wide">
            CYCLE PROGRESS — {status === 'active' ? 'WORKING NOW' : status === 'due' ? 'DUE TO WAKE' : `RESTING`}
          </div>
          <div className="h-1 bg-white/10 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-1000" style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(to right, ${info.color}80, ${info.color})`,
              boxShadow: `0 0 8px ${info.color}`,
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
              const dueTime = typeof d.dueAt === 'number' ? d.dueAt : new Date(d.dueAt).getTime();
              const hoursLeft = ((dueTime - Date.now()) / 3600000).toFixed(1);
              const overdue   = parseFloat(hoursLeft) < 0;
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.6rem', color: overdue ? '#ef4444' : 'var(--text-secondary)',
                  padding: '0.3rem 0',
                  borderBottom: '1px solid var(--border-dim)',
                }}>
                  <span>{d.projectName} → {d.stage}</span>
                  <span style={{ color: overdue ? '#ef4444' : '#f0b429' }}>
                    {overdue ? `${Math.abs(parseFloat(hoursLeft))}h OVERDUE` : `${hoursLeft}h left`}
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

function Section({ title, color, children }: SectionProps) {
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
