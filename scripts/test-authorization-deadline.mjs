#!/usr/bin/env node
/**
 * R7 regression (THREAT_MODEL_REVIEW.md): authorization signatures used to be
 * replayable indefinitely — the message was `hash(btcAddress:...:Date.now())`
 * with no on-chain freshness check. The message hash is now bound to a
 * deterministic 15-minute window deadline, `Poseidon(btcFelt, windowEnd)`,
 * which the contract recomputes from `block.timestamp` and asserts
 * ('SIG_EXPIRED') before the ECDSA check.
 * Run: node --test scripts/test-authorization-deadline.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash } from 'starknet';
import {
  AUTHORIZATION_WINDOW_SECONDS,
  currentAuthorizationDeadline,
  buildAcousticMessageHash,
  buildAcousticAuthorization,
  isAuthorizationFresh,
} from '../src/lib/sonic-authorization.ts';
import { getAcousticPublicKey, getPublicKeyFromSecret } from '../src/lib/crypto.ts';

const BTC = 'bc1qtest0000deadlinewiring';
const DNA = 'c'.repeat(62);
// A valid felt252 (< CURVE.P): 31 bytes of 0x3a = 248 bits.
const SECRET = BigInt('0x' + '3a'.repeat(31)).toString();

// ---------------------------------------------------------------------------
// Window deadline math — must exactly match the contract's recomputation
// (deadline = end of the 900s window containing `now`)
// ---------------------------------------------------------------------------

test('R7: deadline is the end of the 15-min window containing now', () => {
  assert.equal(currentAuthorizationDeadline(0), AUTHORIZATION_WINDOW_SECONDS);
  assert.equal(currentAuthorizationDeadline(1), AUTHORIZATION_WINDOW_SECONDS);
  assert.equal(
    currentAuthorizationDeadline(AUTHORIZATION_WINDOW_SECONDS * 1000 - 1),
    AUTHORIZATION_WINDOW_SECONDS,
    'last ms of window 0 still ends the same window',
  );
  assert.equal(
    currentAuthorizationDeadline(AUTHORIZATION_WINDOW_SECONDS * 1000),
    AUTHORIZATION_WINDOW_SECONDS * 2,
    'first ms of window 1 rolls to the next deadline',
  );
  assert.equal(
    currentAuthorizationDeadline(1_800_000_000_000),
    Math.floor(1_800_000_000 / AUTHORIZATION_WINDOW_SECONDS + 1) * AUTHORIZATION_WINDOW_SECONDS,
  );
});

test('R7: deadline is always in the future relative to now', () => {
  const nowSec = Math.floor(Date.now() / 1000);
  const deadline = currentAuthorizationDeadline();
  assert.ok(deadline > nowSec, 'deadline must not already have passed');
  assert.ok(
    deadline - nowSec <= AUTHORIZATION_WINDOW_SECONDS,
    'deadline is at most one window away',
  );
});

// ---------------------------------------------------------------------------
// Message hash binding — Poseidon(btcFelt, deadline), recomputable on-chain
// ---------------------------------------------------------------------------

test('R7: message hash is a deterministic function of (btcFelt, deadline)', async () => {
  // Pairing proof (R7): the contract recomputes the deadline binding with
  // corelib's PoseidonTrait sponge. corelib's own golden vector —
  // update(1).update(2).finalize() == 0x0371cb…f0e7 (see
  // contracts/tests/test_poseidon_binding.cairo) — must match this exact JS
  // construction (leading-zero hex normalization aside).
  const golden = 0x0371cb6995ea5e7effcd2e174de264b5b407027a75a231a70c2c8d196107f0e7n;
  assert.equal(BigInt(hash.computePoseidonHashOnElements([1n, 2n])), golden);
  const btcFelt = '12345';
  const deadline = currentAuthorizationDeadline(0);
  const a = buildAcousticMessageHash(btcFelt, deadline);
  const b = buildAcousticMessageHash(btcFelt, deadline);
  assert.equal(a, b);
  // Must equal the exact construction the contract recomputes:
  // poseidon_hash_many([btc_address, deadline]) — starknetjs
  // computePoseidonHashOnElements mirrors Cairo's corelib poseidon_hash_many.
  const expected = hash.computePoseidonHashOnElements([BigInt(btcFelt), BigInt(deadline)]);
  assert.equal(BigInt(a), BigInt(expected));
  assert.match(a, /^0x[0-9a-f]+$/, 'signable msgHash must be hex-encoded');
  // A different deadline (next window) or different guardian must not collide.
  assert.notEqual(a, buildAcousticMessageHash(btcFelt, deadline + AUTHORIZATION_WINDOW_SECONDS));
  assert.notEqual(a, buildAcousticMessageHash('99999', deadline));
});

test('R7: payload carries the deadline and a hash that binds it', async () => {
  const payload = await buildAcousticAuthorization(BTC, DNA, SECRET);
  assert.equal(payload.deadline, currentAuthorizationDeadline());
  assert.equal(
    payload.messageHash,
    buildAcousticMessageHash(payload.btcFelt, payload.deadline),
    'signed hash must commit to the window deadline',
  );
  assert.ok(isAuthorizationFresh(payload));
});

test('R7: legacy (pattern-derived) path signs the same deadline-bound hash', async () => {
  const legacy = await buildAcousticAuthorization(BTC, DNA);
  const decoupled = await buildAcousticAuthorization(BTC, DNA, SECRET);
  // Same guardian identity and window ⇒ same message hash regardless of the
  // signing key — both are verifiable by the same contract check.
  assert.equal(legacy.messageHash, decoupled.messageHash);
  // The legacy signature is made under the pattern-derived key.
  const legacyPub = await getAcousticPublicKey(DNA);
  assert.notEqual(legacyPub, getPublicKeyFromSecret(SECRET));
});

// ---------------------------------------------------------------------------
// Freshness gate
// ---------------------------------------------------------------------------

test('R7: isAuthorizationFresh rejects a payload whose window has passed', async () => {
  const payload = await buildAcousticAuthorization(BTC, DNA, SECRET);
  const stale = { ...payload, deadline: Math.floor(Date.now() / 1000) - 1 };
  assert.equal(isAuthorizationFresh(stale), false);
  // Replay bound: once the signed window rolls over, the contract recomputes
  // the NEXT window's binding — which cannot match the intercepted hash
  // (the deadline is inside the signed hash, so it cannot be extended).
  const nextWindow = payload.deadline + AUTHORIZATION_WINDOW_SECONDS;
  assert.notEqual(
    BigInt(payload.messageHash),
    BigInt(buildAcousticMessageHash(payload.btcFelt, nextWindow)),
  );
});
