/**
 * Unit tests for Storage functionality
 */

import { 
  sessionManager, 
  preferencesManager, 
  getCurrentTheme, 
  setTheme,
  clearAllData 
} from '../lib/storage';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
  length: 0,
  key: jest.fn((index: number) => Object.keys(mockLocalStorage.store)[index]),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('Storage System', () => {
  beforeEach(() => {
    mockLocalStorage.store = {};
    jest.clearAllMocks();
  });

  describe('Session Management', () => {
    it('should create and retrieve session', () => {
      const session = sessionManager.createSession(
        'test prompt',
        'test-hash',
        'test-salt'
      );

      expect(session).toBeTruthy();
      expect(session.secretPrompt).toBe('test prompt');
      expect(session.storedHash).toBe('test-hash');
      expect(session.storedSalt).toBe('test-salt');
      expect(session.recoveryAttempts).toEqual([]);

      const retrievedSession = sessionManager.getCurrentSession();
      expect(retrievedSession?.id).toBe(session.id);
    });

    it('should add recovery attempts', () => {
      const session = sessionManager.createSession(
        'test prompt',
        'test-hash',
        'test-salt'
      );

      const success = sessionManager.addRecoveryAttempt('recovery prompt', true, 'recovery-hash');
      expect(success).toBe(true);

      const updatedSession = sessionManager.getCurrentSession();
      expect(updatedSession?.recoveryAttempts).toHaveLength(1);
      expect(updatedSession?.recoveryAttempts[0].prompt).toBe('recovery prompt');
      expect(updatedSession?.recoveryAttempts[0].success).toBe(true);
      expect(updatedSession?.recoveryAttempts[0].hash).toBe('recovery-hash');
    });

    it('should clear session', () => {
      sessionManager.createSession('test', 'hash', 'salt');
      expect(sessionManager.getCurrentSession()).toBeTruthy();

      const success = sessionManager.clearSession();
      expect(success).toBe(true);
      expect(sessionManager.getCurrentSession()).toBeNull();
    });
  });

  describe('Preferences Management', () => {
    it('should get and set preferences', () => {
      const prefs = preferencesManager.getPreferences();
      expect(prefs).toEqual({
        theme: 'system',
        audioEnabled: true,
        animationsEnabled: true,
        useRealAI: false
      });

      const success = preferencesManager.setPreferences({ theme: 'dark' });
      expect(success).toBe(true);

      const updatedPrefs = preferencesManager.getPreferences();
      expect(updatedPrefs.theme).toBe('dark');
    });

    it('should reset preferences to defaults', () => {
      preferencesManager.setPreferences({ theme: 'dark', audioEnabled: false });
      const prefs = preferencesManager.getPreferences();
      expect(prefs.theme).toBe('dark');
      expect(prefs.audioEnabled).toBe(false);

      const success = preferencesManager.resetPreferences();
      expect(success).toBe(true);

      const defaultPrefs = preferencesManager.getPreferences();
      expect(defaultPrefs.theme).toBe('system');
      expect(defaultPrefs.audioEnabled).toBe(true);
    });
  });

  describe('Theme Management', () => {
    it('should get and set theme', () => {
      setTheme('dark');
      expect(getCurrentTheme()).toBe('dark');

      setTheme('light');
      expect(getCurrentTheme()).toBe('light');
    });

    it('should default to light theme when no storage', () => {
      expect(getCurrentTheme()).toBe('light');
    });
  });

  describe('Clear All Data', () => {
    it('should clear all data', () => {
      // Set up some data
      sessionManager.createSession('test', 'hash', 'salt');
      preferencesManager.setPreferences({ theme: 'dark' });
      setTheme('dark');

      const success = clearAllData();
      expect(success).toBe(true);

      expect(sessionManager.getCurrentSession()).toBeNull();
      expect(preferencesManager.getPreferences().theme).toBe('system');
      expect(getCurrentTheme()).toBe('light');
    });
  });
});