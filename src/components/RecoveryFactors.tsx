'use client';

export type FactorStatus = 'pending' | 'ready' | 'needed' | 'missing';

export interface RecoveryFactorsProps {
  pattern?: FactorStatus;
  device?: FactorStatus;
  paper?: FactorStatus;
  caption?: string;
  className?: string;
}

const FACTORS: {
  key: 'pattern' | 'device' | 'paper';
  title: string;
  ready: string;
  pending: string;
  needed: string;
  missing: string;
}[] = [
  {
    key: 'pattern',
    title: 'You remember',
    ready: 'The music',
    pending: 'The music',
    needed: 'Replay the pattern',
    missing: 'Pattern not entered',
  },
  {
    key: 'device',
    title: 'This device',
    ready: 'Saved here',
    pending: 'A copy on this phone',
    needed: 'Not on this phone',
    missing: 'No copy here',
  },
  {
    key: 'paper',
    title: 'On paper',
    ready: 'Written down',
    pending: 'The written backup',
    needed: 'Paste your paper backup',
    missing: 'Not saved yet',
  },
];

function statusClass(status: FactorStatus): string {
  switch (status) {
    case 'ready':
      return 'border-[color:var(--color-success)]/45 bg-[color:var(--color-success)]/8';
    case 'needed':
      return 'border-[color:var(--color-warning)]/45 bg-[color:var(--color-warning)]/8';
    case 'missing':
      return 'border-[color:var(--color-border)] bg-transparent opacity-70';
    default:
      return 'border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.02]';
  }
}

function statusLabel(status: FactorStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'needed':
      return 'Needed';
    case 'missing':
      return 'Missing';
    default:
      return 'Next';
  }
}

export function RecoveryFactors({
  pattern = 'pending',
  device = 'pending',
  paper = 'pending',
  caption = 'Any two unlock recovery.',
  className = '',
}: RecoveryFactorsProps) {
  const states = { pattern, device, paper };

  return (
    <div className={className} data-testid="recovery-factors">
      <div className="grid grid-cols-3 gap-2">
        {FACTORS.map((factor) => {
          const status = states[factor.key];
          return (
            <div
              key={factor.key}
              data-factor={factor.key}
              data-status={status}
              className={`rounded-xl border px-2.5 py-3 text-center min-w-0 ${statusClass(status)}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-muted)]">
                {statusLabel(status)}
              </p>
              <p className="text-sm font-semibold mt-1 leading-tight">{factor.title}</p>
              <p className="text-xs text-[color:var(--color-muted)] mt-1 leading-snug">
                {factor[status]}
              </p>
            </div>
          );
        })}
      </div>
      {caption && (
        <p className="text-xs text-center text-[color:var(--color-muted)] mt-3">{caption}</p>
      )}
    </div>
  );
}
