# Threat Model — M3 Recovery Core

> **Status:** Draft for M5 adversarial review. Scope: the 2-of-3 Shamir
> recovery split with key decoupling (Sept 2026). Out of scope: STRK20 pool
> privacy, IPFS backup encryption, mainnet economics.

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
| Device share (localStorage theft, XSS, device seizure) | One share. Same as above. | Pattern or paper share. |
| Paper share (found, photographed) | One share. | Pattern or device share. |
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
  `hash(btc_address:timestamp)`; the contract verifies the signature under the
  registered key. There is no nonce store — a signature is single-purposed to
  its message, and the on-chain effect is an *authorization event*, not a
  transfer. Residual: an intercepted signature cannot be re-targeted to a
  different BTC address.
- **Anchored-share determinism**: with threshold 2, `(secret, pattern)` fully
  determines the device/paper shares — re-splitting the same secret with the
  same pattern reproduces identical shares. No fresh randomness exists to
  leak, but a pattern change forces a re-split and **a new mint** (new secret),
  since the shares bind to one secret. Documented UX consequence, not a
  vulnerability.
- **Session persistence after paper recovery**: on successful cross-device
  recovery the paper share is persisted as this device's share (with the
  now-known digest). This intentionally promotes a convenience copy — the user
  should be aware the paper share is now on this device; clearing the session
  restores paper-only custody.
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
