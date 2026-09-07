#!/usr/bin/env node
/**
 * R3 hardening regression (THREAT_MODEL_REVIEW.md): the device share must be
 * stored encrypted at rest under a NON-EXTRACTABLE wrapping key, so a stolen
 * localStorage holds only ciphertext and cannot serve as an offline oracle
 * for pattern brute-forcing.
 *
 * The browser persists the wrapping key in IndexedDB; tests inject an
 * in-memory key store (configureShareKeyStore) to verify the crypto contract:
 * envelope roundtrip, no plaintext leakage, random IVs, legacy passthrough,
 * key-loss behavior, and degradation when the key store is unavailable.
 * Run: node --test scripts/test-share-crypto.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const backing = new Map();
const memoryKeyStore = {
  load: async () => backing.get('kek') ?? null,
  save: async (key) => {
    backing.set('kek', key);
  },
};

const {
  configureShareKeyStore,
  encryptDeviceShare,
  decryptDeviceShare,
  isEncryptedShare,
  migrateSessionDeviceShare,
} = await import('../src/lib/share-crypto.ts');

configureShareKeyStore(memoryKeyStore);

const SAMPLE_SHARE = 'SGS1:2:' + 'A'.repeat(64);

test('R3: encrypt → decrypt roundtrip restores the original share', async () => {
  const envelope = await encryptDeviceShare(SAMPLE_SHARE);
  assert.ok(isEncryptedShare(envelope), 'stored value must be an SGE1 envelope');
  assert.equal(await decryptDeviceShare(envelope), SAMPLE_SHARE);
});

test('R3: ciphertext leaks no share material; IV is fresh per encryption', async () => {
  const a = await encryptDeviceShare(SAMPLE_SHARE);
  const b = await encryptDeviceShare(SAMPLE_SHARE);
  assert.notEqual(a, b, 'same share must encrypt differently (random IV)');
  assert.ok(!a.includes(SAMPLE_SHARE));
  assert.ok(!a.includes('SGS1:'), 'envelope must not embed the plaintext share format');
});

test('R3: the wrapping key is non-extractable', async () => {
  const key = backing.get('kek');
  assert.ok(key, 'key store must hold a wrapping key');
  await assert.rejects(
    crypto.subtle.exportKey('raw', key),
    (err) => err.name === 'InvalidAccessError' || /extract/i.test(err.message ?? ''),
    'non-extractable keys must refuse export',
  );
});

test('R3: legacy plaintext shares pass through decryption untouched', async () => {
  const legacy = 'SGS1:3:BBBB';
  assert.equal(isEncryptedShare(legacy), false);
  assert.equal(await decryptDeviceShare(legacy), legacy);
});

test('R3: losing the wrapping key yields null (paper-share fallback stays available)', async () => {
  const envelope = await encryptDeviceShare(SAMPLE_SHARE);
  backing.clear();
  assert.equal(await decryptDeviceShare(envelope), null, 'undecryptable envelope must fail closed');
  // A fresh key is created for the next encryption; no stale-key corruption.
  const fresh = await encryptDeviceShare('SGS1:2:CCCC');
  assert.equal(await decryptDeviceShare(fresh), 'SGS1:2:CCCC');
});

test('R3: unavailable key store degrades to plaintext (documented policy), then recovers', async () => {
  configureShareKeyStore({
    load: async () => {
      throw new Error('no idb');
    },
    save: async () => {
      throw new Error('no idb');
    },
  });
  const degraded = await encryptDeviceShare(SAMPLE_SHARE);
  assert.equal(degraded, SAMPLE_SHARE, 'degradation must return the plaintext share');
  configureShareKeyStore(memoryKeyStore); // platform recovered
  const envelope = await encryptDeviceShare(SAMPLE_SHARE);
  assert.equal(await decryptDeviceShare(envelope), SAMPLE_SHARE);
});

test('R3: migrateSessionDeviceShare re-persists legacy plaintext as an envelope', async () => {
  // storage.ts needs a localStorage mock.
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = globalThis;

  const { sessionManager } = await import('../src/lib/storage.ts');
  await sessionManager.createSession('salt', 'bc1qtest0000');
  sessionManager.updateSession({ deviceShare: SAMPLE_SHARE, secretDigest: 'd'.repeat(64) });

  await migrateSessionDeviceShare();

  const session = sessionManager.getCurrentSession();
  assert.ok(isEncryptedShare(session.deviceShare), 'migrated share must be an envelope');
  assert.equal(await decryptDeviceShare(session.deviceShare), SAMPLE_SHARE);
  // Idempotent: migrating again must not double-encrypt.
  await migrateSessionDeviceShare();
  assert.equal(await decryptDeviceShare(sessionManager.getCurrentSession().deviceShare), SAMPLE_SHARE);
});
