/**
 * Prerenderable instant loading shells for Cache Components / Partial Prefetching.
 */

type ShellVariant = 'mint' | 'verify';

interface AppLoadingShellProps {
  variant?: ShellVariant;
}

export function AppLoadingShell({ variant = 'mint' }: AppLoadingShellProps) {
  const isVerify = variant === 'verify';

  return (
    <div
      className="relative min-h-dvh bg-[color:var(--background)] pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))]"
      aria-busy="true"
      aria-label={isVerify ? 'Loading verify flow' : 'Loading Sonic Guardian'}
      data-testid="app-loading-shell"
      data-variant={variant}
    >
      <div className="noise" />
      <div className="bg-gradient-mesh" />

      <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] py-3 bg-[color:var(--background)]/80 backdrop-blur-md border-b border-[color:var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-24 rounded skeleton-shimmer hidden sm:block" />
          </div>
          <div className="h-8 w-28 rounded-xl skeleton-shimmer" />
          <div className="h-9 w-20 rounded-lg skeleton-shimmer" />
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col items-center">
        <header className="text-center mb-8 space-y-3 max-w-2xl w-full">
          <div className="mx-auto h-6 w-56 max-w-full rounded-full skeleton-shimmer" />
          <div className="mx-auto h-10 w-72 max-w-full rounded-lg skeleton-shimmer" />
          {!isVerify && <div className="mx-auto h-4 w-48 max-w-full rounded skeleton-shimmer" />}
        </header>

        {isVerify ? (
          <div className="w-full max-w-2xl glass rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="h-6 w-40 rounded skeleton-shimmer" />
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-11 w-full rounded-xl skeleton-shimmer" />
            <div className="h-11 w-full rounded-xl skeleton-shimmer" />
            <div className="h-12 w-full rounded-xl skeleton-shimmer mt-2" />
          </div>
        ) : (
          <>
            <div className="w-full max-w-2xl flex items-center justify-between gap-2 mb-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-14 rounded skeleton-shimmer" />
                </div>
              ))}
            </div>
            <div className="w-full max-w-2xl glass rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="h-4 w-32 rounded skeleton-shimmer" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-24 rounded-xl skeleton-shimmer" />
                ))}
              </div>
              <div className="h-11 w-full rounded-xl skeleton-shimmer mt-4" />
            </div>
          </>
        )}

        <p
          className="mt-6 text-[10px] text-[color:var(--color-muted)] uppercase tracking-widest animate-pulse"
          data-testid="loading-shell-message"
        >
          {isVerify ? 'Loading verify flow…' : 'Loading sonic protocol…'}
        </p>
      </main>
    </div>
  );
}
