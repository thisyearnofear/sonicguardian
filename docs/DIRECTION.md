# Project Direction — Narrowed Focus: Recovery Core

> **Status:** Active direction (Sept 2026). This document supersedes the broader
> "sonic identity protocol" framing used during the hackathon. Everything else in
> these docs describes how the current build works; this document describes what
> the project is *for* and what must be true before it can be legitimately useful.

## The thesis (narrowed)

The only genuinely valuable core of this project is:

> **A musical pattern a human can memorize is one of the few high-entropy artifacts
> humans can recall deeply and reliably. Could it serve as one *factor* in Bitcoin
> wallet recovery?**

Everything else — on-chain gifts, STRK20 pools, authorship provenance, sonic
identity as a brand — is deferred until this core is trustworthy.

**Important repositioning:** the pattern is a *factor*, not *the* wallet key.
It is combined with Shamir secret sharing or a fuzzy extractor so that the
pattern alone can never drain funds, and losing the pattern alone never loses
funds. This also neutralizes the low-entropy attack (see below).

## Known limitations of the current build (honest list)

These are the two problems that make the current architecture a demo rather
than a product. They are the project's highest-value open problems.

### 1. Entropy is unanalyzed

A hash of a pattern generated from a common prompt like "dark industrial techno"
has far less effective entropy than 256 bits. If the reachable pattern space is
small (say ~2^40), the DNA hash is brute-forceable — and because the DNA hash
*is* the ECDSA private key, an attacker who brute-forces it gets the signing key
directly. The on-chain blinding factor prevents commitment matching, but not
offline brute-force against the public key.

**Requirement:** the protocol must state, per-user, how many bits of effective
secret the user contributes, and the UX must enforce a minimum (e.g. require
the user to inject ≥128 bits of verified entropy before registration is
permitted).

### 2. Recall is approximate, hashes are exact

Humans misremember one note. Musical memory is approximate; SHA-256 is not.
One wrong note produces a completely different hash, so exact-hash recovery
fails exactly when a human needs it most.

**Requirement:** fuzzily-matched key derivation (see below).

## The path to legitimacy (five commitments)

### 1. Recovery factor, not whole wallet

Combine the memorized pattern with **Shamir Secret Sharing** (or a fuzzy
extractor): the pattern recovers one share; a device/backup holds another.
Imperfect recall doesn't lose funds; low entropy doesn't get you drained alone.

### 2. Fuzzily-matched key derivation — the #1 technical problem

Use secure sketch / fuzzy extractor literature or perceptual-hash-style discrete
representations of melody (pitch-class intervals, rhythm quantization, contour)
so that *near*-recall succeeds. Solving this well is genuinely novel and
publishable. This is where the project's effort goes.

### 3. Entropy math, audited

State explicitly how many bits of effective secret a user must contribute.
Enforce the minimum in the UX. Get the analysis reviewed by someone
adversarial. No mainnet anything before this exists.

### 4. Defer gift / STRK20 / NFT features

They dilute the story and add attack surface to a core that isn't trustworthy
yet. They remain in the codebase and deployed Sepolia contract as completed
hackathon work, but are out of scope for product development.

### 5. Validate with real humans — before more code

The cheapest, highest-information experiment: **can 50 non-musicians recall a
generated pattern after a week?** Measure recall rates and per-note error
distributions — the error distribution directly parameterizes the fuzzy
extractor (its required tolerance is an input, not a guess).

## Roadmap re-rank (Sept 3, 2026 — approved)

The 2-of-3 scheme is shippable independently of the M1/M2 research: a
low-entropy pattern is acceptable **as a Shamir factor** because the device
and paper shares carry the security weight — with one caveat added by the M5
review (below): the moment *one stored share leaks*, the system's effective
security drops to the pattern's entropy, because the public on-chain key is
an offline verification oracle for pattern guesses. Low pattern entropy is a
liability in exactly the stored-share-leak scenario, which is the most likely
real-world compromise. With key decoupling (below),
that is now true *including* the on-chain identity. Therefore:

