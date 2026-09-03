#!/usr/bin/env node
/**
 * Tests for src/lib/recovery-split.ts (DIRECTION.md M3 UX wiring)
 * Run: node --test scripts/test-recovery-split.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRecoverySplit,
  recoverFromShares,
  derivePatternShare,
  feltToBytes,
  bytesToFelt,
  RECOVERY_SHARE_INDEXES,
} from '../src/lib/recovery-split.ts';

const DNA_HASH = 'a'.repeat(64);
const OTHER_DNA_HASH = 'b'.repeat(64);

async function makeSplit() {
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', secret))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  return { secret, digest, split: await createRecoverySplit(secret, DNA_HASH) };
}

test('any two of pattern/device/paper reconstruct the secret', async () => {
  const { digest, split } = await makeSplit();
  const combos = [
    [split.patternShare, split.deviceShare],
    [split.patternShare, split.paperShare],
    [split.deviceShare, split.paperShare],
  ];
  for (const combo of combos) {
    const secret = await recoverFromShares(combo, digest);
    assert.ok(secret, `combo ${combo} should reconstruct`);
    assert.equal(secret.length, 32);
  }
});

test('wrong pattern (different DNA hash) fails verification, returns null', async () => {
  const { digest, split } = await makeSplit();
  const wrongPattern = serialize(await derivePatternShare(OTHER_DNA_HASH, 32));
  assert.equal(await recoverFromShares([wrongPattern, split.deviceShare], digest), null);
  assert.equal(await recoverFromShares([wrongPattern, split.paperShare], digest), null);
});

test('a single share reveals nothing (cannot pass threshold)', async () => {
  const { digest, split } = await makeSplit();
  assert.equal(await recoverFromShares([split.deviceShare], digest), null);
  assert.equal(await recoverFromShares([split.patternShare], digest), null);
});

test('corrupted share fails verification', async () => {
  const { digest, split } = await makeSplit();
  const parsed = split.paperShare.split(':');
  // Flip the last base64 character of the share payload
  const b64 = parsed[2];
  const flipped = (b64[0] === 'A' ? 'B' : 'A') + b64.slice(1);
  assert.equal(await recoverFromShares([split.deviceShare, `${parsed[0]}:${parsed[1]}:${flipped}`], digest), null);
});

test('split is deterministic: same secret + same pattern yield same shares', async () => {
  const { secret } = await makeSplit();
  const s1 = await createRecoverySplit(secret, DNA_HASH);
  const s2 = await createRecoverySplit(secret, DNA_HASH);
  assert.equal(s1.deviceShare, s2.deviceShare);
  assert.equal(s1.paperShare, s2.paperShare);
  assert.equal(s1.patternShare, s2.patternShare);
});

test('felt <-> bytes roundtrip preserves key material', () => {
  const felt = '361850278866613110698659328152149712042855817968995380300097467744375642639';
  assert.equal(bytesToFelt(feltToBytes(felt)), felt);
});

test('share indexes are as documented', () => {
  assert.deepEqual(RECOVERY_SHARE_INDEXES, { pattern: 1, device: 2, paper: 3 });
});

function serialize(share) {
  return import('../src/lib/shamir.ts').then((m) => m.serializeShare(share));
}
