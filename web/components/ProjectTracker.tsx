'use client';

type ProjectStatus = {
  stage?: string;
  progress?: number;
};

type Project = {
  name: string;
  status?: ProjectStatus;
};

interface ProjectTrackerProps {
  projects: Project[];
}

interface ProjectCardProps {
  project: Project;
}

const STAGES = ['approved','research','architecture','implementation','review','tests','docs','launch','complete'];

const STAGE_COLORS: Record<string, string> = {
  approved: '#f0b429', research: '#34d399', architecture: '#38bdf8',
  implementation: '#f97316', review: '#ec4899', tests: '#ef4444',
  docs: '#e2e8f0', launch: '#60a5fa', complete: '#a78bfa',
};

const STAGE_AGENT: Record<string, string> = {
  approved: 'SCOUT', research: 'ATLAS', architecture: 'FORGE',
  implementation: 'LENS', review: 'PULSE', tests: 'SAGE',
  docs: 'ECHO', launch: '—', complete: '✓',
};

export default function ProjectTracker({ projects }: ProjectTrackerProps) {
  const active   = projects.filter(p => p.status?.stage && p.status.stage !== 'complete' && p.status.stage !== 'new');
  const complete = projects.filter(p => p.status?.stage === 'complete');

  return (
    <div className="flex flex-col overflow-hidden rounded-lg h-[400px] bg-[rgba(20,45,69,0.8)] border border-(--border-dim)">
      <div className="px-4 py-4 border-b border-(--border-dim) flex items-center justify-between text-[0.75rem] font-bold tracking-widest flex-shrink-0 text-(--text-secondary)">
        <span>◈ PROJECTS</span>
        <span className="text-nova">{complete.length} COMPLETE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {projects.length === 0 && (
          <div className="p-4 text-[0.75rem] text-center text-(--text-dim)">
            NOVA will propose projects soon...
          </div>
        )}
        {active.map(p => <ProjectCard key={p.name} project={p} />)}
        {complete.map(p => <ProjectCard key={p.name} project={p} />)}
      </div>
    </div>
  );
}

function ProjectCard({ project }: ProjectCardProps) {
  const stage    = project.status?.stage || 'new';
  const stageIdx = STAGES.indexOf(stage);
  const progress = stageIdx >= 0 ? stageIdx / (STAGES.length - 1) : 0;
  const color    = STAGE_COLORS[stage] || '#3d6180';
  const isComplete = stage === 'complete';

  return (
    <div className="p-1.5 mb-1 bg-black/25 border rounded-lg animate-[fadeSlideUp_0.3s_ease]" style={{ borderColor: isComplete ? `${color}40` : 'var(--border-dim)' }}>
      {/* Name row */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[0.75rem] font-bold max-w-[65%] overflow-hidden text-ellipsis whitespace-nowrap font-display" style={{ color: isComplete ? '#c4b5fd' : 'var(--text-primary)' }}>
          {isComplete ? '✓ ' : ''}{project.name}
        </div>
        <div className="text-[0.65rem] px-1.5 rounded border font-semibold" style={{ background: `${color}25`, borderColor: `${color}70`, color }}>
          {stage.toUpperCase()}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] rounded overflow-hidden mb-0.75 bg-[rgba(255,255,255,0.1)]">
        <div className="h-full rounded transition-all duration-[0.8s]" style={{ width: `${progress * 100}%`, background: `linear-gradient(to right, ${color}80, ${color})`, boxShadow: `0 0 6px ${color}` }} />
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-1">
        {STAGES.slice(0, 8).map((s, i) => (
          <div key={s} className="rounded transition-all duration-300" style={{
            width: i === stageIdx ? 10 : 5,
            height: 5,
            background: i < stageIdx ? color : i === stageIdx ? color : 'rgba(255,255,255,0.2)',
            boxShadow: i === stageIdx ? `0 0 8px ${color}` : 'none',
          }} />
        ))}
        <span className="text-[0.55rem] text-(--text-dim) ml-1 font-semibold">{STAGE_AGENT[stage]}</span>
      </div>
    </div>
  );
}