/**
 * Storage utilities for Sonic Guardian
 * Consolidates all client-side storage with proper error handling and validation
 */

export interface UserSession {
  id: string;
  createdAt: number;
  lastUsed: number;
  secretPrompt: string;
  storedHash: string;
  storedSalt: string;
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
  lastSessionId?: string;
}

/**
 * Enhanced localStorage wrapper with error handling
 */
class SecureStorage {
  private readonly prefix = 'sonic_guardian_';
  private readonly maxRetries = 3;

  /**
   * Get item from localStorage with error handling
   */
  getItem<T>(key: string, defaultValue: T): T {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);
      
      if (!item) {
        return defaultValue;
      }

      const parsed = JSON.parse(item);
      return this.validateStorageData(parsed, defaultValue);
    } catch (error) {
      console.warn(`Failed to get storage item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set item to localStorage with error handling
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      
      // Check if localStorage is available and has space
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (error) {
      console.error(`Failed to set storage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove storage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all Sonic Guardian data
   */
  clear(): boolean {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Validate storage data structure
   */
  private validateStorageData<T>(data: any, defaultValue: T): T {
    if (data === null || data === undefined) {
      return defaultValue;
    }

    // Basic type checking for known structures
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      return { ...defaultValue, ...data } as T;
    }

    return data;
  }
}

/**
 * Session management
 */
class SessionManager {
  private storage = new SecureStorage();
  private currentSession: UserSession | null = null;

  /**
   * Create a new user session
   */
  createSession(secretPrompt: string, storedHash: string, storedSalt: string): UserSession {
    const session: UserSession = {
      id: this.generateSessionId(),
      createdAt: Date.now(),
      lastUsed: Date.now(),
      secretPrompt,
      storedHash,
      storedSalt,
      recoveryAttempts: []
    };

    this.currentSession = session;
    this.storage.setItem('current_session', session);
    
    // Update preferences with last session ID
    const preferences = this.getPreferences();
    preferences.lastSessionId = session.id;
    this.setPreferences(preferences);

    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): UserSession | null {
    if (this.currentSession) {
      return this.currentSession;
    }

    const session = this.storage.getItem<UserSession | null>('current_session', null);
    if (session) {
      this.currentSession = session;
    }

    return this.currentSession;
  }

  /**
   * Update current session
   */
  updateSession(updates: Partial<UserSession>): boolean {
    const session = this.getCurrentSession();
    if (!session) {
      return false;
    }

    const updatedSession = { ...session, ...updates, lastUsed: Date.now() };
    this.currentSession = updatedSession;
    return this.storage.setItem('current_session', updatedSession);
  }

  /**
   * Add recovery attempt to current session
   */
  addRecoveryAttempt(prompt: string, success: boolean, hash?: string): boolean {
    const session = this.getCurrentSession();
    if (!session) {
      return false;
    }

    const attempt: RecoveryAttempt = {
      id: this.generateSessionId(),
      timestamp: Date.now(),
      prompt,
      success,
      hash
    };

    session.recoveryAttempts.push(attempt);
    return this.updateSession({ recoveryAttempts: session.recoveryAttempts });
  }

  /**
   * Clear current session
   */
  clearSession(): boolean {
    this.currentSession = null;
    return this.storage.removeItem('current_session');
  }

  /**
   * Get session history
   */
  getSessionHistory(): UserSession[] {
    return this.storage.getItem<UserSession[]>('session_history', []);
  }

  /**
   * Add session to history
   */
  addToHistory(session: UserSession): boolean {
    const history = this.getSessionHistory();
    history.push(session);
    
    // Keep only last 10 sessions
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    return this.storage.setItem('session_history', history);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Preferences management
 */
class PreferencesManager {
  private storage = new SecureStorage();
  private currentPreferences: UserPreferences | null = null;

  /**
   * Get user preferences
   */
  getPreferences(): UserPreferences {
    if (this.currentPreferences) {
      return this.currentPreferences;
    }

    const preferences = this.storage.getItem<UserPreferences>('preferences', {
      theme: 'system',
      audioEnabled: true,
      animationsEnabled: true,
      useRealAI: false
    });

    this.currentPreferences = preferences;
    return preferences;
  }

  /**
   * Set user preferences
   */
  setPreferences(preferences: Partial<UserPreferences>): boolean {
    const current = this.getPreferences();
    const updatedPreferences = { ...current, ...preferences };
    
    this.currentPreferences = updatedPreferences;
    return this.storage.setItem('preferences', updatedPreferences);
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences(): boolean {
    this.currentPreferences = {
      theme: 'system',
      audioEnabled: true,
      animationsEnabled: true,
      useRealAI: false
    };
    
    return this.storage.setItem('preferences', this.currentPreferences);
  }
}

/**
 * Global storage instances
 */
export const secureStorage = new SecureStorage();
export const sessionManager = new SessionManager();
export const preferencesManager = new PreferencesManager();

/**
 * Utility functions for easy access
 */

/**
 * Get current theme preference
 */
export function getCurrentTheme(): 'light' | 'dark' | 'system' {
  return preferencesManager.getPreferences().theme;
}

/**
 * Set theme preference
 */
export function setTheme(theme: 'light' | 'dark' | 'system'): boolean {
  return preferencesManager.setPreferences({ theme });
}

/**
 * Check if audio is enabled
 */
export function isAudioEnabled(): boolean {
  return preferencesManager.getPreferences().audioEnabled;
}

/**
 * Set audio preference
 */
export function setAudioEnabled(enabled: boolean): boolean {
  return preferencesManager.setPreferences({ audioEnabled: enabled });
}

/**
 * Check if animations are enabled
 */
export function areAnimationsEnabled(): boolean {
  return preferencesManager.getPreferences().animationsEnabled;
}

/**
 * Set animations preference
 */
export function setAnimationsEnabled(enabled: boolean): boolean {
  return preferencesManager.setPreferences({ animationsEnabled: enabled });
}

/**
 * Check if real AI is enabled
 */
export function isRealAIEnabled(): boolean {
  return preferencesManager.getPreferences().useRealAI;
}

/**
 * Set real AI preference
 */
export function setRealAIEnabled(enabled: boolean): boolean {
  return preferencesManager.setPreferences({ useRealAI: enabled });
}

/**
 * Clear all Sonic Guardian data
 */
export function clearAllData(): boolean {
  sessionManager.clearSession();
  preferencesManager.resetPreferences();
  return secureStorage.clear();
}

/**
 * Export types for external use
 */
export type { UserSession, RecoveryAttempt, UserPreferences };