// SpaceStation: typed agent network visualization component
'use client';
import React, { useRef, Dispatch, SetStateAction } from 'react';

type Agent = {
  key: string;
  label: string;
  role: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
  size: number;
  isHead?: boolean;
};

type CommLink = [string, string];

type AgentStatus = 'active' | 'due' | 'resting' | 'idle';

type Hive = {
  projects?: Array<{
    name: string;
    status?: { stage?: string };
  }>;
};

interface SpaceStationProps {
  hive?: Hive | null;
  agentStatus: (key: string) => AgentStatus;
  selected: string | null;
  setSelected: Dispatch<SetStateAction<string | null>>;
  tick: number;
}

interface RoomProps {
  agent: Agent;
  status: AgentStatus;
  isSelected: boolean;
  hive?: Hive | null;
}

const AGENTS: Agent[] = [
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
const COMM_LINKS: CommLink[] = [
  ['nova', 'apex'], ['scout', 'apex'], ['apex', 'atlas'],
  ['atlas', 'forge'], ['forge', 'lens'], ['lens', 'apex'],
  ['lens', 'pulse'], ['pulse', 'sage'], ['sage', 'echo'],
  ['nova', 'scout'],
];

export default function SpaceStation({ hive, agentStatus, selected, setSelected, tick }: SpaceStationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Particle packets travelling along comm links
  const packets = COMM_LINKS.map(([from, to], i) => {
    const f = AGENTS.find(a => a.key === from)!;
    const t = AGENTS.find(a => a.key === to)!;
    const phase = ((tick + i * 7) % 20) / 20; // 0..1 travelling
    const px = f.x + (t.x - f.x) * phase;
    const py = f.y + (t.y - f.y) * phase;
    const fromStatus = agentStatus(from);
    const visible = fromStatus === 'active' || fromStatus === 'due';
    return { from, to, px, py, color: f.color, visible, i };
  });

  return (
    <div className="relative w-full bg-[rgba(5,13,22,0.6)] border border-(--border-dim) rounded-2xl overflow-hidden backdrop-blur-lg">
      {/* Section label */}
      <div className="px-8 py-6 pb-4 font-display text-base tracking-[0.15em] text-(--text-primary) font-bold bg-gradient-to-r from-[rgba(100,150,255,0.1)] to-transparent border-b-2 border-(--echo-color)">
        ◈ STATION OVERVIEW — CLICK AN AGENT TO INSPECT
      </div>

      {/* SVG canvas for connections */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full pointer-events-none"
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
          if (!f || !t) return null;
          const fromActive = agentStatus(from) === 'active';
          return (
            <line
              key={i}
              x1={f.x} y1={f.y} x2={t.x} y2={t.y}
              stroke={fromActive ? f.color : 'rgba(255,255,255,0.04)'}
              strokeWidth={fromActive ? '0.3' : '0.15'}
              strokeDasharray={fromActive ? '1 1.5' : '0.5 2'}
              className="transition-all duration-500"
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
      <div className="relative w-full pb-[56%]">
        {AGENTS.map(agent => {
          const status = agentStatus(agent.key);
          const isSelected = selected === agent.key;

          return (
            <button
              key={agent.key}
              onClick={() => setSelected(isSelected ? null : agent.key)}
              className="absolute border-0 bg-transparent cursor-pointer p-0 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${agent.x}%`,
                top:  `${agent.y}%`,
                width: agent.size,
                zIndex: agent.isHead ? 10 : 5,
              }}
            >
              <Room
                agent={agent}
                status={status}
                isSelected={isSelected}
                hive={hive}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Room({ agent, status, isSelected, hive }: RoomProps) {
  const size = agent.size;
  const isActive = status === 'active';
  const isDue    = status === 'due';

  // Current project this agent is working on
  const activeProject = hive?.projects?.find(p => {
    if (!p.status?.stage) return false;
    const stageAgentMap = {
      approved: 'scout', research: 'atlas', architecture: 'forge',
      implementation: 'lens', review: 'pulse', tests: 'sage', docs: 'echo',
    };
    return stageAgentMap[p.status.stage as keyof typeof stageAgentMap] === agent.key;
  });

  return (
    <div className="relative text-center" style={{ width: size }}>
      {/* Pulse rings when active */}
      {(isActive || isDue) && (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border rounded-full opacity-50 animate-[pulse-ring_2s_ease-out_infinite]" style={{
            width: size * 0.9,
            height: size * 0.9,
            borderColor: agent.color,
          }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border rounded-full opacity-30 animate-[pulse-ring_2s_ease-out_infinite] [animation-delay:0.7s]" style={{
            width: size * 0.9,
            height: size * 0.9,
            borderColor: agent.color,
          }} />
        </>
      )}

      {/* Room body */}
      <div className="relative flex flex-col items-center justify-center gap-1 transition-all duration-250 backdrop-blur cursor-pointer overflow-hidden" style={{
        width: size,
        height: size,
        borderRadius: agent.isHead ? '50%' : '14px',
        background: isSelected
          ? `radial-gradient(circle, ${agent.color}28 0%, ${agent.color}12 100%)`
          : `radial-gradient(circle, ${agent.color}${isActive ? '22' : '12'} 0%, rgba(9,21,37,0.8) 100%)`,
        border: `2px solid ${isSelected ? agent.color : isActive ? `${agent.color}70` : `${agent.color}40`}`,
        boxShadow: isSelected
          ? `0 0 30px ${agent.color}60, inset 0 0 15px ${agent.color}20, 0 8px 20px rgba(0,0,0,0.5)`
          : isActive
          ? `0 0 ${agent.isHead ? 50 : 30}px ${agent.color}50, inset 0 0 15px ${agent.color}15, 0 6px 15px rgba(0,0,0,0.4)`
          : `0 0 12px ${agent.color}35, 0 2px 8px rgba(0,0,0,0.3)`,
        animation: isActive ? 'float 3s ease-in-out infinite' : 'none',
        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
      }}>
        {/* Scan line when active */}
        {isActive && (
          <div className="absolute top-0 left-0 right-0 h-[30%] animate-[scan_2.5s_linear_infinite]" style={{
            background: `linear-gradient(to bottom, ${agent.color}20, transparent)`,
          }} />
        )}

        {/* Corner brackets for selected */}
        {isSelected && ['tl','tr','bl','br'].map(pos => (
          <div
            key={pos}
            className={`absolute w-2 h-2 ${pos.includes('t') ? 'top-1' : 'bottom-1'} ${pos.includes('l') ? 'left-1' : 'right-1'}`}
            style={{
              borderTop:    pos.includes('t') ? `1.5px solid ${agent.color}` : 'none',
              borderBottom: pos.includes('b') ? `1.5px solid ${agent.color}` : 'none',
              borderLeft:   pos.includes('l') ? `1.5px solid ${agent.color}` : 'none',
              borderRight:  pos.includes('r') ? `1.5px solid ${agent.color}` : 'none',
            }}
          />
        ))}

        {/* Emoji */}
        <div className={`leading-none ${agent.isHead ? 'text-[1.9rem]' : 'text-[1.3rem]'} ${isSelected || isActive ? 'opacity-100' : 'opacity-90'}`} style={{
          filter: `drop-shadow(0 0 8px ${agent.color}${isSelected || isActive ? 'ff' : '80'})`,
        }}>{agent.emoji}</div>

        {/* Name */}
        <div className={`font-display font-bold tracking-[0.15em] ${agent.isHead ? 'text-[0.85rem]' : 'text-[0.7rem]'}`} style={{
          color: agent.color,
          textShadow: `0 0 4px ${agent.color}40`,
        }}>{agent.label}</div>

        {/* Status dot */}
        <div className="flex items-center gap-1">
          <div className={`w-[5px] h-[5px] rounded-full ${isActive ? 'animate-[blink_1s_ease-in-out_infinite]' : ''}`} style={{
            background: isActive ? agent.color : isDue ? '#ffd93d' : 'rgba(255,255,255,0.4)',
            boxShadow: (isActive || isDue) ? `0 0 6px ${isActive ? agent.color : '#ffd93d'}` : 'none',
          }} />
          <span className="text-[0.5rem] font-semibold tracking-[0.1em]" style={{ color: isActive ? agent.color : isDue ? '#ffd93d' : 'var(--text-secondary)' }}>
            {status.toUpperCase()}
          </span>
        </div>

        {/* Active project tag */}
        {activeProject && (
          <div className="absolute bottom-1 max-w-[80%] overflow-hidden text-ellipsis whitespace-nowrap text-[0.4rem] tracking-[0.05em] opacity-70" style={{
            color: agent.color,
          }}>
            ▶ {activeProject.name}
          </div>
        )}
      </div>

      {/* Role label below */}
      <div className="mt-1.5 text-[0.55rem] font-medium tracking-[0.15em] transition-colors duration-300" style={{
        color: isSelected ? agent.color : isDue ? '#ffd93d' : isActive ? agent.color : 'var(--text-secondary)',
        opacity: isSelected ? 1 : 0.9,
      }}>
        {agent.role.toUpperCase()}
      </div>
    </div>
  );
}
