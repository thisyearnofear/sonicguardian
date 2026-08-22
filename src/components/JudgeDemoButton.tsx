'use client';

interface JudgeDemoButtonProps {
  onRun: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function JudgeDemoButton({ onRun, disabled, loading }: JudgeDemoButtonProps) {
  return (
    <button
      type="button"
      onClick={onRun}
      disabled={disabled || loading}
      data-testid="judge-demo-button"
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-[color:var(--color-accent)]/40 text-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 hover:bg-[color:var(--color-accent)]/15 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <>
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Preparing demo…
        </>
      ) : (
        <>⚡ Run judge demo</>
      )}
    </button>
  );
}
