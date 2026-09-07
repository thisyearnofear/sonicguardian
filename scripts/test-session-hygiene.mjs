#!/usr/bin/env node
/**
 * R2 regression (THREAT_MODEL_REVIEW.md): the persisted session must never
 * contain pattern material — no pattern code, no DNA hash, no recovery
 * prompts — so that device theft yields at most ONE Shamir share plus
 * verification oracles, never both recovery factors outright.
 *
 * storage.ts is DOM-guarded (typeof window/localStorage), so the tests install
 * a minimal localStorage mock before importing the module.
 * Run: node --test scripts/test-session-hygiene.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

// --- localStorage mock (must exist before the storage module is used) ---
const backing = new Map();
globalThis.localStorage = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: (k, v) => backing.set(k, String(v)),
  removeItem: (k) => backing.delete(k),
};
globalThis.window = globalThis; // storage.ts guards on `typeof window`

const { sessionManager, STORAGE_KEY_SESSION } = await import('../src/lib/storage.ts');

// storage.ts persists under its prefixed namespace (STORAGE_PREFIX + key).
const SESSION_STORAGE_KEY = `sonic_${STORAGE_KEY_SESSION}`;
const raw = () => JSON.parse(backing.get(SESSION_STORAGE_KEY));

test('R2: createSession persists no pattern code or DNA hash', () => {
  backing.clear();
  const session = sessionManager.createSession('sonic-guardian:dna:v1', 'bc1qtest0000', '0xblinding');
  assert.ok(session);
  const stored = raw();
  assert.ok(!('secretPrompt' in stored), 'pattern code must not be persisted');
  assert.ok(!('storedHash' in stored), 'DNA hash must not be persisted');
  assert.equal(stored.storedSalt, 'sonic-guardian:dna:v1');
  assert.equal(stored.btcAddress, 'bc1qtest0000');
});

test('R2: recovery attempts store success + timestamp only', () => {
  backing.clear();
  sessionManager.createSession('salt');
  sessionManager.addRecoveryAttempt(true);
  sessionManager.addRecoveryAttempt(false);
  const attempts = raw().recoveryAttempts;
  assert.equal(attempts.length, 2);
  for (const a of attempts) {
    assert.deepEqual(Object.keys(a).sort(), ['id', 'success', 'timestamp']);
  }
  assert.equal(attempts[0].success, true);
  assert.equal(attempts[1].success, false);
});

test('R2: legacy sessions are sanitized on read (code, hash, prompts stripped)', () => {
  backing.clear();
  // A pre-R2 session exactly as the old createSession stored it.
  backing.set(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      id: 'legacy1',
      createdAt: 1,
      lastUsed: 2,
      secretPrompt: 'stack(s("bd*4")).cpm(128) // THE PATTERN CODE',
      storedHash: 'e'.repeat(64),
      storedSalt: 'random-legacy-salt',
      btcAddress: 'bc1qlegacy0000',
      blinding: '0xdeadbeef',
      deviceShare: 'SGS1:2:AAAA',
      secretDigest: 'f'.repeat(64),
      recoveryAttempts: [
        { id: 'a1', timestamp: 3, success: true, prompt: 'dark industrial techno', hash: 'a'.repeat(64) },
      ],
    }),
  );
  const s = sessionManager.getCurrentSession();
  assert.ok(s);
  assert.ok(!('secretPrompt' in s), 'sanitized session must drop the pattern code');
  assert.ok(!('storedHash' in s), 'sanitized session must drop the DNA hash');
  assert.ok(!('prompt' in s.recoveryAttempts[0]), 'sanitized attempts must drop prompts');
  assert.ok(!('hash' in s.recoveryAttempts[0]), 'sanitized attempts must drop hashes');
  // Non-sensitive fields survive the migration.
  assert.equal(s.deviceShare, 'SGS1:2:AAAA');
  assert.equal(s.secretDigest, 'f'.repeat(64));
  assert.equal(s.storedSalt, 'random-legacy-salt');
  assert.equal(s.btcAddress, 'bc1qlegacy0000');
  assert.equal(s.recoveryAttempts[0].success, true);
  // The persisted copy is cleaned too, not just the returned object.
  const stored = raw();
  assert.ok(!('secretPrompt' in stored));
  assert.ok(!('prompt' in stored.recoveryAttempts[0]));
  assert.equal(stored.deviceShare, 'SGS1:2:AAAA');
});

test('R2: writes after a legacy read stay clean (updateSession spreads sanitized state)', () => {
  sessionManager.addRecoveryAttempt(true);
  const stored = raw();
  assert.ok(!('secretPrompt' in stored));
  assert.equal(stored.recoveryAttempts.length, 2); // 1 sanitized + 1 appended
  assert.ok(stored.recoveryAttempts.every((a) => !('prompt' in a)));
});

// ---------------------------------------------------------------------------
// R5 regression (THREAT_MODEL_REVIEW.md): cross-device recovery promotes the
// PAPER share to the device's stored share. The session must record WHEN that
// happened (driving the user-facing custody disclosure) and the metadata must
// carry no share material — it is a timestamp, nothing more.
// ---------------------------------------------------------------------------

test('R5: paper-share promotion metadata round-trips through session reads', () => {
  backing.clear();
  sessionManager.createSession('sonic-guardian:dna:v1', 'bc1qpromote000');
  const promotedAt = 1725688800000;
  const updated = sessionManager.updateSession({
    deviceShare: 'SGE1:iv:ct', // promoted paper share (envelope form)
    secretDigest: 'a'.repeat(64),
    paperSharePromotedAt: promotedAt,
  });
  assert.ok(updated);
  // Read-back must preserve the flag (the sanitizer runs on EVERY read).
  const s = sessionManager.getCurrentSession();
  assert.equal(s?.paperSharePromotedAt, promotedAt);
  assert.equal(raw().paperSharePromotedAt, promotedAt);
});

test('R5: promotion metadata is a timestamp only — no share material', () => {
  const stored = raw();
  assert.equal(typeof stored.paperSharePromotedAt, 'number');
  assert.ok(stored.paperSharePromotedAt > 0);
  // The disclosure data must never duplicate the share or digest.
  assert.ok(!JSON.stringify(stored.paperSharePromotedAt).includes('SGE1'));
});

test('R5: mint-time sessions carry no promotion flag (device share, not paper)', () => {
  backing.clear();
  sessionManager.createSession('sonic-guardian:dna:v1', 'bc1qmint000000');
  const s = sessionManager.getCurrentSession();
  assert.equal(s?.paperSharePromotedAt, undefined);
});

test('R5: clearSession removes the promoted copy (paper-only custody restored)', () => {
  sessionManager.updateSession({ paperSharePromotedAt: Date.now() });
  sessionManager.clearSession();
  assert.equal(sessionManager.getCurrentSession(), null);
  assert.equal(backing.get(SESSION_STORAGE_KEY), undefined);
});
