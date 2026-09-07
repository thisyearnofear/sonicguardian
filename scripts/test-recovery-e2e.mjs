#!/usr/bin/env node
/**
 * End-to-end test of the M3 recovery loop (DIRECTION.md product track):
 * mint → on-chain key registration → 2-of-3 split → recovery → sign.
 *
 * Covers every share pair and the cross-device path where no local digest
 * exists (authentication via the on-chain acoustic public key).
 * Run: node --test scripts/test-recovery-e2e.mjs
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
import {
  createRecoverySplit,
  recoverFromShares,
  recoverFromSharesByPubKey,
  derivePatternShare,
  feltToBytes,
  bytesToFelt,
} from '../src/lib/recovery-split.ts';
import { serializeShare } from '../src/lib/shamir.ts';
import { extractSonicDNA } from '../src/lib/dna.ts';

const DNA_HASH = 'c'.repeat(62);
const OTHER_DNA = 'd'.repeat(62);

/** Simulated mint: random secret, registered pubkey, 2-of-3 split. */
async function mint(dnaHash = DNA_HASH) {
  const secret = generateAcousticSecret();
  const onChainKey = getPublicKeyFromSecret(secret); // registered as acoustic_key
  const split = await createRecoverySplit(feltToBytes(secret), dnaHash);
  return { secret, onChainKey, split };
}

function compressedPub(secretFelt) {
  return '0x' + Buffer.from(
    ec.starkCurve.getPublicKey('0x' + BigInt(secretFelt).toString(16).padStart(64, '0'), true),
  ).toString('hex');
}

test('E2E same-device: mint → pattern+device reconstruct → sign verifies on-chain', async () => {
  const { onChainKey, split } = await mint();

  // Recovery: device share in session + pattern re-derived from verified dnaHash
  const patternShare = serializeShare(await derivePatternShare(DNA_HASH, 32));
  const recovered = await recoverFromShares([patternShare, split.deviceShare], split.secretDigest);
  assert.ok(recovered, 'pattern+device should reconstruct');

  const felt = bytesToFelt(recovered);
  assert.equal(BigInt(getPublicKeyFromSecret(felt)), BigInt(onChainKey));

  // Sign an authorization message with the reconstructed secret
  const msgHash = '0x' + '42'.repeat(31);
  const sig = signWithSecret(felt, msgHash);
  assert.ok(ec.starkCurve.verify(sig, msgHash, compressedPub(felt)));
});

test('E2E cross-device: pattern+paper reconstruct, authenticated by on-chain key only', async () => {
  const { onChainKey, split } = await mint();

  // Fresh browser: no deviceShare, no secretDigest — only the paper share
  // and the on-chain acoustic key to authenticate against.
  const patternShare = serializeShare(await derivePatternShare(DNA_HASH, 32));
  const recovered = await recoverFromSharesByPubKey([patternShare, split.paperShare], onChainKey);
  assert.ok(recovered, 'pattern+paper should reconstruct via pubkey auth');
  assert.equal(BigInt(getPublicKeyFromSecret(bytesToFelt(recovered))), BigInt(onChainKey));
});

test('E2E pattern lost: device+paper reconstructs without the pattern', async () => {
  const { onChainKey, split } = await mint();
  const recovered = await recoverFromSharesByPubKey(
    [split.deviceShare, split.paperShare],
    onChainKey,
  );
  assert.ok(recovered, 'device+paper should reconstruct');
  assert.equal(BigInt(getPublicKeyFromSecret(bytesToFelt(recovered))), BigInt(onChainKey));
});

test('wrong pattern never reconstructs — on any share pair', async () => {
  const { onChainKey, split } = await mint();
  const wrongPattern = serializeShare(await derivePatternShare(OTHER_DNA, 32));

  assert.equal(
    await recoverFromShares([wrongPattern, split.deviceShare], split.secretDigest),
    null,
    'digest auth must reject a wrong pattern',
  );
  assert.equal(
    await recoverFromSharesByPubKey([wrongPattern, split.paperShare], onChainKey),
    null,
    'pubkey auth must reject a wrong pattern',
  );
});

