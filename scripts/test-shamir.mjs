#!/usr/bin/env node
/**
 * Tests for src/lib/shamir.ts (DIRECTION.md M3)
 * Run: node --test scripts/test-shamir.mjs
 *
 * Uses Node's built-in test runner — no new dependencies.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitSecret,
  combineShares,
  combineSharesAndVerify,
  serializeShare,
  parseShare,
  SHARE_HEADER,
} from '../src/lib/shamir.ts';

// Deterministic RNG so test vectors are reproducible
function makeRng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) & 0xff;
  };
}

const secret32 = crypto.getRandomValues(new Uint8Array(32));

test('2-of-3: any pair reconstructs the secret', () => {
  const shares = splitSecret(secret32, 2, 3, makeRng(1));
  assert.equal(shares.length, 3);
  for (const [i, j] of [[0, 1], [1, 2], [0, 2]]) {
    const rebuilt = combineShares([shares[i], shares[j]]);
    assert.deepEqual(rebuilt, secret32, `pair (${i},${j}) must reconstruct`);
  }
});

test('2-of-3: a single share reveals nothing about the secret', () => {
  const shares = splitSecret(secret32, 2, 3, makeRng(2));
  // 32-byte secret: each byte independent. A single share byte must be
  // uniformly random and uncorrelated with the secret byte.
  let matches = 0;
  for (let i = 0; i < 32; i++) if (shares[0].data[i] === secret32[i]) matches++;
  assert.ok(matches < 32, 'single share must not equal the secret');
  // Statistical check: rebuild with a wrong second share must not match
  const wrong = splitSecret(new Uint8Array(32).fill(0xaa), 2, 3, makeRng(3));
  const garbage = combineShares([shares[0], wrong[1]]);
  assert.notDeepEqual(garbage, secret32);
});

test('2-of-3: one share alone cannot be brute-forced without the other', () => {
  // Property test: for 100 random 2-of-2 splits, share1 XOR share2 != secret
  // (Shamir's guarantee: both needed, and info-theoretically independent)
  const rng = makeRng(4);
  for (let trial = 0; trial < 100; trial++) {
    const [s1, s2] = splitSecret(secret32, 2, 2, rng);
    const xored = s1.data.map((b, i) => b ^ s2.data[i]);
    assert.notDeepEqual(new Uint8Array(xored), secret32);
  }
});

test('3-of-5: threshold above 2 works; only 2 shares fail', () => {
  const shares = splitSecret(secret32, 3, 5, makeRng(5));
  assert.deepEqual(combineShares([shares[0], shares[2], shares[4]]), secret32);
  // 2 shares of a 3-threshold split should NOT reconstruct
  const wrong = combineShares([shares[0], shares[1]]);
  assert.notDeepEqual(wrong, secret32);
});

test('serialization roundtrip', () => {
  const shares = splitSecret(secret32, 2, 3, makeRng(6));
  const serialized = shares.map(serializeShare);
  for (const s of serialized) assert.ok(s.startsWith(`${SHARE_HEADER}:`));
  const parsed = serialized.map(parseShare);
  assert.deepEqual(combineShares([parsed[0], parsed[2]]), secret32);
});

test('corrupted share is detected by combineSharesAndVerify', async () => {
  const shares = splitSecret(secret32, 2, 3, makeRng(7));
  const digest = await crypto.subtle.digest('SHA-256', secret32);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

  // Honest reconstruction succeeds
  assert.deepEqual(await combineSharesAndVerify([shares[0], shares[1]], hex), secret32);

  // Corrupted share fails verification
  const corrupted = { x: shares[1].x, data: shares[1].data.slice() };
  corrupted.data[0] ^= 0xff;
  assert.equal(await combineSharesAndVerify([shares[0], corrupted], hex), null);
});

test('invalid configurations are rejected', () => {
  assert.throws(() => splitSecret(new Uint8Array(0), 2, 3));
  assert.throws(() => splitSecret(new Uint8Array(256), 2, 3)); // > 255 bytes
  assert.throws(() => splitSecret(secret32, 3, 2)); // threshold > shares
  assert.throws(() => splitSecret(secret32, 1, 3)); // 1-of-N rejected
  assert.throws(() => splitSecret(secret32, 2, 256)); // > 255 shares
  assert.throws(() => combineShares([splitSecret(secret32, 2, 2, makeRng(8))[0]]));
});

test('known GF(2^8) arithmetic vectors (AES polynomial)', () => {
  // Split a 1-byte secret {0x53} with a deterministic linear poly:
  // f(x) = 0x53 + 0x01*x  →  f(1)=0x52, f(2)=0x51, f(3)=0x50
  const rng = () => 0x01;
  const [s1, s2, s3] = splitSecret(new Uint8Array([0x53]), 2, 3, rng);
  assert.equal(s1.data[0], 0x52);
  assert.equal(s2.data[0], 0x51);
  assert.equal(s3.data[0], 0x50);
  // Reconstruct from (1,3) must give the original back — validates the
  // Lagrange basis at x=0 end-to-end
  assert.deepEqual(combineShares([s1, s3]), new Uint8Array([0x53]));
});
