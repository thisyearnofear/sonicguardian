'use client';

import { Header } from './Header';
import { PageHero } from './PageHero';
import { Strk20Panel } from './Strk20Panel';

export function PoolApp() {
  return (
    <div className="relative min-h-dvh bg-[color:var(--background)] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Header />
      <div className="noise" />
      <div className="bg-sonic-wash" />

      <main
        id="main-content"
        className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col items-center"
      >
        <PageHero
          compact
          title="Privacy pool"
          subtitle="Separate from recovery. Shield, move privately, then unshield — in that order."
        />
        <Strk20Panel />
        <p className="mt-8 text-sm text-[color:var(--color-muted)] text-center">
          This is not part of recovery.{' '}
          <a href="/" className="underline underline-offset-2 hover:text-[color:var(--color-foreground)]">
            Back to create
          </a>
        </p>
      </main>
    </div>
  );
}
