'use client';

interface LyricCardProps {
  lines: string[];
  onCopy?: () => void;
}

/** Spoken secret as a ticket, not a form list. */
export function LyricCard({ lines, onCopy }: LyricCardProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] overflow-hidden bg-[color:var(--color-foreground)]/[0.03]">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
        <p className="text-[11px] font-semibold text-[color:var(--color-muted)]">Your song</p>
        <p className="text-[11px] text-[color:var(--color-muted)]">Remember these lines</p>
      </div>
      <ol className="px-5 py-3 space-y-3 border-y border-dashed border-[color:var(--color-border)]">
        {lines.map((line, i) => (
          <li key={`${i}-${line}`} className="text-base sm:text-lg leading-snug font-medium tracking-tight">
            {line}
          </li>
        ))}
      </ol>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="w-full min-h-11 py-3 text-sm font-semibold text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/5"
        >
          Copy card
        </button>
      )}
    </div>
  );
}
