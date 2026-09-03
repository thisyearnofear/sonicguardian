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

## Milestones (in order)

### M3 module note (Sept 3, 2026)

`src/lib/shamir.ts` implements the M3 core: 2-of-N Shamir splitting over
GF(2⁸) with share serialization (`SGS1:<x>:<base64>`) and authenticated
reconstruction (`combineSharesAndVerify` against the secret's SHA-256, since
raw Shamir shares are unauthenticated). The intended composition is:

```
sonic pattern → DNA hash → share #1 (memorized)
                          └→ derived secret split 2-of-N
device / encrypted backup → share #2 (stored)
…+ optional shares (paper, trusted contact) → share #3..N
```

Neither factor alone is sufficient; loss of either alone is recoverable.

### M3 UX wiring (Sept 3, 2026)

Mint side: on successful on-chain commit, `SonicGuardian` splits the acoustic
private key 2-of-3 via `src/lib/recovery-split.ts`. Share 1 (pattern) is an
*anchored share* deterministically derived from the DNA hash — never stored;
share 2 (device) is persisted in the session; share 3 (paper) is shown once in
`PaperShareCard` (copy/download, deliberately not persisted). The anchored
split (`splitSecretFromAnchor` in `shamir.ts`) constructs the line through
(0, secret) and the anchor point, so the pattern share can be recomputed at
recovery time. Note: with threshold 2 there is no fresh randomness — the same
(secret, pattern) always yields the same device/paper shares.

Recovery side: after pattern verification, `AcousticFactorCard` re-derives the
pattern share from the verified DNA hash and reconstructs the acoustic secret
with the device share, authenticated by the stored digest. Follow-ups:
cross-device paper-share reconstruction (needs on-chain acoustic-key
verification to authenticate without the local digest) and hard entropy
blocking (M4).

| # | Milestone | Done when | Status |
|---|-----------|-----------|--------|
| M1 | Human recall study designed & run (n=50, 1 week) | Error-distribution data published in `docs/` | 🟡 Protocol written + tooling shipped ([RECALL_STUDY.md](./RECALL_STUDY.md), `scripts/generate-study-materials.mjs`, `scripts/score-recall.mjs`); consent forms + recruitment next |
| M2 | Fuzzy key derivation prototype | Near-recall (≤ tolerance errors) derives same key, no sketch leaks usable secret offline | ⬜ Blocked on M1 tolerance data |
| M3 | Shamir 2-of-N recovery flow | Pattern loss OR device loss each alone recoverable; neither alone sufficient | 🟢 Split wired end-to-end: anchored 2-of-3 split at mint (`PaperShareCard`), digest-authenticated reconstruction at recovery (`AcousticFactorCard`); 15 passing tests via `pnpm test:unit`. Follow-up: cross-device paper-share path |
| M4 | Entropy budget documented & UX-enforced | Per-user entropy estimate shown at registration; < minimum blocked | 🟡 Estimator + warning banner shipped (`src/lib/entropy-estimate.ts`, mint wizard step 1); hard blocking lands with M3 |
| M5 | Adversarial review of M1–M4 | Written review incorporated | ⬜ |

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
