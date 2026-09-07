# Threat Model — M3 Recovery Core

> **Status:** Reviewed (M5 internal adversarial review, Sept 7, 2026 — see
> [THREAT_MODEL_REVIEW.md](./THREAT_MODEL_REVIEW.md); its findings are
> incorporated below). Scope: the 2-of-3 Shamir recovery split with key
> decoupling (Sept 2026). Out of scope: STRK20 pool privacy, IPFS backup
> encryption, mainnet economics.

## Assets and security claims

| Asset | Claim |
|-------|-------|
| Acoustic secret (random felt252, ≥250 bits) | Confidentiality: never stored whole anywhere. Integrity: any reconstruction is authenticated before use. |
| On-chain acoustic key | Availability of *authorization* requires any 2 of {pattern, device, paper}. No single factor authorizes anything. |
| Musical pattern / DNA hash | **Convenience factor only.** Compromise of the pattern alone grants nothing — this is a documented product claim, not an aspiration. |
| Pedersen commitment on-chain | Binding + hiding under standard assumptions; blinding factor never leaves the client. |

## Architecture recap

```
mint:   secret ← CSPRNG (uniform felt252)
        on-chain: acoustic_key = starkPubkey(secret)          ← random, decoupled
        pattern → DNA hash → anchored share (x=1)             ← recomputed, never stored
        device share (x=2) → localStorage session
        paper share  (x=3) → shown once, user-held offline

recover: any 2 shares → Lagrange → secret → authenticate → sign
```

Authentication of reconstruction happens two ways, depending on context:

1. **Digest** (`secretDigest` in the session): SHA-256 of the secret. Fast,
   local, used on the minting device.
2. **On-chain public key**: `getPublicKeyFromSecret(candidate) == get_acoustic_key(felt(btc))`.
   Used when no local digest exists (cross-device paper recovery) and as a
   final cross-check even after digest verification — the digest proves the
   bytes are right; the pubkey proves they belong to *this* guardian.

## Threat matrix

| Compromised | Consequence | Residual protection |
|-------------|-------------|---------------------|
| Pattern (shoulder-surfed, phished, brute-forced) | Attacker holds **one** share. Cannot reconstruct, cannot sign, cannot distinguish a correct guess offline. | Second factor required: device share or paper share. Low pattern entropy is acceptable *by design*. |
| Device share (localStorage theft, XSS, device seizure) | Stored as an `SGE1` envelope, encrypted under a non-extractable AES-GCM wrapping key kept in IndexedDB (R3 hardening): stolen localStorage alone is ciphertext — no offline verification oracle. **Active XSS** on a live session can still load the key from IndexedDB and decrypt (documented limit), and full-profile forensics may recover key material at rest depending on the browser. | XSS hygiene mitigates the active-script case; key loss is survivable (pattern + paper recovers). |
| Paper share (found, photographed) | One share plus the same offline verification oracle: leaked paper share + pattern brute-force = full compromise (R3). | Pattern or device share, same condition. |
| Pattern + device share | **Full compromise** — secret reconstructs, guardian can authorize recovery. | Mitigation: paper share stored separately; user can rotate (re-mint) on suspicion. Documented limit: 2-of-3 means any two factors suffice. |
| Pattern + paper | Full compromise. | The paper backup is the "break glass" path — physical security is the user's responsibility; UX copy must say so. |
| Device + paper, no pattern | Full compromise *of the acoustic key*, but note the attacker cannot produce the pattern — relevant only if a future flow treats pattern-knowledge itself as evidence. Today it does not. | Acceptable: the design treats any two factors as equivalent. |
| On-chain data (commitment + acoustic pubkey) | Public by definition. Reveals nothing about pattern or secret; brute-forcing the pattern space yields at most one unverifiable share — a candidate share can't be checked against the pubkey alone (a pubkey authenticates a *secret*, not a share). | Key decoupling makes this structurally safe regardless of pattern entropy. |

## Attack considerations

- **Forged/corrupted share**: raw Shamir shares are unauthenticated; a bad
  share produces a wrong secret. Caught by digest or pubkey check — fail
  closed (`recoverFromShares` / `recoverFromSharesByPubKey` return null).
  No oracle is exposed: the API and chain only ever see a valid signature or
  a rejected tx.
- **Malicious "help desk" / phishing for two factors**: an attacker who
  convinces a user to type both pattern and paper share into a fake site gets
  everything. Out of scope for code; mitigation is UX copy (the app never asks
  for a second share except in the recovery view) — flagged for M5 review.
