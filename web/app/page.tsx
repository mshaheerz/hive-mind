'use client';
import { useState, useEffect } from 'react';
import SpaceStation from '../components/SpaceStation';
import AgentRoom from '../components/AgentRoom';
import MissionLog from '../components/MissionLog';
import ProjectTracker from '../components/ProjectTracker';
import ProposalQueue from '../components/ProposalQueue';
import CommsBus from '../components/commsBus';
import AgentConversations from '../components/AgentConversations';
import CeoBridgeRoom from '../components/CeoBridgeRoom';
import TopNav from '../components/TopNav';

type HiveState = {
  provider?: string;
  running?: boolean;
  cycleCount?: number;
  stats?: { approved?: number; rejected?: number; completed?: number; active?: number; duplicatesBlocked?: number };
  agentLastRun?: Record<string, string | number | Date>;
  projects?: Array<{ name: string; status?: { stage?: string } }>;
  queue?: any[];
  logs?: string[];
  discussions?: any[];
  state?: any;
};

const AGENT_SCHEDULE: Record<string, number> = {
  nova:  60, scout: 45, apex: 15,
  atlas: 90, forge: 15, lens: 60,
  pulse: 60, sage:  90, echo: 120,
};

export default function Home() {
  const [hive, setHive] = useState<HiveState | null>(null);
  const [tick, setTick] = useState<number>(0);
  const [selected, setSelected] = useState<{ name: string; anchor: { x: number; y: number } } | null>(null);
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
    const dynamic = Number(hive?.state?.agentCadenceMinutes?.[agentName]);
    const cycle = Number.isFinite(dynamic) && dynamic > 0 ? dynamic : (AGENT_SCHEDULE[agentName] || 60);
    if (mins < 2)       return 'active';
    if (mins < cycle)   return 'resting';
    return 'due';
  };

  if (loading) return <LoadingScreen />;

  return (
    <main className="relative z-1 min-h-screen">
      <TopNav
        running={hive?.running ?? hive?.state?.running}
        provider={hive?.provider}
        cycleCount={hive?.state?.cycleCount}
        stats={hive?.stats || hive?.state?.stats}
      />

      {/* Space Station Visualization */}
      <div className="px-8 py-8 max-w-[1600px] mx-auto">
        <SpaceStation
          hive={hive}
          agentStatus={agentStatus}
          selected={selected?.name || null}
          setSelected={setSelected}
          tick={tick}
        />

        {/* Bottom grid */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          <ProjectTracker projects={hive?.projects || []} />
          <ProposalQueue queue={hive?.queue || []} />
          <MissionLog logs={hive?.logs || []} />
        </div>

        {/* Agent detail panel */}
        {selected && (
          <AgentRoom
            agentName={selected.name}
            anchor={selected.anchor}
            hive={hive}
            agentStatus={agentStatus}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Communication bus */}
        <CommsBus discussions={hive?.discussions || []} />
        <AgentConversations discussions={hive?.discussions || []} />
        <CeoBridgeRoom />
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="w-16 h-16 rounded-full shadow-[0_0_40px_rgba(255,217,61,0.6)] animate-[float_2s_ease-in-out_infinite] bg-[radial-gradient(circle,#ffd93d,#fb923c)]" />
      <p className="font-display text-xl font-bold tracking-[0.2em] text-(--text-secondary)">
        INITIALIZING HIVE...
      </p>
    </div>
  );
}
