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
    try {
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
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  },
  
  updateSession: (updates: Partial<UserSession>) => {
    const session = sessionManager.getCurrentSession();
    if (!session) return null;
    try {
      const updated = { ...session, ...updates, lastUsed: Date.now() };
      storage.set('session', updated);
      return updated;
    } catch (error) {
      console.error('Failed to update session:', error);
      return null;
    }
  },
  
  addRecoveryAttempt: (prompt: string, success: boolean, hash?: string) => {
    const session = sessionManager.getCurrentSession();
    if (!session) return;
    try {
      session.recoveryAttempts.push({
        id: Math.random().toString(36).substring(2),
        timestamp: Date.now(),
        prompt,
        success,
        hash
      });
      
      // Keep only last 10 attempts
      if (session.recoveryAttempts.length > 10) {
        session.recoveryAttempts.splice(0, session.recoveryAttempts.length - 10);
      }
      
      session.lastUsed = Date.now();
      storage.set('session', session);
    } catch (error) {
      console.error('Failed to add recovery attempt:', error);
    }
  },
  
  clearSession: () => {
    try {
      storage.remove('session');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
};

export const preferencesManager = {
  get: () => {
    try {
      return storage.get<UserPreferences>('prefs', {
        theme: 'system',
        audioEnabled: true,
        animationsEnabled: true,
        useRealAI: false
      });
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return {
        theme: 'system',
        audioEnabled: true,
        animationsEnabled: true,
        useRealAI: false
      };
    }
  },
  set: (updates: Partial<UserPreferences>) => {
    try {
      const current = preferencesManager.get();
      storage.set('prefs', { ...current, ...updates });
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }
};

// Compatibility exports
export const isAudioEnabled = () => preferencesManager.get().audioEnabled;
export const setAudioEnabled = (val: boolean) => preferencesManager.set({ audioEnabled: val });
export const areAnimationsEnabled = () => preferencesManager.get().animationsEnabled;
export const setAnimationsEnabled = (val: boolean) => preferencesManager.set({ animationsEnabled: val });
export const isRealAIEnabled = () => preferencesManager.get().useRealAI;
export const setRealAIEnabled = (val: boolean) => preferencesManager.set({ useRealAI: val });