'use client';

const STAGES = ['approved','research','architecture','implementation','review','tests','docs','launch','complete'];

const STAGE_COLORS = {
  approved: '#f0b429', research: '#34d399', architecture: '#38bdf8',
  implementation: '#f97316', review: '#ec4899', tests: '#ef4444',
  docs: '#e2e8f0', launch: '#60a5fa', complete: '#a78bfa',
};

const STAGE_AGENT = {
  approved: 'SCOUT', research: 'ATLAS', architecture: 'FORGE',
  implementation: 'LENS', review: 'PULSE', tests: 'SAGE',
  docs: 'ECHO', launch: '—', complete: '✓',
};

export default function ProjectTracker({ projects }) {
  const active   = projects.filter(p => p.status?.stage && p.status.stage !== 'complete' && p.status.stage !== 'new');
  const complete = projects.filter(p => p.status?.stage === 'complete');

  return (
    <div style={{
      background: 'rgba(5,13,22,0.7)',
      border: '1px solid var(--border-dim)',
      borderRadius: '12px',
      overflow: 'hidden',
      height: 320,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-dim)',
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        color: 'var(--text-dim)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span>◈ PROJECTS</span>
        <span style={{ color: '#a78bfa' }}>{complete.length} COMPLETE</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {projects.length === 0 && (
          <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.65rem', textAlign: 'center' }}>
            NOVA will propose projects soon...
          </div>
        )}
        {active.map(p => <ProjectCard key={p.name} project={p} />)}
        {complete.map(p => <ProjectCard key={p.name} project={p} />)}
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const stage    = project.status?.stage || 'new';
  const stageIdx = STAGES.indexOf(stage);
  const progress = stageIdx >= 0 ? stageIdx / (STAGES.length - 1) : 0;
  const color    = STAGE_COLORS[stage] || '#3d6180';
  const isComplete = stage === 'complete';

  return (
    <div style={{
      padding: '0.6rem 0.7rem',
      marginBottom: '0.4rem',
      background: `rgba(0,0,0,0.3)`,
      border: `1px solid ${isComplete ? '#a78bfa30' : 'var(--border-dim)'}`,
      borderRadius: '8px',
      animation: 'fadeSlideUp 0.3s ease',
    }}>
      {/* Name row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <div style={{
          fontSize: '0.62rem',
          color: isComplete ? '#a78bfa' : 'var(--text-primary)',
          fontWeight: 600,
          maxWidth: '65%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-display)',
        }}>
          {isComplete ? '✓ ' : ''}{project.name}
        </div>
        <div style={{
          fontSize: '0.52rem',
          padding: '0.15rem 0.4rem',
          background: `${color}15`,
          border: `1px solid ${color}40`,
          borderRadius: '4px',
          color,
          letterSpacing: '0.08em',
        }}>
          {stage.toUpperCase()}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.3rem' }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: `linear-gradient(to right, ${color}60, ${color})`,
          borderRadius: 2,
          boxShadow: `0 0 4px ${color}80`,
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Stage dots */}
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {STAGES.slice(0, 8).map((s, i) => (
          <div key={s} style={{
            width: i === stageIdx ? 8 : 4,
            height: 4,
            borderRadius: 2,
            background: i < stageIdx ? color : i === stageIdx ? color : 'rgba(255,255,255,0.08)',
            boxShadow: i === stageIdx ? `0 0 4px ${color}` : 'none',
            transition: 'all 0.3s',
          }} />
        ))}
        <span style={{ fontSize: '0.45rem', color: 'var(--text-dim)', marginLeft: '0.3rem' }}>
          {STAGE_AGENT[stage]}
        </span>
      </div>
    </div>
  );
}