'use client';

const STATUS_CONFIG = {
  pending_scout:   { label: 'AWAITING SCOUT',  color: '#34d399', icon: '🔍' },
  pending_apex:    { label: 'AWAITING APEX',   color: '#f0b429', icon: '⏳' },
  needs_revision:  { label: 'REVISION NEEDED', color: '#f97316', icon: '🔄' },
  approved:        { label: 'APPROVED',         color: '#a78bfa', icon: '✅' },
  rejected:        { label: 'REJECTED',         color: '#ef4444', icon: '❌' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function ProposalQueue({ queue }) {
  const sorted = [...queue].sort((a, b) => new Date(b.proposedAt) - new Date(a.proposedAt)).slice(0, 20);

  const counts = {
    pending: queue.filter(p => p.status?.startsWith('pending')).length,
    approved: queue.filter(p => p.status === 'approved').length,
    rejected: queue.filter(p => p.status === 'rejected').length,
  };

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
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>◈ PROPOSALS</span>
        <div style={{ display: 'flex', gap: '0.7rem' }}>
          <span style={{ color: '#f0b429' }}>{counts.pending} PENDING</span>
          <span style={{ color: '#a78bfa' }}>{counts.approved} ✓</span>
          <span style={{ color: '#ef4444' }}>{counts.rejected} ✗</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {sorted.length === 0 && (
          <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.65rem', textAlign: 'center' }}>
            Waiting for NOVA's first proposals...
          </div>
        )}
        {sorted.map((p, i) => <ProposalCard key={p.id || i} proposal={p} />)}
      </div>
    </div>
  );
}

function ProposalCard({ proposal }) {
  const cfg = STATUS_CONFIG[proposal.status] || { label: proposal.status, color: '#3d6180', icon: '?' };

  return (
    <div style={{
      padding: '0.55rem 0.7rem',
      marginBottom: '0.35rem',
      background: 'rgba(0,0,0,0.25)',
      border: `1px solid ${cfg.color}25`,
      borderLeft: `2px solid ${cfg.color}`,
      borderRadius: '6px',
      animation: 'fadeSlideUp 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
        <div style={{
          fontSize: '0.62rem',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          maxWidth: '75%',
          lineHeight: 1.3,
        }}>
          {cfg.icon} {proposal.title}
        </div>
        <span style={{ fontSize: '0.5rem', color: 'var(--text-dim)', flexShrink: 0 }}>
          {timeAgo(proposal.proposedAt)}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.5rem',
          padding: '0.1rem 0.35rem',
          background: `${cfg.color}12`,
          border: `1px solid ${cfg.color}30`,
          borderRadius: '3px',
          color: cfg.color,
          letterSpacing: '0.08em',
        }}>
          {cfg.label}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {proposal.complexity && (
            <span style={{ fontSize: '0.48rem', color: 'var(--text-dim)' }}>
              {proposal.complexity}
            </span>
          )}
          {proposal.decision?.overall && (
            <span style={{ fontSize: '0.52rem', color: '#f0b429' }}>
              {proposal.decision.overall}/10
            </span>
          )}
        </div>
      </div>

      {/* APEX feedback snippet */}
      {proposal.revisionFeedback && (
        <div style={{
          marginTop: '0.3rem',
          fontSize: '0.5rem',
          color: '#f97316',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          APEX: "{proposal.revisionFeedback.slice(0, 80)}..."
        </div>
      )}
    </div>
  );
}