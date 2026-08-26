'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentTheme, setTheme, Theme } from '@/lib/theme';
import { WalletButton } from './WalletButton';
import { AppNav } from './AppNav';
import { SITE_TAGLINE } from '@/lib/site';

export function Header() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setCurrentTheme(getCurrentTheme());

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme =
      currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
    setCurrentTheme(nextTheme);
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      default:
        return '💻';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)] ${
        isScrolled
          ? 'py-2 bg-[color:var(--background)]/92 backdrop-blur-md border-b border-[color:var(--color-border)] shadow-sm'
          : 'py-2.5 sm:py-3 bg-[color:var(--background)]/80 sm:bg-[color:var(--background)]/60 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-base">S</span>
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight hidden min-[420px]:inline truncate">
            Sonic<span className="text-[color:var(--color-primary)]">Guardian</span>
          </span>
          <span className="text-[10px] text-[color:var(--color-muted)] hidden min-[540px]:inline truncate">
            {SITE_TAGLINE}
          </span>
        </div>

        <AppNav />

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <WalletButton />

          <button
            type="button"
            onClick={toggleTheme}
            className="touch-target p-2 rounded-xl bg-[color:var(--color-foreground)]/5 hover:bg-[color:var(--color-foreground)]/10 border border-[color:var(--color-border)] transition-all"
            aria-label={`Theme: ${currentTheme}. Tap to switch.`}
          >
            <span className="text-base">{getThemeIcon()}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