- **Replayed authorization**: `authorize_with_acoustic_signature` signs
  `Poseidon(btc_felt, window_deadline)` where the deadline is the end of the
  current 15-minute window (R7, fixed Sept 7, contract v1.4.0). The contract
  recomputes the binding from `block.timestamp` and reverts with 'SIG_EXPIRED'
  for anything signed in an earlier window — an intercepted
  `(message_hash, signature)` pair is replayable **only until its window
  closes**, never indefinitely, and the deadline cannot be extended (it is
  inside the signed hash). Residual: within an open window, an intercepted
  pair can still be re-emitted (≤ 15 min); a nonce store would be needed to
  reach single-use semantics. The on-chain effect is limited to
  re-emitting the `AcousticAuthorized` event, and the signature cannot be
  re-targeted to a different BTC address.
- **Anchored-share determinism**: with threshold 2, `(secret, pattern)` fully
  determines the device/paper shares — re-splitting the same secret with the
  same pattern reproduces identical shares. No fresh randomness exists to
  leak, but a pattern change forces a re-split and **a new mint** (new secret),
  since the shares bind to one secret. Documented UX consequence, not a
  vulnerability.
- **Stored share + offline pattern brute-force (R3)**: any single leaked
  stored share turns the public on-chain key into a verification oracle for
  pattern guesses — derive candidate pattern share, combine, check the
  candidate secret's pubkey against `get_acoustic_key`. Effective security is
  therefore `min(pattern entropy, ~250 bits)` whenever one stored share leaks:
  library patterns (~4.7 bits) fall instantly, simple vibes (~40 bits) fall to
  a determined attacker, rich custom melodies (~89 bits) hold. The M4 entropy
  guidance is load-bearing in exactly this scenario.
- **Session contents (R2 + R3 hardening, fixed Sept 7, 2026)**: the session
  no longer stores the pattern code, the DNA hash, or recovery prompts, and
  the device share is encrypted at rest under a non-extractable AES-GCM
  wrapping key persisted in IndexedDB (`SGE1` envelope; legacy sessions are
  sanitized and migrated on first read). A stolen localStorage therefore
  yields neither factor material nor an offline oracle for pattern guesses.
  Residuals: an active XSS on a live session can still load the key and
  decrypt; the secret digest stays in the clear but is useless without share
  bytes (the secret is ~250 bits of CSPRNG output). Losing the wrapping key
  is survivable by design — pattern + paper share recovers via the
  cross-device path.
- **Session persistence after paper recovery**: on successful cross-device
  recovery the paper share is persisted as this device's share (with the
  now-known digest), encrypted at rest like any device share. This
  intentionally promotes a convenience copy — the user should be aware the
  paper share is now on this device; clearing the session restores paper-only
  custody. Disclosed (R5, Sept 7): the session records
  `paperSharePromotedAt`, and the verify flow shows a persistent custody
  notice (`PromotedShareNotice`) in both the second-factor and success
  states — including a "Clear this device's copy" affordance that deletes
  the session and returns the share to paper-only custody. Promotion only
  occurs on devices that already hold a session (`updateSession` no-ops
  otherwise), so a truly fresh device never silently acquires a copy.
- **Legacy guardians** (pre-decoupling): on-chain key = `KDF(dnaHash)`, so the
  pattern *is* the key and low-entropy patterns are brute-forceable against
  the public key. Detected at verify time (pattern-derived key == registered
  key) and routed to the legacy path. Mitigation: encourage re-mint; flagged
  for M5.

## What this design does NOT claim

- **Approximate recall**: one wrong note → different DNA hash → a different
  (wrong) share. Recovery requires *exact* pattern recall until M2 (fuzzy
  extractor) ships. This is the project's #1 known limitation.
- **Inheritance / dead-man's switch**: no timelock or guardian-party path
  exists; loss of any two factors is unrecoverable.
- **Coercion resistance**: two factors under duress still authorize.
- **On-chain privacy of authorization**: the public path links the authorizing
  tx to the guardian; the STRK20 private path is a separate, deferred feature.
- **Recovery availability**: R1 (verify-time re-salting broke UI recovery
  even with perfect recall) was fixed Sept 7, 2026 — `extractSonicDNA` now
  defaults to a deterministic domain salt, so the hash is a pure function of
  the pattern. Guardians minted before the fix verify only on their minting
  device (via the session's stored salt); cross-device recovery for those
  requires a re-mint. Note: real-AI vibe mode remains non-reproducible by
  construction (LLM output varies); verification requires the deterministic
  path or exact-code entry.
