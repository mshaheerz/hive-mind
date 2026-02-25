'use client';
import { useRef, useEffect } from 'react';

const AGENTS = [
  { key: 'apex',  label: 'APEX',  role: 'Operations Head', emoji: '👁',  color: '#f0b429', x: 50,  y: 50,  size: 90, isHead: true },
  { key: 'nova',  label: 'NOVA',  role: 'Innovation Scout', emoji: '💡', color: '#a78bfa', x: 20,  y: 20,  size: 70 },
  { key: 'scout', label: 'SCOUT', role: 'Researcher',        emoji: '🔍', color: '#34d399', x: 75,  y: 18,  size: 70 },
  { key: 'atlas', label: 'ATLAS', role: 'Architect',          emoji: '🏗', color: '#38bdf8', x: 12,  y: 55,  size: 65 },
  { key: 'forge', label: 'FORGE', role: 'Developer',          emoji: '⚒', color: '#f97316', x: 85,  y: 45,  size: 65 },
  { key: 'lens',  label: 'LENS',  role: 'Code Reviewer',      emoji: '🔎', color: '#ec4899', x: 22,  y: 82,  size: 60 },
  { key: 'pulse', label: 'PULSE', role: 'Tester',             emoji: '🧪', color: '#ef4444', x: 50,  y: 88,  size: 60 },
  { key: 'sage',  label: 'SAGE',  role: 'Documentation',      emoji: '📖', color: '#e2e8f0', x: 78,  y: 78,  size: 60 },
  { key: 'echo',  label: 'ECHO',  role: 'Social Media',       emoji: '📡', color: '#60a5fa', x: 88,  y: 20,  size: 60 },
];

// Which agents communicate with APEX
const COMM_LINKS = [
  ['nova', 'apex'], ['scout', 'apex'], ['apex', 'atlas'],
  ['atlas', 'forge'], ['forge', 'lens'], ['lens', 'apex'],
  ['lens', 'pulse'], ['pulse', 'sage'], ['sage', 'echo'],
  ['nova', 'scout'],
];

