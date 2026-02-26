'use client';

type StatusConfig = {
  label: string;
  color: string;
  icon: string;
};

type Proposal = {
  id?: string | number;
  title: string;
  status: string;
  proposedAt?: string | number | Date;
  complexity?: string;
  decision?: { overall: number };
  revisionFeedback?: string;
};

interface ProposalQueueProps {
  queue: Proposal[];
}

interface ProposalCardProps {
  proposal: Proposal;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending_scout:   { label: 'AWAITING SCOUT',  color: '#34d399', icon: '🔍' },
  pending_apex:    { label: 'AWAITING APEX',   color: '#f0b429', icon: '⏳' },
  needs_revision:  { label: 'REVISION NEEDED', color: '#f97316', icon: '🔄' },
  approved:        { label: 'APPROVED',         color: '#a78bfa', icon: '✅' },
  rejected:        { label: 'REJECTED',         color: '#ef4444', icon: '❌' },
};

function timeAgo(iso?: string | number | Date | null): string {
  if (!iso) return '';
  const t = typeof iso === 'number' ? iso : new Date(iso).getTime();
  if (!isFinite(t)) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function ProposalQueue({ queue }: ProposalQueueProps) {
  const sorted = [...queue].sort((a, b) => {
    const aTime = typeof a.proposedAt === 'number' ? a.proposedAt : new Date(a.proposedAt || 0).getTime();
    const bTime = typeof b.proposedAt === 'number' ? b.proposedAt : new Date(b.proposedAt || 0).getTime();
    return bTime - aTime;
  }).slice(0, 20);

  const counts = {
    pending: queue.filter(p => p.status?.startsWith('pending')).length,
    approved: queue.filter(p => p.status === 'approved').length,
    rejected: queue.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg h-[400px] bg-[rgba(20,45,69,0.8)] border border-(--border-dim)">
      <div className="px-4 py-4 border-b border-(--border-dim) flex-shrink-0 flex items-center justify-between text-[0.75rem] font-bold tracking-widest text-(--text-secondary)">
        <span>◆ PROPOSALS</span>
        <div className="flex gap-3 text-[0.7rem]">
          <span style={{ color: '#ffd93d' }}>{counts.pending} PENDING</span>
          <span style={{ color: '#c4b5fd' }}>{counts.approved} ✓</span>
          <span style={{ color: '#ef5350' }}>{counts.rejected} ✗</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {sorted.length === 0 && (
          <div className="p-4 text-[0.75rem] text-center text-(--text-dim)">
            Waiting for NOVA's first proposals...
          </div>
        )}
        {sorted.map((p, i) => <ProposalCard key={p.id || i} proposal={p} />)}
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: ProposalCardProps) {
  const cfg = STATUS_CONFIG[proposal.status] || { label: proposal.status, color: '#7d9ac3', icon: '?' };

  return (
    <div className="p-2 mb-1.5 bg-black/25 border rounded animate-[fadeSlideUp_0.3s_ease]" style={{ borderColor: `${cfg.color}35`, borderLeft: `3px solid ${cfg.color}` }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-display font-bold text-[0.75rem] max-w-[75%] leading-normal" style={{ color: 'var(--text-primary)' }}>
          {cfg.icon} {proposal.title}
        </div>
        <span className="text-[0.6rem] text-(--text-dim) flex-shrink-0">{timeAgo(proposal.proposedAt)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[0.6rem] px-1.5 rounded font-semibold border" style={{ background: `${cfg.color}15`, borderColor: `${cfg.color}50`, color: cfg.color }}>
          {cfg.label}
        </span>
        <div className="flex items-center gap-1.5">
          {proposal.complexity && (
            <span className="text-[0.6rem] text-(--text-dim)">{proposal.complexity}</span>
          )}
          {proposal.decision?.overall && (
            <span className="text-[0.65rem] font-semibold" style={{ color: '#ffd93d' }}>{proposal.decision.overall}/10</span>
          )}
        </div>
      </div>

      {proposal.revisionFeedback && (
        <div className="mt-0.75 text-[0.5rem] italic leading-[1.4]" style={{ color: '#f97316' }}>
          APEX: "{proposal.revisionFeedback.slice(0, 80)}..."
        </div>
      )}
    </div>
  );
}