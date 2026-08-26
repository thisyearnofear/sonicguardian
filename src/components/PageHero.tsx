'use client';

import React from 'react';

interface PageHeroProps {
  title: string;
  subtitle: string;
  badge?: string;
  compact?: boolean;
  onHelp?: () => void;
  actions?: React.ReactNode;
}

export function PageHero({ title, subtitle, badge, compact, onHelp, actions }: PageHeroProps) {
  return (
    <header className={`text-center max-w-2xl relative w-full ${compact ? 'mb-4 space-y-2' : 'mb-6 space-y-3'}`}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/5 text-[color:var(--color-primary)] text-xs font-medium">
          {badge}
        </div>
      )}
      <h1
        className={`font-bold tracking-tight text-gradient leading-[1.08] ${
          compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl'
        }`}
      >
        {title}
      </h1>
      <p className="text-sm sm:text-base text-[color:var(--color-muted)] max-w-lg mx-auto leading-relaxed">
        {subtitle}
      </p>
      {actions && <div className="flex flex-wrap items-center justify-center gap-2 pt-1">{actions}</div>}
      {onHelp && (
        <button
          type="button"
          onClick={onHelp}
          className="absolute top-0 right-0 w-9 h-9 rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] hover:border-[color:var(--color-primary)]/40 transition-colors flex items-center justify-center text-sm"
          aria-label="Get help with Sonic Guardian"
        >
          ?
        </button>
      )}
    </header>
  );
}
