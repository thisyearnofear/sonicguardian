/**
 * Theme utilities for Sonic Guardian
 * Consolidates theme management and CSS-in-JS styling
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
  fontSize: {
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

/**
 * Light theme colors
 */
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

/**
 * Dark theme colors
 */
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

/**
 * Theme configurations
 */
export const themes: Record<Theme, ThemeConfig> = {
  light: {
    colors: lightColors,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    }
  },
  dark: {
    colors: darkColors,
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    }
  },
  system: {
    colors: window.matchMedia('(prefers-color-scheme: dark)').matches ? darkColors : lightColors,
    borderRadius: '0.5rem',
    boxShadow: window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    }
  }
};

/**
 * Get current theme configuration
 */
export function getCurrentThemeConfig(): ThemeConfig {
  const currentTheme = getCurrentTheme();
  return themes[currentTheme];
}

/**
 * Get current theme
 */
export function getCurrentTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'; // Default for SSR
  }
  
  const storedTheme = localStorage.getItem('sonic_guardian_theme');
  if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
    return storedTheme;
  }
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Set theme
 */
export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem('sonic_guardian_theme', theme);
  applyTheme(theme);
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  const config = themes[theme];
  
  // Set CSS custom properties
  Object.entries(config.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  root.style.setProperty('--border-radius', config.borderRadius);
  root.style.setProperty('--box-shadow', config.boxShadow);
  root.style.setProperty('--font-family', config.fontFamily);
  
  // Set font sizes
  Object.entries(config.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });
  
  // Add theme class for additional styling
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);
}

/**
 * Listen for system theme changes
 */
export function initThemeListener(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', (e) => {
    const storedTheme = localStorage.getItem('sonic_guardian_theme');
    if (!storedTheme || storedTheme === 'system') {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
  
  // Apply initial theme
  const currentTheme = getCurrentTheme();
  applyTheme(currentTheme);
}

/**
 * CSS-in-JS styles for consistent theming
 */
export const themeStyles = {
  container: {
    base: `
      min-h-screen w-full transition-colors duration-200
      bg-[color:var(--color-background)] text-[color:var(--color-foreground)]
    `,
    padding: 'p-4 sm:p-6 lg:p-8',
    maxWidth: 'max-w-4xl mx-auto'
  },
  
  card: {
    base: `
      rounded-[var(--border-radius)] shadow-[var(--box-shadow)]
      bg-[color:var(--color-background)] border border-[color:var(--color-border)]
      transition-all duration-200
    `,
    hover: 'hover:shadow-lg hover:-translate-y-1',
    padding: 'p-6'
  },
  
  button: {
    base: `
      inline-flex items-center justify-center rounded-[var(--border-radius)]
      font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    primary: `
      bg-[color:var(--color-primary)] text-white
      hover:bg-[color:var(--color-primary)]/90
      focus:ring-[color:var(--color-primary)]/50
      shadow-[var(--box-shadow)]
    `,
    secondary: `
      bg-[color:var(--color-secondary)] text-white
      hover:bg-[color:var(--color-secondary)]/90
      focus:ring-[color:var(--color-secondary)]/50
    `,
    ghost: `
      bg-transparent border border-[color:var(--color-border)]
      hover:bg-[color:var(--color-foreground)]/5
      focus:ring-[color:var(--color-primary)]/50
    `,
    success: `
      bg-[color:var(--color-success)] text-white
      hover:bg-[color:var(--color-success)]/90
      focus:ring-[color:var(--color-success)]/50
    `,
    error: `
      bg-[color:var(--color-error)] text-white
      hover:bg-[color:var(--color-error)]/90
      focus:ring-[color:var(--color-error)]/50
    `
  },
  
  input: {
    base: `
      w-full rounded-[var(--border-radius)] border border-[color:var(--color-border)]
      bg-[color:var(--color-background)] text-[color:var(--color-foreground)]
      placeholder-[color:var(--color-muted)] focus:outline-none focus:ring-2
      focus:ring-[color:var(--color-primary)]/50 focus:border-transparent
      transition-colors duration-200
    `,
    padding: 'px-4 py-3',
    fontSize: 'text-[var(--font-size-base)]'
  },
  
  status: {
    success: 'text-[color:var(--color-success)]',
    warning: 'text-[color:var(--color-warning)]',
    error: 'text-[color:var(--color-error)]',
    muted: 'text-[color:var(--color-muted)]'
  }
};

/**
 * Animation utilities
 */
export const animations = {
  fadeIn: 'animate-in fade-in duration-500',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-500',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce'
};

/**
 * Utility function to get theme-aware class names
 */
export function getThemeClass(theme: Theme): string {
  return `theme-${theme}`;
}

/**
 * Initialize theme system
 */
export function initThemeSystem(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Apply initial theme
  const theme = getCurrentTheme();
  applyTheme(theme);
  
  // Initialize listener for system theme changes
  initThemeListener();
}