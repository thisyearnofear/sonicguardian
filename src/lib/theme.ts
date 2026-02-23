/**
 * Theme utilities for Sonic Guardian
 * Consolidates theme management and CSS custom properties
 */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  muted: string;
  border: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  borderRadius: string;
  boxShadow: string;
  fontFamily: string;
}

const lightColors: ThemeColors = {
  background: '#ffffff',
  foreground: '#1f2937',
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#10b981',
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#9ca3af',
  border: '#e5e7eb'
};

const darkColors: ThemeColors = {
  background: '#0b1220',
  foreground: '#f3f4f6',
  primary: '#60a5fa',
  secondary: '#94a3b8',
  accent: '#34d399',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  muted: '#6b7280',
  border: '#1f2937'
};

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    colors: lightColors,
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  dark: {
    colors: darkColors,
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  system: {
    colors: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? darkColors : lightColors,
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Inter, system-ui, sans-serif'
  }
};

export function getCurrentTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('sonic_guardian_theme');
  return (stored as Theme) || 'system';
}

export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sonic_guardian_theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const config = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? themes.dark : themes.light)
    : themes[theme];

  Object.entries(config.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  root.style.setProperty('--border-radius', config.borderRadius);
  root.style.setProperty('--box-shadow', config.boxShadow);

  root.classList.remove('dark', 'light');
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.add('light');
  }
}

export function getCurrentThemeConfig(): ThemeConfig {
  const theme = getCurrentTheme();
  return themes[theme];
}