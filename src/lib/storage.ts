/**
 * Storage utilities for Sonic Guardian
 * Single source of truth for persistence
 */

export interface UserSession {
  id: string;
  createdAt: number;
  lastUsed: number;
  secretPrompt: string;
  storedHash: string;
  storedSalt: string;
  btcAddress?: string;
  blinding?: string; // Encrypted blinding factor
  recoveryAttempts: RecoveryAttempt[];
}

export interface RecoveryAttempt {
  id: string;
  timestamp: number;
  prompt: string;
  success: boolean;
  hash?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  audioEnabled: boolean;
  animationsEnabled: boolean;
  useRealAI: boolean;
}

const STORAGE_PREFIX = 'sonic_';

const storage = {
  get: <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  }
};

export const sessionManager = {
  getCurrentSession: () => storage.get<UserSession | null>('session', null),
  
  createSession: (
    secretPrompt: string,
    storedHash: string,
    storedSalt: string,
    btcAddress?: string,
    blinding?: string
  ) => {
    const session: UserSession = {
      id: Math.random().toString(36).substring(2),
      createdAt: Date.now(),
      lastUsed: Date.now(),
      secretPrompt,
      storedHash,
      storedSalt,
      btcAddress,
      blinding, // Store blinding factor securely
      recoveryAttempts: []
    };
    storage.set('session', session);
    return session;
  },
  
  updateSession: (updates: Partial<UserSession>) => {
    const session = sessionManager.getCurrentSession();
    if (!session) return null;
    const updated = { ...session, ...updates, lastUsed: Date.now() };
    storage.set('session', updated);
    return updated;
  },
  
  addRecoveryAttempt: (prompt: string, success: boolean, hash?: string) => {
    const session = sessionManager.getCurrentSession();
    if (!session) return;
    session.recoveryAttempts.push({
      id: Math.random().toString(36).substring(2),
      timestamp: Date.now(),
      prompt,
      success,
      hash
    });
    session.lastUsed = Date.now();
    storage.set('session', session);
  },
  
  clearSession: () => storage.remove('session')
};

export const preferencesManager = {
  get: () => storage.get<UserPreferences>('prefs', {
    theme: 'system',
    audioEnabled: true,
    animationsEnabled: true,
    useRealAI: false
  }),
  set: (updates: Partial<UserPreferences>) => {
    const current = preferencesManager.get();
    storage.set('prefs', { ...current, ...updates });
  }
};

// Compatibility exports
export const isAudioEnabled = () => preferencesManager.get().audioEnabled;
export const setAudioEnabled = (val: boolean) => preferencesManager.set({ audioEnabled: val });
export const areAnimationsEnabled = () => preferencesManager.get().animationsEnabled;
export const setAnimationsEnabled = (val: boolean) => preferencesManager.set({ animationsEnabled: val });
export const isRealAIEnabled = () => preferencesManager.get().useRealAI;
export const setRealAIEnabled = (val: boolean) => preferencesManager.set({ useRealAI: val });