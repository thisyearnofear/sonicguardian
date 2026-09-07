#!/usr/bin/env node
/**
 * Regression tests for M5 review findings R4 and R6 (THREAT_MODEL_REVIEW.md).
 *
 * R4 — fail-closed legacy key derivation: `pedersenSync`/`hexToFelt` used to
 *      swallow crypto failures and invalid input, silently producing the
 *      degenerate private key 0 in legacy derivation paths.
 * R6 — full-entropy backup keys: `encryptData` used only the first 32 ASCII
 *      characters of a 64-hex digest (128 of 256 bits). The full digest is now
 *      decoded to 32 raw bytes, with a legacy fallback so pre-fix backups
 *      remain decryptable.
 * Run: node --test scripts/test-crypto-hardening.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAcousticPublicKey,
  deriveAcousticSecret,
  hexToFelt,
  encryptData,
  decryptData,
  deriveKeyFromSignature,
} from '../src/lib/crypto.ts';

const DIGEST = 'ab'.repeat(32); // 64-hex, like deriveKeyFromSignature output

// ---------------------------------------------------------------------------
// R4 — legacy key derivation must fail closed
// ---------------------------------------------------------------------------

test('R4: hexToFelt rejects invalid and empty input instead of returning 0', () => {
  assert.throws(() => hexToFelt('not-hex!'), /not a valid hex/);
  assert.throws(() => hexToFelt(''), /not a valid hex/);
  assert.throws(() => hexToFelt('123g'), /not a valid hex/);
});

test('R4: hexToFelt still converts valid hex (mod curve order)', () => {
  const MODULO = BigInt('0x800000000000011000000000000000000000000000000000000000000000001');
  assert.equal(hexToFelt('ff'), '255');
  assert.equal(hexToFelt('0x0a'), '10');
  const big = 'f'.repeat(64);
  assert.equal(hexToFelt(big), (BigInt('0x' + big) % MODULO).toString());
});

test('R4: legacy key derivation fails closed when crypto.subtle breaks', async () => {
  const cryptoDesc = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  assert.ok(cryptoDesc, 'globalThis.crypto must be configurable to stub it');
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      subtle: {
        digest: async () => {
          throw new Error('subtle unavailable');
        },
      },
    },
  });
  try {
    // Before the fix these resolved with a key derived from the constant 0.
    await assert.rejects(getAcousticPublicKey(DIGEST), /crypto\.subtle is unavailable/);
    await assert.rejects(deriveAcousticSecret(DIGEST), /crypto\.subtle is unavailable/);
  } finally {
    Object.defineProperty(globalThis, 'crypto', cryptoDesc);
  }
});

test('R4: legacy derivation works again after the broken-crypto stub is removed', async () => {
  const pub = await getAcousticPublicKey(DIGEST);
  assert.match(pub, /^0x[0-9a-f]{63,64}$/);
});

// ---------------------------------------------------------------------------
// R6 — backup encryption must use the full key material
// ---------------------------------------------------------------------------

test('R6: encryptData/decryptData roundtrip with a derived hex digest', async () => {
  const key = await deriveKeyFromSignature('wallet-signature-material');
  const ct = await encryptData('sonic identity backup', key);
  assert.equal(await decryptData(ct, key), 'sonic identity backup');
});

test('R6: key material beyond the first 32 hex chars is load-bearing', async () => {
  const keyA = DIGEST;
  // Same first 32 hex chars as keyA — under the old scheme both keys were
  // identical, so this decryption would have succeeded.
  const keyB = DIGEST.slice(0, 32) + 'cd'.repeat(16);
  const ct = await encryptData('top secret pattern', keyA);
  assert.equal(await decryptData(ct, keyA), 'top secret pattern');
  await assert.rejects(decryptData(ct, keyB));
});

test('R6: non-hex keys use all their material (no silent truncation)', async () => {
  const keyA = 'a'.repeat(40);
  // Same first 32 chars as keyA — identical key under the old scheme.
  const keyB = 'a'.repeat(32) + 'b'.repeat(8);
  const ct = await encryptData('payload', keyA);
  assert.equal(await decryptData(ct, keyA), 'payload');
  await assert.rejects(decryptData(ct, keyB));
});

test('R6: pre-fix backups (legacy key slice) remain decryptable', async () => {
  const key = await deriveKeySignatureForLegacyFixture();
  const legacyCt = await encryptLikeLegacyFixture('pre-fix backup payload', key);
  assert.equal(await decryptData(legacyCt, key), 'pre-fix backup payload');
});

test('R6: corrupt ciphertext still fails under both new and legacy keys', async () => {
  const key = await deriveKeyFromSignature('wallet-signature-material');
  const junk = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(40))));
  await assert.rejects(decryptData(junk, key));
});

// --- legacy-fixture helpers (reproduce the pre-R6 encryption exactly) ------

async function deriveKeySignatureForLegacyFixture() {
  return deriveKeyFromSignature('wallet-signature-material-2');
}

async function encryptLikeLegacyFixture(plaintext, key) {
  const encoder = new TextEncoder();
  const legacyKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.slice(0, 32)), // pre-fix key: ASCII of first 32 hex chars
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, legacyKey, encoder.encode(plaintext))
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(encrypted, iv.length);
  return btoa(String.fromCharCode(...combined));
}
