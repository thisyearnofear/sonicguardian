/**
 * Storage utilities for Sonic Guardian
 * Single source of truth for persistence
 *
 * SECURITY (THREAT_MODEL_REVIEW.md R2): the session must never contain
 * pattern material. The persisted session holds ONE Shamir share (device),
 * its authentication digest, and session metadata — never the pattern code,
 * never the DNA hash, never recovery prompts. Device theft therefore yields
 * at most one share plus verification oracles, never both factors outright.
 * Legacy sessions that predate this rule are sanitized on first read.
 *
 * Note: On-chain gifting (create_onchain_gift / claim_onchain_gift) was removed
 * as feature-creep. The local GiftVault/VaultMetadata interfaces and vaultManager
 * were also removed. This file retains only session + preferences persistence.
 */

export interface UserSession {
  id: string;
  createdAt: number;
  lastUsed: number;
  /**
   * Salt used at mint for DNA-hash continuity (VerifyRouteApp R1 path). NOT a
   * secret: post-fix guardians store the public domain constant here; pre-fix
   * guardians need it to reproduce their mint-time hash on this device only.
   */
  storedSalt: string;
  btcAddress?: string;
  blinding?: string; // Encrypted blinding factor
  /**
   * Shamir DEVICE share (x=2) of the acoustic secret, 2-of-3 recovery split.
   * Stored encrypted at rest as an `SGE1:` envelope (non-extractable wrapping
   * key, see share-crypto.ts); legacy sessions may briefly hold plaintext
   * `SGS1:` shares until migrated on first read.
   */
  deviceShare?: string;
  /** SHA-256 of the acoustic secret, used to authenticate reconstruction */
  secretDigest?: string;
  /**
   * Timestamp of the cross-device recovery that promoted the PAPER share to
   * this device's stored share (THREAT_MODEL_REVIEW.md R5). Drives the
   * user-facing custody disclosure: the paper share is no longer offline-only
   * until the session is cleared. Absent when the share was the mint-time
   * device share.
   */
  paperSharePromotedAt?: number;
  /** Privacy-safe recovery audit trail: success + timestamp only (R2). */
  recoveryAttempts: RecoveryAttempt[];
}

export interface RecoveryAttempt {
  id: string;
  timestamp: number;
  success: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  audioEnabled: boolean;
  animationsEnabled: boolean;
  useRealAI: boolean;
}

const STORAGE_PREFIX = 'sonic_';
/** Logical key for the session record — the storage wrapper adds the prefix. */
export const STORAGE_KEY_SESSION = 'session';

/**
 * Strip pattern material from sessions minted before the R2 rule. Legacy
 * sessions stored the full pattern code (`secretPrompt`), the DNA hash
 * (`storedHash`), and recovery-attempt prompts — i.e. everything an attacker
 * needs to reconstruct both factors from one device theft. Returns a cleaned
 * session in canonical field order; unknown/legacy fields vanish by omission.
 */
function sanitizeLegacySession(session: UserSession): UserSession {
  const s = session as UserSession & {
    secretPrompt?: unknown;
    storedHash?: unknown;
    paperSharePromotedAt?: unknown;
    recoveryAttempts?: Array<Record<string, unknown>>;
  };
  return {
    id: typeof s.id === 'string' ? s.id : Math.random().toString(36).substring(2),
    createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now(),
    lastUsed: typeof s.lastUsed === 'number' ? s.lastUsed : Date.now(),
    storedSalt: typeof s.storedSalt === 'string' ? s.storedSalt : '',
    btcAddress: s.btcAddress,
    blinding: s.blinding,
    deviceShare: s.deviceShare,
    secretDigest: s.secretDigest,
    paperSharePromotedAt:
      typeof s.paperSharePromotedAt === 'number' ? s.paperSharePromotedAt : undefined,
    recoveryAttempts: Array.isArray(s.recoveryAttempts)
      ? s.recoveryAttempts.map((a) => ({
          id: typeof a.id === 'string' ? a.id : Math.random().toString(36).substring(2),
          timestamp: typeof a.timestamp === 'number' ? a.timestamp : Date.now(),
          success: a.success === true,
        }))
      : [],
  };
}

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
  getCurrentSession: () => {
    const session = storage.get<UserSession | null>(STORAGE_KEY_SESSION, null);
    if (!session) return null;
    // R2 migration: strip legacy pattern material once, then persist the
    // cleaned session so every later read (and any storage sync/backup) is
    // clean too.
    const cleaned = sanitizeLegacySession(session);
    if (JSON.stringify(cleaned) !== JSON.stringify(session)) {
      storage.set(STORAGE_KEY_SESSION, cleaned);
    }
    return cleaned;
  },

  /**
   * Create a session WITHOUT any pattern material (R2): the generated code is
   * the user's memorized secret — it lives in React state for the current
   * page session only and is deliberately never persisted.
   */
  createSession: (storedSalt: string, btcAddress?: string, blinding?: string) => {
    try {
      const session: UserSession = {
        id: Math.random().toString(36).substring(2),
        createdAt: Date.now(),
        lastUsed: Date.now(),
        storedSalt,
        btcAddress,
        blinding, // Store blinding factor securely
        recoveryAttempts: []
      };
      storage.set(STORAGE_KEY_SESSION, session);
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

  /**
   * Append to the recovery audit trail. Deliberately takes NO pattern
   * material (R2): a success flag and timestamp only.
   */
  addRecoveryAttempt: (success: boolean) => {
    const session = sessionManager.getCurrentSession();
    if (!session) return;
    try {
      session.recoveryAttempts.push({
        id: Math.random().toString(36).substring(2),
        timestamp: Date.now(),
        success,
      });

      // Keep only last 10 attempts
      if (session.recoveryAttempts.length > 10) {
        session.recoveryAttempts.splice(0, session.recoveryAttempts.length - 10);
      }

      session.lastUsed = Date.now();
      storage.set(STORAGE_KEY_SESSION, session);
    } catch (error) {
      console.error('Failed to add recovery attempt:', error);
    }
  },

  clearSession: () => {
    try {
      storage.remove(STORAGE_KEY_SESSION);
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