test('a single share is never sufficient', async () => {
  const { onChainKey, split } = await mint();
  for (const share of [split.patternShare, split.deviceShare, split.paperShare]) {
    assert.equal(await recoverFromSharesByPubKey([share], onChainKey), null);
  }
});

test('decoupled guardian is distinguishable from legacy by on-chain key comparison', async () => {
  const { onChainKey } = await mint();
  const legacyKey = await getAcousticPublicKey(DNA_HASH);
  assert.notEqual(BigInt(legacyKey), BigInt(onChainKey));
});

test('malformed and mismatched shares fail closed', async () => {
  const { onChainKey, split } = await mint();
  assert.equal(await recoverFromSharesByPubKey(['not-a-share', split.paperShare], onChainKey), null);
  // Shares from a different identity don't combine to this key
  const other = await mint(OTHER_DNA);
  assert.equal(
    await recoverFromSharesByPubKey([other.split.deviceShare, split.paperShare], onChainKey),
    null,
  );
});

// ---------------------------------------------------------------------------
// R1 regression (THREAT_MODEL_REVIEW.md): verify-time DNA extraction must be
// reproducible. These tests call extractSonicDNA(code) WITHOUT a salt on both
// the mint and verify paths — exactly as SonicGuardian.handleGenerate and
// VerifyRouteApp.handleRecovery do. A per-call random salt here is what made
// UI recovery impossible before the fix.
// ---------------------------------------------------------------------------
const PATTERN_CODE = 'stack(s("bd*4"), s("~ sd ~ sd"), s("hh*16").gain(0.4)).cpm(128)';

test('R1: DNA hash is a pure function of the pattern (deterministic across calls)', async () => {
  const mintDna = await extractSonicDNA(PATTERN_CODE);   // mint path, no salt
  const verifyDna = await extractSonicDNA(PATTERN_CODE); // verify path, no salt
  assert.equal(verifyDna.hash, mintDna.hash, 'same pattern must reproduce the same hash');
  assert.equal(verifyDna.salt, mintDna.salt, 'default salt must be deterministic');
  const otherDna = await extractSonicDNA('s("bd [~ sd] [bd bd] sd")');
  assert.notEqual(otherDna.hash, mintDna.hash, 'different patterns must hash differently');
});

test('R1: explicit-salt continuity reproduces a legacy (pre-fix) mint-time hash', async () => {
  const legacySalt = crypto.randomUUID();
  const a = await extractSonicDNA(PATTERN_CODE, legacySalt);
  const b = await extractSonicDNA(PATTERN_CODE, legacySalt);
  assert.equal(a.hash, b.hash, 'explicit salt must be honored deterministically');
  assert.notEqual(a.hash, (await extractSonicDNA(PATTERN_CODE)).hash, 'legacy salt must not collide with the default');
});

test('R1 full wiring: mint (fresh extract) → split → verify (fresh extract) → recover', async () => {
  // Mint path: the component extracts DNA from the generated code (no salt).
  const mintDna = await extractSonicDNA(PATTERN_CODE);
  const { onChainKey, split } = await mint(mintDna.hash);

  // Verify path on a FRESH device: re-extract from the recalled pattern with
  // no salt and no session — before the fix this produced a different hash
  // and recovery always failed.
  const verifyDna = await extractSonicDNA(PATTERN_CODE);
  assert.equal(verifyDna.hash, mintDna.hash);
  const patternShare = serializeShare(await derivePatternShare(verifyDna.hash, 32));
  const recovered = await recoverFromSharesByPubKey([patternShare, split.paperShare], onChainKey);
  assert.ok(recovered, 'exact recall must recover cross-device');
  assert.equal(BigInt(getPublicKeyFromSecret(bytesToFelt(recovered))), BigInt(onChainKey));
});
