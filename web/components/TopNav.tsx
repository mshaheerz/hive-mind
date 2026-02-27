'use client';

interface HiveStats {
  approved?: number;
  completed?: number;
  duplicatesBlocked?: number;
}

interface TopNavProps {
  running?: boolean;
  provider?: string;
  cycleCount?: number;
  stats?: HiveStats;
}

export default function TopNav({ running, provider, cycleCount, stats }: TopNavProps) {
  const providerLabel = (provider || 'openrouter').toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-(--border-dim) bg-[rgba(15,23,37,0.9)] backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-5 py-4 md:px-8 md:py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full bg-[radial-gradient(circle,#ffd93d_0%,#fb923c_60%,transparent_100%)] shadow-[0_0_30px_rgba(255,217,61,0.8)] animate-[float_3s_ease-in-out_infinite]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-[0.08em] bg-linear-to-r from-[#ffd93d] via-[#60a5fa] to-[#c4b5fd] bg-size-[200%_auto] bg-clip-text text-transparent animate-[shimmer_4s_linear_infinite] md:text-3xl">
              HIVE MIND
            </h1>
            <p className="text-[0.68rem] text-(--text-secondary) tracking-[0.16em] font-semibold md:text-[0.75rem] md:tracking-[0.2em]">
              AUTONOMOUS AI WORKSPACE
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:w-auto lg:grid-cols-6 lg:gap-3">
          <StatusPill running={running} />
          <Stat label="PROVIDER" value={providerLabel} color="var(--nova-color)" />
          <Stat label="CYCLE" value={`#${cycleCount || 0}`} />
          <Stat label="APPROVED" value={stats?.approved || 0} color="var(--scout-color)" />
          <Stat label="COMPLETED" value={stats?.completed || 0} color="var(--atlas-color)" />
          <Stat label="DUPES BLOCKED" value={stats?.duplicatesBlocked || 0} color="var(--text-dim)" />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ running }: { running?: boolean }) {
  return (
    <div className={`flex h-full min-h-[58px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[0.64rem] font-semibold tracking-[0.12em] font-display transition-all ${running ? 'border-(--scout-color)/40 bg-(--scout-color)/10' : 'border-(--pulse-color)/40 bg-(--pulse-color)/10'}`}>
      <div className={`w-2 h-2 rounded-full ${running ? 'bg-(--scout-color) animate-[blink_1.5s_ease-in-out_infinite] shadow-[0_0_8px_var(--scout-color)]' : 'bg-(--pulse-color)'}`} />
      <span className={running ? 'text-(--scout-color)' : 'text-(--pulse-color)'}>
        {running ? 'RUNNING' : 'OFFLINE'}
      </span>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex min-h-[58px] flex-col items-center justify-center rounded-lg border border-(--border-dim) bg-black/20 px-2 text-center">
      <div className="text-[1rem] font-bold font-display md:text-[1.1rem]" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-[0.5rem] text-(--text-dim) tracking-[0.12em] md:text-[0.55rem] md:tracking-[0.15em]">{label}</div>
    </div>
  );
}
