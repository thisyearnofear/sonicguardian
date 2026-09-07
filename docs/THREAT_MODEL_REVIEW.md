# M5 Adversarial Review — M3 Recovery Core

> **Status:** Complete (Sept 7, 2026). This is the M5 review of
> [THREAT_MODEL.md](./THREAT_MODEL.md) required before M3 can be called done.
> Method: every claim in the threat model was checked against the current code
> (`shamir.ts`, `recovery-split.ts`, `crypto.ts`, `storage.ts`,
> `sonic-authorization.ts`, `use-acoustic-factor.ts`, `VerifyRouteApp.tsx`,
> `SonicGuardian.tsx`, `dna.ts`, `lib.cairo`), not against the docs.
> Findings below are ranked by severity; accepted findings were incorporated
> into the threat model the same day.

## Findings summary

| # | Severity | Finding |
|---|----------|---------|
| R1 | **Critical (functional)** | Verify-time DNA hashing re-salts randomly — recovery can never succeed in the UI, even with perfect recall |
| R2 | **Critical (security claim)** | Minting device stores the pattern code, device share, and secret digest together — device theft alone is full compromise |
| R3 | **High (analytic error)** | Any single leaked stored share + offline pattern brute-force = full compromise via the public on-chain key oracle |
| R4 | Medium | Legacy key derivation fails open to the degenerate private key `0` |
| R5 | Medium | After cross-device recovery the paper share is persisted without user-facing disclosure |
| R6 | Low | `encryptData` uses only half the derived key material |
| R7 | Low | Intercepted authorization signatures are replayable indefinitely |

---

## R1 — Verify-time hashing is non-reproducible (Critical, functional)

**Evidence:** `VerifyRouteApp.tsx:124` calls `extractSonicDNA(agentResponse.code)`
with no salt. `dna.ts:85` defaults the salt to `crypto.randomUUID()` when the
salt argument is absent, and the DNA hash is `SHA-256(normalizedFeatures + salt)`
(`dna.ts:134-140`). Mint time (`SonicGuardian.tsx:213`) also uses a random salt —
so the salt exists only in the session (`storedSalt`, which is never read
anywhere).

**Impact:** the DNA hash is a function of `(pattern, random salt)`. At verify
time the salt is re-randomized, so the recomputed hash differs from the
mint-time hash **even with perfectly recalled pattern code**. Consequently:

- Legacy guardians: the pattern-derived key never matches the registered key,
  so they are misclassified as *decoupled* and routed into a reconstruction
  path that also can never succeed (wrong pattern share ⇒ wrong secret ⇒
  digest/pubkey check fails). Verification fails closed, always.
- Decoupled guardians: `derivePatternShare(wrongDnaHash)` ≠ mint-time pattern
  share ⇒ local reconstruction fails; paper-share cross-device recovery fails
  identically.

Recovery is therefore unavailable through the UI in all cases. This is an
*availability* failure, not a confidentiality failure (nothing leaks), but it
invalidates the M3 acceptance criterion "pattern loss OR device loss each alone
recoverable" as *shipped*.

