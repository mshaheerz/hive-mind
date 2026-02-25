'use client';
import { useState, useEffect, useRef } from 'react';
import SpaceStation from '../components/SpaceStation';
import AgentRoom from '../components/AgentRoom';
import MissionLog from '../components/MissionLog';
import ProjectTracker from '../components/ProjectTracker';
import ProposalQueue from '../components/ProposalQueue';
import CommsBus from '../components/commsBus';

const AGENT_SCHEDULE = {
  nova:  60, scout: 45, apex: 30,
  atlas: 90, forge: 120, lens: 60,
  pulse: 60, sage:  90, echo: 120,
};

export default function Home() {
  const [hive, setHive]         = useState(null);
  const [tick, setTick]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

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

  const agentStatus = (agentName) => {
    if (!hive?.state?.agentLastRun) return 'idle';
    const last = hive.state.agentLastRun[agentName];
    if (!last) return 'idle';
    const mins = (Date.now() - new Date(last)) / 60000;
    const cycle = AGENT_SCHEDULE[agentName] || 60;
    if (mins < 2)       return 'active';
    if (mins < cycle)   return 'resting';
    return 'due';
  };

  if (loading) return <LoadingScreen />;

  return (
    <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(5,13,22,0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'radial-gradient(circle, #f0b429 0%, #f97316 60%, transparent 100%)',
              boxShadow: '0 0 20px rgba(240,180,40,0.6)',
              animation: 'float 3s ease-in-out infinite',
            }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.4rem',
              fontWeight: 800, letterSpacing: '0.08em',
              background: 'linear-gradient(135deg, #f0b429, #60a5fa, #a78bfa)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>HIVE MIND</h1>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
              AUTONOMOUS AI WORKSPACE
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <StatusPill running={hive?.state?.running} />
          <Stat label="CYCLE" value={`#${hive?.state?.cycleCount || 0}`} />
          <Stat label="APPROVED" value={hive?.state?.stats?.approved || 0} color="var(--scout-color)" />
          <Stat label="COMPLETED" value={hive?.state?.stats?.completed || 0} color="var(--atlas-color)" />
          <Stat label="DUPES BLOCKED" value={hive?.state?.stats?.duplicatesBlocked || 0} color="var(--text-dim)" />
        </div>
      </header>

      {/* Space Station Visualization */}
      <div style={{ padding: '2rem', maxWidth: 1600, margin: '0 auto' }}>
        <SpaceStation
          hive={hive}
          agentStatus={agentStatus}
          selected={selected}
          setSelected={setSelected}
          tick={tick}
        />

        {/* Bottom grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}>
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

function StatusPill({ running }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.3rem 0.8rem',
      border: `1px solid ${running ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: '999px',
      background: running ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)',
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: running ? 'var(--scout-color)' : 'var(--pulse-color)',
        animation: running ? 'blink 1.5s ease-in-out infinite' : 'none',
        boxShadow: running ? '0 0 8px var(--scout-color)' : 'none',
      }} />
      <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: running ? 'var(--scout-color)' : 'var(--pulse-color)' }}>
        {running ? 'RUNNING' : 'OFFLINE'}
      </span>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: color || 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.15em' }}>{label}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '1.5rem',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'radial-gradient(circle, #f0b429, #f97316)',
        boxShadow: '0 0 40px rgba(240,180,40,0.6)',
        animation: 'float 2s ease-in-out infinite',
      }} />
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
        INITIALIZING HIVE...
      </p>
    </div>
  );
}