- **Product track (primary): M3** — Shamir 2-of-3 recovery UX. First task was
  key decoupling (done); remaining: cross-device paper-share recovery, E2E test
  of the full mint→commit→share→recovery loop, and a threat-model doc making
  "pattern as convenience factor" a documented claim.
- **Research track (deprioritized): M1/M2** — recall study and fuzzy extractor
  are now *upgrades*, not gates. The fuzzy extractor parameterizes recovery
  tolerance when we get to it; nothing in the product depends on it today.
- **M4 (entropy)** re-scoped to *guidance, not gating*: the estimator + warning
  banner stay; hard 128-bit blocking is no longer required for the on-chain
  identity because the registered key is random (decoupled).
- **M5 (adversarial review)** unchanged; review M3's threat model first.

### Key decoupling (Sept 3, 2026 — done, client-side, contract unchanged)

Caveat that motivated this: the guardian contract registered
`acoustic_key = getAcousticPublicKey(dnaHash)`, so the pattern remained a
single-factor ~4.7–89-bit secret brute-forceable against the chain.

Fix (Option 1, decoupled): at mint, `generateAcousticSecret()` produces a
uniformly random felt; the on-chain acoustic key is its Starknet public key.
The acoustic secret — random, ≥250 bits — is what gets split 2-of-3, with the
pattern-derived anchored share as one factor. The pattern is now purely a
*reconstruction factor*, never an on-chain attack surface.

- `crypto.ts`: `generateAcousticSecret()`, `getPublicKeyFromSecret()`,
  `signWithSecret()`; legacy `getAcousticPublicKey`/`signWithAcousticKey`/
  `deriveAcousticSecret` retained (and fixed: the decimal felt from the KDF is
  now normalized to hex — the legacy path was silently broken before).
- `SonicGuardian`: mints generate the random secret, register its pubkey, then
  split the secret (not a pattern derivative).
- Recovery: `useAcousticFactor(dnaHash)` reconstructs the secret from
  pattern+device shares; `AcousticFactorCard` reports it upward;
  `PrivateRecoveryPanel`/`authorizeWithAcousticSignature`/
  `buildAcousticAuthorization` sign with the reconstructed secret (legacy
  pattern-derived signing remains as a fallback for pre-decoupling guardians).
- Contract untouched: `register_guardian` and `authorize_with_acoustic_signature`
  semantics are unchanged — only what the client feeds them differs.
- Tests: `scripts/test-key-decoupling.mjs` (5 tests) — randomness, range,
  sign/verify, decoupling property (random key ≠ pattern-derived key), and an
  end-to-end split→reconstruct→same-pubkey roundtrip. `test:unit` is now 20/20.

Known trade-off: authorship is no longer provable from pattern knowledge alone —
verification now requires two shares (e.g. pattern + minting device). The
"prove you made this song" positioning was already deferred (out of scope).

## Milestones

### M3 module note (Sept 3, 2026)

`src/lib/shamir.ts` implements the M3 core: 2-of-N Shamir splitting over
GF(2⁸) with share serialization (`SGS1:<x>:<base64>`) and authenticated
reconstruction (`combineSharesAndVerify` against the secret's SHA-256, since
raw Shamir shares are unauthenticated). The intended composition is:

```
sonic pattern → DNA hash → anchored share #1 (memorized factor)
random acoustic secret ────┘→ split 2-of-N (this is the on-chain key's private key)
device / encrypted backup → share #2 (stored)
…+ optional shares (paper, trusted contact) → share #3..N
```

Neither factor alone is sufficient; loss of either alone is recoverable.

### M3 UX wiring (Sept 3, 2026)

Mint side: on successful on-chain commit, `SonicGuardian` generates a random
acoustic secret (key decoupling) and splits it 2-of-3 via
`src/lib/recovery-split.ts`. Share 1 (pattern) is an
*anchored share* deterministically derived from the DNA hash — never stored;
share 2 (device) is persisted in the session; share 3 (paper) is shown once in
`PaperShareCard` (copy/download, deliberately not persisted). The anchored
split (`splitSecretFromAnchor` in `shamir.ts`) constructs the line through
(0, secret) and the anchor point, so the pattern share can be recomputed at
recovery time. Note: with threshold 2 there is no fresh randomness — the same
(secret, pattern) always yields the same device/paper shares.