**Corroboration:** the agent/MCP API path (`src/app/api/agent/route.ts:20`)
uses a **fixed** salt string (`'sonic-guardian-salt'`) — i.e., the intended
design is deterministic hashing; the UI path diverges from it. (Note the API
hash is also computed over a different input normalization than
`extractSonicDNA`, so the two hash namespaces don't match either.)

**Recommendation (fix before any further feature work):**
1. Default `extractSonicDNA`'s salt to a fixed domain-separation constant
   (e.g. `sonic-guardian:dna:v1`) so the hash is a pure function of the
   pattern; keep the salt parameter for tests. Salting protects against
   precomputed-table attacks; here the input is already high-entropy pattern
   material and the *reproducibility* requirement dominates. Where a session
   exists, pass `storedSalt` for continuity.
2. Document that real-AI vibe mode (`useRealAI=true`) remains non-reproducible
   by construction (LLM output varies) — verify mode must require the
   deterministic path or an exact-code entry path.
3. Add a UI-level integration test that mints via the components' code path,
   "recalls" the exact pattern on a fresh session, and recovers — the current
   E2E script tests the lib functions with a fixed hash and cannot catch R1.

**Fixed (Sept 7, 2026):** `DEFAULT_DNA_SALT = 'sonic-guardian:dna:v1'` is now
the default in `extractSonicDNA` (salt parameter retained for tests and the
continuity path). `VerifyRouteApp` passes the session's `storedSalt` when the
local session belongs to the guardian being verified, so pre-fix guardians
still verify on their minting device; all other paths use the deterministic
default. Regression tests added to `scripts/test-recovery-e2e.mjs` (salt-less
mint extract → split → salt-less fresh-device verify extract → recovery via
on-chain key; determinism; legacy-salt continuity) — `test:unit` 30/30.
Pre-fix guardians remain cross-device-broken (their random salt is unrecoverable
outside the minting session); re-mint is the migration path. Item 2 documented
in THREAT_MODEL.md; a component-rendered integration test remains open but the
wiring-level regression now covers the failure mode.

## R2 — The minting device stores both factors (Critical, security claim)

**Evidence:** `SonicGuardian.tsx:220` persists the **entire generated pattern
code** in the session (`secretPrompt: code`), alongside the device share and
secret digest (`SonicGuardian.tsx:303-307`). Successful recoveries append the
recovery prompt to `recoveryAttempts` in the same store
(`VerifyRouteApp.tsx:210`, `storage.ts:73-90`). `storage.ts` keeps all of this
in plaintext `localStorage` under one key.

**Impact:** the threat model's core claim — "device share theft ⇒ one share,
cannot reconstruct" — is false **as implemented**. From a single device
compromise (XSS, device seizure, backup sync) an attacker obtains:
the pattern code (+ salt) → DNA hash → pattern share; the device share;
the secret digest. Two shares ⇒ the acoustic secret ⇒ the on-chain key.
The pattern share is "never stored" as a *share*, but its complete derivation
input is stored in the same storage bucket. Factor separation exists in the
crypto but not in the storage.

**Recommendation:**
1. Stop persisting the pattern code after mint. It is the user's memorized
   secret — persisting it defeats the factor model. Keep only what the UI
   needs for display (e.g. a truncated preview) or nothing.
2. Purge/truncate `recoveryAttempts` prompts (store success + timestamp, not
   the prompt material).
3. Consider encrypting the device share at rest (e.g. AES-GCM under a
   non-extractable WebCrypto key or the wallet-derived key already available)
   as defense-in-depth for devices that cannot avoid persistence.
4. If the product wants a "recover on this device without retyping"
   convenience, make it an explicit opt-in with copy stating that the device
   then holds both factors.

**Fixed (Sept 7, 2026):** `createSession` now takes
`(storedSalt, btcAddress?, blinding?)` — the pattern code and DNA hash are
never passed to, or stored by, the persistence layer (the generated code
lives in React state for the page session only). `addRecoveryAttempt(success)`
stores a success flag + timestamp only. A `sanitizeLegacySession` pass in
`getCurrentSession` strips `secretPrompt`/`storedHash`/attempt prompts from
pre-fix sessions and re-persists them clean, so existing users are migrated
on first read. Regression tests: `scripts/test-session-hygiene.mjs` (no
pattern material persisted; attempt records carry only success+timestamp;
legacy sanitization; writes after a legacy read stay clean) — `test:unit`
34/34. Residual per R3: the device share + secret digest remain a
self-contained offline oracle for pattern guesses; item 3 (share encryption
at rest) is the follow-up that closes it. **Since closed — see R3 below.**

## R3 — Single leaked share + offline pattern brute-force is full compromise (High, analytic)

**Evidence:** `recoverFromSharesByPubKey` (`recovery-split.ts:110-127`)
implements exactly the oracle an attacker needs: combine two shares → derive
candidate secret → `getPublicKeyFromSecret` → compare with the **public**
on-chain key. The pattern share is a pure function of the DNA hash
(`derivePatternShare`, `recovery-split.ts:44-56`), and the pattern space is
small (DIRECTION.md: curated library ≈ 4.7 bits, simple vibe ≈ 40 bits, rich
custom melody ≈ 89 bits).

**Impact:** the threat-model rows for "Device share" and "Paper share" claim
the attacker "cannot distinguish a correct guess offline." That is wrong once
*any* stored share leaks: for each candidate pattern the attacker derives the
pattern share, combines it with the leaked share, and checks the resulting
secret against the public key. Per-guess cost ≈ two SHA-256s + one Lagrange
combine + one EC public-key derivation (~10²–10⁵ ops-dependent; ~100 µs in
JS, orders faster on GPU/ASIC). 4.7-bit library patterns: instant. 40-bit
vibes: days on one machine, trivial for a determined attacker. 89-bit custom
melodies: infeasible.

So the *effective* security of the 2-of-3 scheme is
**min(pattern entropy, ~250 bits) whenever one stored share leaks** — not
"any one factor alone is safe regardless of pattern entropy." This nuances
DIRECTION.md's re-rank rationale ("low-entropy pattern is perfectly acceptable
as a Shamir factor"): true for factor *independence at rest*, false in the
stored-share-leak scenario, which is the most likely real-world compromise
(devices leak far more readily than memorized patterns).

**Recommendation:** document the corrected analysis (done in this review's
incorporation of THREAT_MODEL.md); re-connect the M4 entropy guidance to this
scenario (the warning banner is now again load-bearing when a share leaks);
prioritize R2's storage fix, which removes the most common leak path.

**Hardened (Sept 7, 2026):** the device share is now encrypted at rest under
a non-extractable AES-256-GCM wrapping key persisted in IndexedDB
(`src/lib/share-crypto.ts`, `SGE1` envelope, fresh IV per encryption; legacy
plaintext shares are migrated on first mount). Encrypt-on-write covers mint
and paper-share promotion; decrypt-on-read fails closed to null, which routes
to the paper-share path — so losing the wrapping key is survivable by design.
The self-contained at-rest oracle is closed for passive exfiltration.
Residuals (documented in THREAT_MODEL.md): an **active XSS** on a live
session can still load the key from IndexedDB and call `subtle.decrypt` —
non-extractability prevents key *export*, not key *use* by same-origin code —
and full-profile forensics may recover key material at rest depending on the
browser. The `secretDigest` stays plaintext: useless for pattern brute-force
without share bytes (the secret is ~250 bits of CSPRNG output). Regression
tests: `scripts/test-share-crypto.mjs` (roundtrip, no plaintext leakage,
random IVs, non-extractability, legacy passthrough, key-loss fail-closed,
degradation policy, migration idempotency) — `test:unit` 41/41.

## R4 — Legacy derivation fails open to key `0` (Medium)

**Evidence:** `pedersenSync` (`crypto.ts:26-40`) catches any
`crypto.subtle` failure and returns `"0"`; `hexToFelt` (`crypto.ts:206-216`)
has the same catch-fallback. `safeHexToFelt` feeds this into legacy private-key
derivation.

**Impact:** in a degraded environment the legacy path could silently derive
the degenerate key `0` for registration or signing. Starknet's EC layer will
likely reject key `0`, but a fail-open constant in key derivation is a latent
footgun, and `getAcousticPublicKey("...")` returning a deterministic value
derived from `0` would be a predictable (registrable) key.

**Recommendation:** throw on crypto failure in `pedersenSync`/`hexToFelt`
(fail closed); keep the legacy path for reading pre-decoupling guardians but
never derive new keys from a fallback constant. One-line fix, legacy-only
blast radius.

**Fixed (Sept 7, 2026):** `pedersenSync` and `hexToFelt` now throw on
`crypto.subtle` failure and invalid hex respectively (fail closed), and
`safeHexToFelt` explicitly rejects a derived felt of `0` — the legacy path
can no longer register or sign under a predictable constant. Callers were
audited: every production call site feeds valid hex (SHA-256 digests, ECDSA
r/s, blinding hex), and the two paths where a throw is newly possible
(`VerifyRouteApp`'s legacy classification, `verifyAcousticProof`) already
fail closed via surrounding error handling. The fix also surfaced a latent
bug: `extractSonicDNA` passed the raw (non-hex) salt string through
`hexToFelt`, so the fail-open catch had **always** zeroed the salt term —
every historical DNA commitment was `pedersen(hashPrefix, 0)`. The salt term
is now derived deterministically as a 128-bit hex value (SHA-256 of the
salt); changing it is safe because nothing consumes the returned commitment
(on-chain registration computes its own from dnaHash + blinding).
Regression tests: `scripts/test-crypto-hardening.mjs` (invalid-input
rejection; fail-closed under a broken `crypto.subtle`; recovery after the
fault clears).

## R5 — Paper-share persistence after cross-device recovery is silent (Medium, UX)

**Evidence:** `use-acoustic-factor.ts:106-110` persists the submitted paper
share as this device's share (plus digest) with no user-facing disclosure
beyond the recovery success message.

**Impact:** the user believes the paper share remains offline-only; it is now
in a browser's localStorage. Combined with R3, that device becomes a
"single-share + offline-oracle" holder. Threat model already documents the
design intent; the *disclosure* is missing (flagged pre-review as a UX item).

**Recommendation:** explicit copy at recovery time ("this share is now stored
on this device — clear the session to return it to paper-only custody") and a
persistent indicator while the promoted share exists. Fold into the phishing /
second-factor UX copy work already flagged for M5.

**Fixed (Sept 7, 2026):** `submitPaperShare` now stamps
`paperSharePromotedAt` on the session (timestamp only — no share material;
preserved across the sanitizer's read-back pass). A persistent custody
notice (`PromotedShareNotice`) renders in the verify flow's second-factor
AND success states — the success placement matters because the recovery
card unmounts the moment authorization completes, which is exactly when
the disclosure must be visible. The notice carries the recommended copy
("stored on this device … no longer offline-only … clearing the session
returns it to paper-only custody") plus a working "Clear this device's
copy" affordance (`clearSession` previously had no UI callers). Note:
promotion only occurs on devices that already hold a session
(`updateSession` no-ops otherwise), so a fresh device recovering from
paper never silently acquires a copy in the first place.
Regression tests: `scripts/test-session-hygiene.mjs` (promotion metadata
round-trips through sanitizer reads; timestamp-only, no share material;
mint-time sessions carry no flag; `clearSession` restores paper-only
custody).

## R6 — `encryptData` uses half the key material (Low)

**Evidence:** `crypto.ts:100-117` derives the AES-GCM key from
`keyStr.slice(0, 32)` — for the 64-hex-char digest produced by
`deriveKeyFromSignature` that is 32 *characters* (128 bits of a 256-bit
digest), used as ASCII key bytes.

**Impact:** the IPFS backup encryption strength is halved by construction.
IPFS backup is explicitly out of scope in the threat model, so this is noted
for hygiene, not as an M3 claim violation.

**Recommendation:** one-line fix: decode the full hex digest to 32 raw bytes
and import that as the key.

**Fixed (Sept 7, 2026):** `encryptData`/`decryptData` now decode the full
64-hex digest to 32 raw key bytes (full 256-bit key); non-hex key strings
are SHA-256 hashed so no input material is silently truncated.
Backwards compatibility: `decryptData` retries once with the legacy
`slice(0, 32)` ASCII key derivation, so IPFS backups encrypted before the
fix remain readable while wrong keys still fail authentication.
Regression tests: `scripts/test-crypto-hardening.mjs` (tail bytes are
load-bearing — digests sharing their first 32 hex chars no longer
interchange keys; a pre-fix legacy-fixture ciphertext still decrypts;
corrupt ciphertext fails under both derivations).

## R7 — Authorization signatures replayable indefinitely (Low)

**Evidence:** `lib.cairo:120-138` verifies the ECDSA signature and emits
`AcousticAuthorized`; the message is `hash(btcAddress:sonic-recovery:Date.now())`
(`sonic-authorization.ts:14-18`) but the contract has no freshness check or
nonce store.

**Impact:** an intercepted `(message_hash, signature)` pair can be replayed
forever to re-emit the authorization event. The effect is limited to a
public event (no transfers), and the message cannot be re-targeted to a
different BTC address — but the residual in the threat model should say
"indefinite replay" rather than implying single-use.**Recommendation:** document (done); if the authorization event ever gates
fund movement, add a deadline encoded in the message and checked by the contract.

**Fixed (Sept 7, 2026, contract v1.4.0-replay-bound):** both deadline parts
shipped. The message hash is now `Poseidon(btcFelt, windowDeadline)` —
`windowDeadline` is the end of the current 15-minute window
(`AUTHORIZATION_WINDOW_SECONDS`, `currentAuthorizationDeadline()`), computed
identically on both sides: starknetjs `computePoseidonHashOnElements` client-side,
corelib `PoseidonTrait::new().update(btc).update(deadline).finalize()` in the
contract, recomputed from `block.timestamp`. The contract asserts the binding
('SIG_EXPIRED') before the ECDSA check — an intercepted pair is replayable
only until its window closes, and the deadline cannot be extended because it
is inside the signed hash. No interface change: `recovery_helper` and the
STRK20 calldata path are untouched. Design notes:
- Poseidon (not SHA-256) is required because the contract must recompute the
  hash; a SHA-256 message hash is unenforceable on-chain.
- The pairing was verified source-level (absorb-pairs +1-finalize are
  identical in @scure/starknet and corelib) and against corelib's own golden
  vector; the executable JS-side check lives in
  `scripts/test-authorization-deadline.mjs`, the Cairo-side vectors in
  `contracts/tests/test_poseidon_binding.cairo` (needs snforge to run).
- The previously divergent second message construction
  (`${btcAddress}:${Date.now()}` in `use-starknet-guardian`) was unified into
  `buildAcousticAuthorization`; `isAuthorizationFresh` fails fast client-side
  if the window rolls between signing and sending.
- Residual: within an open window, an intercepted pair can still be re-emitted
  (≤ 15 min, event-only impact); single-use semantics would need a nonce
  store. Old (pre-v1.4.0) contract deployments keep the old behavior — client
  and contract must deploy in lockstep. Lockstep caveat: the JS↔Cairo Poseidon
  pairing is pinned by tests, but the full authorize flow against a live
  chain has not been exercised locally (no devnet run in this session).

---

## Claims that survive review

- The anchored-share construction and threshold-2 determinism are implemented
  as described (`splitSecretFromAnchor`, tested).
- Corrupted/forged shares fail closed (digest + pubkey authentication).
- On-chain data alone reveals nothing about the pattern or secret; key
  decoupling does make the registered key independent of pattern entropy
  *for the on-chain attack surface specifically*.
- The "two factors under duress" and "no approximate recall" non-claims are
  accurate.

## Verdict

M3's crypto core is sound; the threat model as *written* overstates two
properties (device/paper-share rows) and missed one class of attack
(R3), and the *implementation* breaks the availability claim outright (R1)
and the factor-separation claim at rest (R2). M3 cannot be called complete
until R1 and R2 are fixed; R3 requires doc + guidance corrections (done) and
informs the priority of R2.
