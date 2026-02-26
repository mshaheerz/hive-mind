'use client';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import SpaceStation from '../components/SpaceStation';
import AgentRoom from '../components/AgentRoom';
import MissionLog from '../components/MissionLog';
import ProjectTracker from '../components/ProjectTracker';
import ProposalQueue from '../components/ProposalQueue';
import CommsBus from '../components/commsBus';

type HiveState = {
  running?: boolean;
  cycleCount?: number;
  stats?: { approved?: number; completed?: number; duplicatesBlocked?: number };
  agentLastRun?: Record<string, string | number | Date>;
  projects?: Array<{ name: string; status?: { stage?: string } }>;
  queue?: any[];
  logs?: string[];
  discussions?: any[];
  state?: any;
};

const AGENT_SCHEDULE: Record<string, number> = {
  nova:  60, scout: 45, apex: 30,
  atlas: 90, forge: 120, lens: 60,
  pulse: 60, sage:  90, echo: 120,
};

export default function Home() {
  const [hive, setHive] = useState<HiveState | null>(null);
  const [tick, setTick] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Poll hive state every 5 seconds
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res  = await fetch('/api/hive-state');
        const data = await res.json();
        setHive(data);
        setLoading(false);
      } catch (e) {
        console.error('Failed to fetch hive state:', e);
        setLoading(false);
      }
    };
    fetchState();
    const iv = setInterval(fetchState, 5000);
    return () => clearInterval(iv);
  }, []);

  // Tick every second for animations
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const agentStatus = (agentName: string): 'active' | 'resting' | 'due' | 'idle' => {
    if (!hive?.state?.agentLastRun) return 'idle';
    const last = hive.state.agentLastRun[agentName];
    if (!last) return 'idle';
    const lastTime = typeof last === 'number' ? last : new Date(last).getTime();
    const mins = (Date.now() - lastTime) / 60000;
    const cycle = AGENT_SCHEDULE[agentName] || 60;
    if (mins < 2)       return 'active';
    if (mins < cycle)   return 'resting';
    return 'due';
  };

  if (loading) return <LoadingScreen />;

  return (
    <main className="relative z-1 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-8 border-b border-[rgba(255,255,255,0.15)] bg-[rgba(15,23,37,0.9)] backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-full bg-[radial-gradient(circle,_#ffd93d_0%,_#fb923c_60%,_transparent_100%)] shadow-[0_0_30px_rgba(255,217,61,0.8)] animate-[float_3s_ease-in-out_infinite]" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-[0.08em] bg-gradient-to-r from-[#ffd93d] via-[#60a5fa] to-[#c4b5fd] bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_4s_linear_infinite]">HIVE MIND</h1>
            <p className="text-[0.75rem] text-[var(--text-secondary)] tracking-[0.2em] font-semibold">
              AUTONOMOUS AI WORKSPACE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <StatusPill running={hive?.state?.running} />
          <Stat label="CYCLE" value={`#${hive?.state?.cycleCount || 0}`} />
          <Stat label="APPROVED" value={hive?.state?.stats?.approved || 0} color="var(--scout-color)" />
          <Stat label="COMPLETED" value={hive?.state?.stats?.completed || 0} color="var(--atlas-color)" />
          <Stat label="DUPES BLOCKED" value={hive?.state?.stats?.duplicatesBlocked || 0} color="var(--text-dim)" />
        </div>
      </header>

      {/* Space Station Visualization */}
      <div className="px-8 py-8 max-w-[1600px] mx-auto">
        <SpaceStation
          hive={hive}
          agentStatus={agentStatus}
          selected={selected}
          setSelected={setSelected}
          tick={tick}
        />

        {/* Bottom grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <ProjectTracker projects={hive?.projects || []} />
          <ProposalQueue queue={hive?.queue || []} />
          <MissionLog logs={hive?.logs || []} />
        </div>

        {/* Agent detail panel */}
        {selected && (
          <AgentRoom
            agentName={selected}
            hive={hive}
            agentStatus={agentStatus}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Communication bus */}
        <CommsBus discussions={hive?.discussions || []} />
      </div>
    </main>
  );
}

function StatusPill({ running }: { running?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[0.65rem] font-semibold tracking-[0.15em] font-display transition-all ${running ? 'border-[var(--scout-color)]/40 bg-[var(--scout-color)]/10' : 'border-[var(--pulse-color)]/40 bg-[var(--pulse-color)]/10'}`}>
      <div className={`w-2 h-2 rounded-full ${running ? 'bg-[var(--scout-color)] animate-[blink_1.5s_ease-in-out_infinite] shadow-[0_0_8px_var(--scout-color)]' : 'bg-[var(--pulse-color)]'}`} />
      <span className={running ? 'text-[var(--scout-color)]' : 'text-[var(--pulse-color)]'}>
        {running ? 'RUNNING' : 'OFFLINE'}
      </span>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-[1.1rem] font-bold font-display" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-[0.55rem] text-[var(--text-dim)] tracking-[0.15em]">{label}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="w-16 h-16 rounded-full shadow-[0_0_40px_rgba(255,217,61,0.6)] animate-[float_2s_ease-in-out_infinite] bg-[radial-gradient(circle,_#ffd93d,_#fb923c)]" />
      <p className="font-display text-xl font-bold tracking-[0.2em] text-[var(--text-secondary)]">
        INITIALIZING HIVE...
      </p>
    </div>
  );
}