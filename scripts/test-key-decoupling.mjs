#!/usr/bin/env node
/**
 * Tests for the M3 key-decoupling path (DIRECTION.md):
 * the on-chain acoustic key comes from a RANDOM secret split 2-of-3,
 * not from the pattern. Run: node --test scripts/test-key-decoupling.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ec } from 'starknet';
import {
  generateAcousticSecret,
  getPublicKeyFromSecret,
  signWithSecret,
  getAcousticPublicKey,
} from '../src/lib/crypto.ts';
import { createRecoverySplit, recoverFromShares } from '../src/lib/recovery-split.ts';

// 248-bit hash so the legacy KDF stays within the curve order
const DNA_HASH = 'c'.repeat(62);

// Stark curve order: n = 2^251 + 17*2^192 + 1
const CURVE_ORDER = 2n ** 251n + 17n * 2n ** 192n + 1n;

test('generateAcousticSecret returns a uniform random felt within [1, n-1]', () => {
  for (let i = 0; i < 50; i++) {
    const secret = BigInt(generateAcousticSecret());
    assert.ok(secret > 0n && secret < CURVE_ORDER);
  }
});

test('generated secrets are distinct (no reuse across mints)', () => {
  const seen = new Set(Array.from({ length: 100 }, () => generateAcousticSecret()));
  assert.equal(seen.size, 100);
});

test('signWithSecret verifies against the public key derived from the same secret', () => {
  const secret = generateAcousticSecret();
  const pubKey = getPublicKeyFromSecret(secret);
  // 248-bit message hash — must stay below the Stark curve order (~251 bits)
  const msgHash = '0x' + 'ab'.repeat(31);
  const sig = signWithSecret(secret, msgHash);
  // local (scure) verify requires the compressed form of the key;
  // the on-chain bare-x form is what getPublicKeyFromSecret returns
  const compressed = '0x' + Buffer.from(
    ec.starkCurve.getPublicKey('0x' + BigInt(secret).toString(16).padStart(64, '0'), true),
  ).toString('hex');
  assert.ok(ec.starkCurve.verify(sig, msgHash, compressed));
  // wrong key fails
  const otherSecret = generateAcousticSecret();
  const otherCompressed = '0x' + Buffer.from(
    ec.starkCurve.getPublicKey('0x' + BigInt(otherSecret).toString(16).padStart(64, '0'), true),
  ).toString('hex');
  assert.ok(!ec.starkCurve.verify(sig, msgHash, otherCompressed));
});

test('decoupled: on-chain key from a random secret never equals the pattern-derived key', async () => {
  const secret = generateAcousticSecret();
  const decoupledKey = getPublicKeyFromSecret(secret);
  const legacyKey = await getAcousticPublicKey(DNA_HASH);
  assert.notEqual(decoupledKey.toLowerCase(), legacyKey.toLowerCase());
});

test('end-to-end: split a random secret, reconstruct from pattern+device, keys match', async () => {
  const secret = generateAcousticSecret();
  const secretBytes = new Uint8Array(
    BigInt(secret).toString(16).padStart(64, '0').match(/../g).map((h) => parseInt(h, 16)),
  );
  const split = await createRecoverySplit(secretBytes, DNA_HASH);
  const recovered = await recoverFromShares(
    [split.patternShare, split.deviceShare],
    split.secretDigest,
  );
  assert.ok(recovered, 'pattern+device should reconstruct and verify');
  assert.equal(
    getPublicKeyFromSecret(BigInt('0x' + [...recovered].map((b) => b.toString(16).padStart(2, '0')).join('')).toString()),
    getPublicKeyFromSecret(secret),
  );
});