export default function SpaceStation({ hive, agentStatus, selected, setSelected, tick }) {
  const svgRef = useRef(null);

  const getStatusStyle = (key) => {
    const s = agentStatus(key);
    return {
      active:  { glow: 1.0,  ring: true,  opacity: 1.0 },
      due:     { glow: 0.6,  ring: true,  opacity: 0.9 },
      resting: { glow: 0.15, ring: false, opacity: 0.65 },
      idle:    { glow: 0.05, ring: false, opacity: 0.4 },
    }[s] || { glow: 0.05, ring: false, opacity: 0.4 };
  };

  // Particle packets travelling along comm links
  const packets = COMM_LINKS.map(([from, to], i) => {
    const f = AGENTS.find(a => a.key === from);
    const t = AGENTS.find(a => a.key === to);
    const phase = ((tick + i * 7) % 20) / 20; // 0..1 travelling
    const px = f.x + (t.x - f.x) * phase;
    const py = f.y + (t.y - f.y) * phase;
    const fromStatus = agentStatus(from);
    const visible = fromStatus === 'active' || fromStatus === 'due';
    return { from, to, px, py, color: f.color, visible, i };
  });

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      background: 'rgba(5,13,22,0.6)',
      border: '1px solid var(--border-dim)',
      borderRadius: '16px',
      overflow: 'hidden',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Section label */}
      <div style={{
        padding: '1rem 1.5rem 0',
        fontFamily: 'var(--font-display)',
        fontSize: '0.7rem',
        letterSpacing: '0.2em',
        color: 'var(--text-dim)',
      }}>
        ◈ STATION OVERVIEW — CLICK AN AGENT TO INSPECT
      </div>

      {/* SVG canvas for connections */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <defs>
          {AGENTS.map(a => (
            <radialGradient key={a.key} id={`grad-${a.key}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={a.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={a.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Comm lines */}
        {COMM_LINKS.map(([from, to], i) => {
          const f = AGENTS.find(a => a.key === from);
          const t = AGENTS.find(a => a.key === to);
          const fromActive = agentStatus(from) === 'active';
          return (
            <line
              key={i}
              x1={f.x} y1={f.y} x2={t.x} y2={t.y}
              stroke={fromActive ? f.color : 'rgba(255,255,255,0.04)'}
              strokeWidth={fromActive ? '0.3' : '0.15'}
              strokeDasharray={fromActive ? '1 1.5' : '0.5 2'}
              style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
            />
          );
        })}

        {/* Data packets travelling */}
        {packets.map(p => p.visible && (
          <circle
            key={p.i}
            cx={p.px} cy={p.py} r="0.7"
            fill={p.color}
            style={{ filter: `drop-shadow(0 0 1.5px ${p.color})` }}
          />
        ))}

        {/* Nebula rings around APEX */}
        <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(240,180,40,0.05)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(240,180,40,0.03)" strokeWidth="0.3" />
      </svg>

      {/* Agent rooms - positioned absolutely using % coordinates */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56%' }}>
        {AGENTS.map(agent => {
          const status = agentStatus(agent.key);
          const style  = getStatusStyle(agent.key);
          const isSelected = selected === agent.key;

          return (
            <button
              key={agent.key}
              onClick={() => setSelected(isSelected ? null : agent.key)}
              style={{
                position: 'absolute',
                left: `${agent.x}%`,
                top:  `${agent.y}%`,
                transform: 'translate(-50%, -50%)',
                width: agent.size,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                zIndex: agent.isHead ? 10 : 5,
              }}
            >
              <Room
                agent={agent}
                status={status}
                styleInfo={style}
                isSelected={isSelected}
                tick={tick}
                hive={hive}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Room({ agent, status, styleInfo, isSelected, tick, hive }) {
  const size = agent.size;
  const isActive = status === 'active';
  const isDue    = status === 'due';

  // Current project this agent is working on
  const activeProject = hive?.projects?.find(p => {
    const stageAgentMap = {
      approved: 'scout', research: 'atlas', architecture: 'forge',
      implementation: 'lens', review: 'pulse', tests: 'sage', docs: 'echo',
    };
    return stageAgentMap[p.status?.stage] === agent.key;
  });

  return (
    <div style={{ position: 'relative', width: size, textAlign: 'center' }}>
      {/* Pulse rings when active */}
      {(isActive || isDue) && (
        <>
          <div style={{
            position: 'absolute',
            inset: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: '50%',
            border: `1px solid ${agent.color}`,
            animation: 'pulse-ring 2s ease-out infinite',
            opacity: 0.5,
          }} />
          <div style={{
            position: 'absolute',
            inset: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: '50%',
            border: `1px solid ${agent.color}`,
            animation: 'pulse-ring 2s ease-out infinite 0.7s',
            opacity: 0.3,
          }} />
        </>
      )}

      {/* Room body */}
      <div style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: agent.isHead ? '50%' : '12px',
        background: isSelected
          ? `radial-gradient(circle, ${agent.color}22 0%, ${agent.color}08 100%)`
          : `radial-gradient(circle, ${agent.color}${isActive ? '18' : '08'} 0%, rgba(9,21,37,0.9) 100%)`,
        border: `1px solid ${isSelected ? agent.color : isActive ? `${agent.color}55` : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isActive
          ? `0 0 ${agent.isHead ? 40 : 20}px ${agent.color}${agent.isHead ? '55' : '30'}, inset 0 0 20px ${agent.color}10`
          : isSelected ? `0 0 20px ${agent.color}40` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        transition: 'all 0.4s ease',
        opacity: styleInfo.opacity,
        backdropFilter: 'blur(4px)',
        animation: isActive ? 'float 3s ease-in-out infinite' : 'none',
        cursor: 'pointer',
        overflow: 'hidden',
      }}>
        {/* Scan line when active */}
        {isActive && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '30%',
            background: `linear-gradient(to bottom, ${agent.color}20, transparent)`,
            animation: 'scan 2.5s linear infinite',
          }} />
        )}

        {/* Corner brackets for selected */}
        {isSelected && ['tl','tr','bl','br'].map(pos => (
          <div key={pos} style={{
            position: 'absolute',
            width: 8, height: 8,
            [pos.includes('t') ? 'top' : 'bottom']: 4,
            [pos.includes('l') ? 'left' : 'right']: 4,
            borderTop:    pos.includes('t') ? `1.5px solid ${agent.color}` : 'none',
            borderBottom: pos.includes('b') ? `1.5px solid ${agent.color}` : 'none',
            borderLeft:   pos.includes('l') ? `1.5px solid ${agent.color}` : 'none',
            borderRight:  pos.includes('r') ? `1.5px solid ${agent.color}` : 'none',
          }} />
        ))}

        {/* Emoji */}
        <div style={{
          fontSize: agent.isHead ? '1.6rem' : '1.1rem',
          lineHeight: 1,
          filter: isActive ? `drop-shadow(0 0 6px ${agent.color})` : 'none',
        }}>{agent.emoji}</div>

        {/* Name */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: agent.isHead ? '0.75rem' : '0.6rem',
          fontWeight: 700,
          color: agent.color,
          letterSpacing: '0.12em',
        }}>{agent.label}</div>

        {/* Status dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <div style={{
            width: 4, height: 4, borderRadius: '50%',
            background: isActive ? agent.color : isDue ? '#f0b429' : 'rgba(255,255,255,0.2)',
            boxShadow: isActive ? `0 0 4px ${agent.color}` : 'none',
            animation: isActive ? 'blink 1s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* Active project tag */}
        {activeProject && (
          <div style={{
            position: 'absolute', bottom: 4,
            fontSize: '0.4rem',
            color: agent.color,
            opacity: 0.7,
            maxWidth: '80%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
          }}>
            ▶ {activeProject.name}
          </div>
        )}
      </div>

      {/* Role label below */}
      <div style={{
        marginTop: '0.3rem',
        fontSize: '0.5rem',
        color: isActive ? agent.color : 'var(--text-dim)',
        letterSpacing: '0.1em',
        opacity: 0.8,
        transition: 'color 0.4s',
      }}>
        {agent.role.toUpperCase()}
      </div>
    </div>
  );
}