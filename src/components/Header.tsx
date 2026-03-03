'use client';

import React, { useEffect, useState } from 'react';
import { getCurrentTheme, setTheme, Theme } from '@/lib/theme';
import { WalletButton } from './WalletButton';

export function Header() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setCurrentTheme(getCurrentTheme());
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';
    setCurrentTheme(nextTheme);
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '☀️';
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3 bg-[color:var(--background)]/80 backdrop-blur-md border-b border-[color:var(--color-border)] shadow-sm' : 'py-6 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Sonic<span className="text-[color:var(--color-primary)]">Guardian</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <WalletButton />
          
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-[color:var(--color-foreground)]/5 hover:bg-[color:var(--color-foreground)]/10 border border-[color:var(--color-border)] transition-all flex items-center gap-2 group"
            title={`Current theme: ${currentTheme}. Click to switch.`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{getThemeIcon()}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-muted)] hidden md:block">
              {currentTheme}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