Recovery side: `VerifyRouteApp` reads the on-chain acoustic key and compares it
against the pattern-derived key to route legacy vs decoupled guardians.
Decoupled guardians must present a second factor BEFORE any on-chain
authorization: locally, `AcousticFactorCard`/`use-acoustic-factor` re-derive
the pattern share and reconstruct with the device share (digest-authenticated,
pubkey cross-checked); cross-device, the paper-share input reconstructs
pattern+paper and authenticates via `recoverFromSharesByPubKey` against
`get_acoustic_key` — no local digest needed — then persists the share as this
device's share. Authorization then signs with the reconstructed secret.

Follow-ups completed (Sept 6, 2026): cross-device paper-share recovery,
E2E coverage of mint→split→reconstruct→sign including all share pairs and
negative cases (`scripts/test-recovery-e2e.mjs`, `test:unit` 27/27), and the
M3 threat model (`docs/THREAT_MODEL.md`). Also fixed: the verify flow
previously authorized with the legacy pattern-derived signature first, which
would revert on-chain for decoupled guardians — reconstruction now precedes
authorization.

| # | Milestone | Done when | Status |
|---|-----------|-----------|--------|
| M1 | Human recall study designed & run (n=50, 1 week) | Error-distribution data published in `docs/` | 🟡 Protocol written + tooling shipped ([RECALL_STUDY.md](./RECALL_STUDY.md), `scripts/generate-study-materials.mjs`, `scripts/score-recall.mjs`); consent forms + recruitment next. **Research track — deprioritized** |
| M2 | Fuzzy key derivation prototype | Near-recall (≤ tolerance errors) derives same key, no sketch leaks usable secret offline | ⬜ Blocked on M1 tolerance data. **Research track — an upgrade, not a gate** |
| M3 | Shamir 2-of-3 recovery flow | Pattern loss OR device loss each alone recoverable; neither alone sufficient | 🟢 R1 and R2 fixed (Sept 7); R3 at-rest oracle closed by share encryption; R4–R7 all fixed (Sept 7 — R7 = contract v1.4.0 replay bound, needs lockstep deploy) — details in [THREAT_MODEL_REVIEW.md](./THREAT_MODEL_REVIEW.md) |
| M4 | Entropy budget documented & UX-enforced | Per-user entropy estimate shown at registration; < minimum blocked | 🟡 Estimator + warning banner shipped; re-scoped to *guidance, not gating* — the on-chain key is random, so pattern entropy no longer gates on-chain safety |
| M5 | Adversarial review of M1–M4 | Written review incorporated | 🟢 Internal review of the M3 threat model done (Sept 7, [THREAT_MODEL_REVIEW.md](./THREAT_MODEL_REVIEW.md)); all findings R1–R7 fixed and incorporated into [THREAT_MODEL.md](./THREAT_MODEL.md); remaining: optional external pass |

M4 (entropy documentation) can and should start immediately — it's cheap and
shapes everything else. **Started Sept 3, 2026:** modelled estimator live with
honest numbers (curated library ≈ 4.7 bits, simple "techno" vibe ≈ 40 bits,
rich custom melody ≈ 89 bits — all below the 128-bit minimum, confirming the
analysis in this doc).

## Out of scope (for now)

- On-chain gifts / escrow (`create_onchain_gift`, `claim_onchain_gift`)
- STRK20 pool integration as a product feature
- Authorship-provenance positioning ("prove you made this song")
- Mainnet deployment of anything new

These are revisit-after-M5.

## M5 review findings (Sept 7, 2026)

The full review is [THREAT_MODEL_REVIEW.md](./THREAT_MODEL_REVIEW.md); claim
verification was done against code, not docs. Accepted findings, ranked:

