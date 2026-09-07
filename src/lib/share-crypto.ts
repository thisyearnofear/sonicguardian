/**
 * Device-share encryption at rest (THREAT_MODEL_REVIEW.md R2/R3 follow-up).
 *
 * The session's device share is a Shamir share of the acoustic secret. On its
 * own it reconstructs nothing, but combined with an offline pattern
 * brute-force it becomes a full-compromise oracle (R3): candidate pattern →
 * pattern share → combine → check digest/on-chain key. Encrypting the share
 * under a NON-EXTRACTABLE WebCrypto key closes that oracle for at-rest theft:
 * a stolen localStorage holds only ciphertext, and the wrapping key cannot be
 * exported by any script.
 *
 * Key storage: the AES-GCM wrapping key (extractable: false) is persisted in
 * IndexedDB. CryptoKey objects are structured-cloneable, so the key itself —
 * never its bytes — is stored and can only ever be *used* via subtle.encrypt/
 * decrypt by same-origin code.
 *
 * HONEST LIMITS (documented, deliberate):
 * - An ACTIVE XSS on a live session can still load the key from IndexedDB and
 *   call subtle.decrypt. This raises the bar for passive exfiltration
 *   (profile sync, one-shot localStorage scraping, casual disk images); it
 *   does not defeat running attacker code on the origin.
 * - If the wrapping key is lost (cleared IndexedDB), the stored share becomes
 *   undecryptable ciphertext. That is survivable BY DESIGN: recovery needs
 *   any two of {pattern, device, paper} — pattern + paper share still works
 *   via the cross-device path.
 * - Degradation: if WebCrypto or IndexedDB is unavailable, the share is
 *   stored unprotected with a console warning (no worse than the pre-fix
 *   status quo; the rest of the app already requires crypto.subtle).
 *
 * Envelope format: `SGE1:<iv base64>:<ciphertext base64>` (AES-256-GCM, fresh
 * random IV per encryption). Legacy plaintext shares (`SGS1:...`) pass
 * through decryption untouched and are re-encrypted by the migration helper.
 *
 * This module is importable from Node tests: the IndexedDB key store is
 * replaceable via configureShareKeyStore().
 */

import { sessionManager } from './storage.ts';
import { uint8ToBase64, base64ToUint8 } from './shamir.ts';

const ENVELOPE_PREFIX = 'SGE1';
const DB_NAME = 'sonic-guardian';
const DB_VERSION = 1;
const STORE_NAME = 'share-keys';
const KEY_ID = 'device-share-kek';

/** Pluggable persistence for the non-extractable wrapping key. */
export interface ShareKeyStore {
  load(): Promise<CryptoKey | null>;
  save(key: CryptoKey): Promise<void>;
}

let activeKeyStore: ShareKeyStore | null = null;

/** Swap the key store (tests inject an in-memory store; null restores IndexedDB). */
export function configureShareKeyStore(store: ShareKeyStore | null): void {
  activeKeyStore = store;
}

function getStore(): ShareKeyStore {
  if (!activeKeyStore) activeKeyStore = createIndexedDbKeyStore();
  return activeKeyStore;
}

/** True when the stored value is an SGE1 envelope (already encrypted at rest). */
export function isEncryptedShare(stored: string): boolean {
  return stored.startsWith(ENVELOPE_PREFIX + ':');
}

/** Fresh plain-ArrayBuffer copy (subtle.crypto wants BufferSource; shamir's
 *  base64 helpers return ArrayBufferLike-backed views). */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/**
 * The key store is the source of truth: load on every encryption, generate
 * only when absent. No in-memory memo — a stale memo would encrypt under a
 * key the store no longer holds (undecryptable after reload), and the small
 * per-call IDB read is irrelevant at this app's encryption frequency.
 */
async function loadOrCreateWrappingKey(): Promise<CryptoKey> {
  const store = getStore();
  const existing = await store.load().catch(() => null);
  if (existing) return existing;
  // extractable: false is the point — no script can export these bytes.
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  await store.save(key);
  return key;
}

/** Encrypt a serialized share for at-rest storage. Idempotent on envelopes. */
export async function encryptDeviceShare(serializedShare: string): Promise<string> {
  if (!serializedShare || isEncryptedShare(serializedShare)) return serializedShare;
  try {
    const key = await loadOrCreateWrappingKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(new TextEncoder().encode(serializedShare)),
    );
    return `${ENVELOPE_PREFIX}:${uint8ToBase64(iv)}:${uint8ToBase64(new Uint8Array(ciphertext))}`;
  } catch (error) {
    // Degradation policy: never block the recovery ceremony on platform
    // limitations, but make the weakened at-rest state visible in the console.
    console.warn('Device-share encryption unavailable — storing share unprotected at rest.', error);
    return serializedShare;
  }
}

/**
 * Return the plaintext share for reconstruction. Legacy plaintext shares pass
 * through untouched. Returns null when the envelope cannot be decrypted
 * (e.g. wrapping key lost) — callers treat this as "no usable device share"
 * and fall back to the paper-share path.
 */
export async function decryptDeviceShare(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored) return null;
  if (!isEncryptedShare(stored)) return stored; // legacy plaintext share
  try {
    const [, ivB64, ctB64] = stored.split(':');
    if (!ivB64 || !ctB64) return null;
    const key = await getStore().load();
    if (!key) return null;
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(base64ToUint8(ivB64)) },
      key,
      toArrayBuffer(base64ToUint8(ctB64)),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

/**
 * One-time migration: re-persist a legacy plaintext device share as an SGE1
 * envelope. Call on mount of the entry components; reads never depend on it
 * having run (decryption passes legacy values through), it just moves the
 * at-rest state to the protected form sooner.
 */
export async function migrateSessionDeviceShare(): Promise<void> {
  const session = sessionManager.getCurrentSession();
  if (!session?.deviceShare || isEncryptedShare(session.deviceShare)) return;
  const encrypted = await encryptDeviceShare(session.deviceShare);
  if (encrypted !== session.deviceShare) {
    sessionManager.updateSession({ deviceShare: encrypted });
  }
}

// ---------------------------------------------------------------------------
// IndexedDB key store (browser default)
// ---------------------------------------------------------------------------

function createIndexedDbKeyStore(): ShareKeyStore {
  return {
    async load() {
      const db = await openDb();
      try {
        return await idbGet(db, KEY_ID);
      } finally {
        db.close();
      }
    },
    async save(key) {
      const db = await openDb();
      try {
        await idbPut(db, KEY_ID, key);
      } finally {
        db.close();
      }
    },
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<CryptoKey | null> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as CryptoKey | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB get failed'));
  });
}

function idbPut(db: IDBDatabase, key: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB put failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB put aborted'));
  });
}
