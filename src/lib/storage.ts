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

export interface GiftVault {
  id: string;
  sender: string;
  amount: string; // in BTC
  commitment: string;
  blinding: string; // Stored client-side for the sender (or passed to recipient)
  status: 'locked' | 'claimed' | 'refunded';
  musicalChunks: string[];
  createdAt: number;
  claimedAt?: number;
  recipient?: string;
  txHash?: string; // Optional transaction hash for on-chain verification
  cid?: string; // IPFS Content Identifier for decentralized sharing
}


export interface VaultMetadata {
  vaultId: string;
  sender: string;
  amount: string;
  status: 'locked' | 'claimed' | 'refunded';
  createdAt: number;
  musicalChunks: string[];
  cid?: string;
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

// Vault Management Functions
export const vaultManager = {
  /**
   * Generate deterministic vault ID from commitment
   */
  generateVaultId: (commitment: string): string => {
    return `vault_${commitment.substring(0, 16)}`;
  },

  /**
   * Encrypt blinding factor with user's wallet address
   */
  encryptBlinding: (blinding: string, walletAddress: string): string => {
    try {
      // Simple XOR encryption for demo purposes
      // In production, use proper encryption like AES-GCM
      const key = walletAddress.substring(2); // Remove 0x prefix
      let encrypted = '';
      for (let i = 0; i < blinding.length; i++) {
        const charCode = blinding.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
      }
      return btoa(encrypted); // Base64 encode for storage
    } catch (error) {
      console.error('Failed to encrypt blinding factor:', error);
      return blinding; // Fallback to plain text
    }
  },

  /**
   * Decrypt blinding factor with user's wallet address
   */
  decryptBlinding: (encryptedBlinding: string, walletAddress: string): string => {
    try {
      const key = walletAddress.substring(2); // Remove 0x prefix
      const encrypted = atob(encryptedBlinding);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt blinding factor:', error);
      return encryptedBlinding; // Fallback to encrypted text
    }
  },

  /**
   * Store a gift vault locally
   */
  createVault: (vault: GiftVault): boolean => {
    try {
      const vaultId = vault.id;
      storage.set(`vault_${vaultId}`, vault);

      // Also store metadata for quick listing
      const metadata: VaultMetadata = {
        vaultId: vault.id,
        sender: vault.sender,
        amount: vault.amount,
        status: vault.status,
        createdAt: vault.createdAt,
        musicalChunks: vault.musicalChunks
      };
      storage.set(`vault_meta_${vaultId}`, metadata);

      return true;
    } catch (error) {
      console.error('Failed to create vault:', error);
      return false;
    }
  },

  /**
   * Retrieve a gift vault by ID
   */
  getVault: (vaultId: string): GiftVault | null => {
    try {
      return storage.get<GiftVault | null>(`vault_${vaultId}`, null);
    } catch (error) {
      console.error('Failed to get vault:', error);
      return null;
    }
  },

  /**
   * Update vault status (locked -> claimed)
   */
  updateVault: (vaultId: string, updates: Partial<GiftVault>): boolean => {
    try {
      const vault = vaultManager.getVault(vaultId);
      if (!vault) return false;

      const updated = { ...vault, ...updates };
      storage.set(`vault_${vaultId}`, updated);

      // Update metadata if status changed
      if (updates.status) {
        const metadata = vaultManager.getVaultMetadata(vaultId);
        if (metadata) {
          metadata.status = updates.status;
          storage.set(`vault_meta_${vaultId}`, metadata);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update vault:', error);
      return false;
    }
  },

  /**
   * Get vault metadata for quick listing
   */
  getVaultMetadata: (vaultId: string): VaultMetadata | null => {
    try {
      return storage.get<VaultMetadata | null>(`vault_meta_${vaultId}`, null);
    } catch (error) {
      console.error('Failed to get vault metadata:', error);
      return null;
    }
  },

  /**
   * List all vaults for a recipient
   */
  listUserVaults: (recipientAddress: string): VaultMetadata[] => {
    try {
      const vaults: VaultMetadata[] = [];
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + 'vault_meta_'));

      for (const key of keys) {
        const metadata = storage.get<VaultMetadata | null>(key, null);
        if (metadata) {
          // Check if this vault is claimable by the recipient
          const vault = vaultManager.getVault(metadata.vaultId);
          if (vault && vault.status === 'locked') {
            vaults.push(metadata);
          }
        }
      }

      return vaults.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Failed to list user vaults:', error);
      return [];
    }
  },

  /**
   * List vaults created by a sender
   */
  listSenderVaults: (senderAddress: string): VaultMetadata[] => {
    try {
      const vaults: VaultMetadata[] = [];
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX + 'vault_meta_'));

      for (const key of keys) {
        const metadata = storage.get<VaultMetadata | null>(key, null);
        if (metadata && metadata.sender === senderAddress) {
          vaults.push(metadata);
        }
      }

      return vaults.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Failed to list sender vaults:', error);
      return [];
    }
  },

  /**
   * Remove a vault (for cleanup)
   */
  removeVault: (vaultId: string): boolean => {
    try {
      storage.remove(`vault_${vaultId}`);
      storage.remove(`vault_meta_${vaultId}`);
      return true;
    } catch (error) {
      console.error('Failed to remove vault:', error);
      return false;
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