- **R1 (critical, functional) — FIXED Sept 7:** verify-time DNA extraction
  re-salted randomly (`extractSonicDNA` default salt was `crypto.randomUUID()`),
  so the recomputed hash never matched the mint-time hash — **UI recovery
  failed even with perfect recall**, for legacy and decoupled guardians alike.
  Fix: deterministic domain salt default (`sonic-guardian:dna:v1`); the verify
  flow passes the session's stored salt for pre-fix guardians on their minting
  device. Regression tests in `scripts/test-recovery-e2e.mjs` (30/30) now
  exercise the salt-less mint→verify wiring that would have caught this.
  Pre-fix guardians verify only on the minting device; re-mint restores
  cross-device recovery.
- **R2 (critical, security claim) — FIXED Sept 7:** the minting device's
  session stored the full pattern code, device share, and secret digest
  together — device theft alone was full compromise. Fix: the persistence
  layer no longer accepts or stores pattern material (code, DNA hash,
  recovery prompts); legacy sessions are sanitized on first read. Regression
  tests in `scripts/test-session-hygiene.mjs` (34/34). Residual: the device
  share + digest remain a self-contained offline oracle for pattern guesses
  (R3 class) — encrypting the share at rest is the follow-up that closes it.
- **R3 (high, analytic):** any single leaked stored share + offline pattern
  brute-force = full compromise via the public on-chain key oracle. Effective
  security is `min(pattern entropy, ~250 bits)` when one share leaks. Doc and
  guidance amended accordingly; raises the priority of R2.
- **R4 (medium) — FIXED Sept 7:** legacy key derivation failed open to the
  degenerate key `0` when `crypto.subtle` broke or inputs were invalid. Fix:
  `pedersenSync`/`hexToFelt` throw (fail closed) and `safeHexToFelt` rejects a
  derived felt of `0`. The fix surfaced a latent bug: `extractSonicDNA`'s salt
  term had *always* silently evaluated to `0` (non-hex salt through the old
  catch); the commitment is now derived deterministically from 128-bit hex
  terms. Regression tests in `scripts/test-crypto-hardening.mjs`.
- **R5 (medium, UX) — FIXED Sept 7:** paper-share persistence after
  cross-device recovery is now disclosed: the session records
  `paperSharePromotedAt` and a persistent custody notice (with a
  clear-device-copy affordance) shows in the verify flow's second-factor and
  success states. Regression tests in `scripts/test-session-hygiene.mjs`.
- **R6 (low) — FIXED Sept 7:** `encryptData` used only the first 32 ASCII
  characters of a 64-hex digest (128 of 256 bits). Fix: the full digest is
  decoded to 32 raw key bytes; non-hex keys are SHA-256 hashed; `decryptData`
  retries legacy-key derivation so pre-fix IPFS backups stay readable.
  Regression tests in `scripts/test-crypto-hardening.mjs`.
- **R7 (low) — FIXED Sept 7 (contract v1.4.0):** authorization signatures
  are now window-bound: message = `Poseidon(btcFelt, end-of-current-15-min-window)`,
  recomputed on-chain from `block.timestamp` ('SIG_EXPIRED'). Replay bounded
  to the window; deadline unforgeable (inside the signed hash); no interface
  change (`recovery_helper` untouched). Residual: within-window replay ≤ 15
  min (event-only); lockstep client/contract deploy required. Tests:
  `scripts/test-authorization-deadline.mjs` + Poseidon pairing vectors in
  `contracts/tests/test_poseidon_binding.cairo`.

**Priority order going forward:** R1 and R2 are fixed (Sept 7, 2026) — M3 is
back to 🟢. The R3 self-contained at-rest oracle is closed by device-share
encryption under a non-extractable wrapping key (`share-crypto.ts`, SGE1
envelope; active-XSS residual documented in the threat model). R4/R6
hardening fixed (Sept 7 — fail-closed legacy derivation, full-entropy backup
keys, paper-share custody disclosure). R7 replay bound shipped (contract
v1.4.0: window-deadline Poseidon message, recomputed on-chain; needs lockstep
deploy). All M5 findings R1–R7 are now fixed. M4
guidance copy should mention
the R3 scenario (pattern entropy is load-bearing whenever a share leaks to
an active attacker). M1/M2 unchanged (research track).
