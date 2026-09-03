# Sonic Guardian 🎵🔐

**Memorable-music wallet recovery, privacy-preserving by design — prove knowledge of your secret with zero-knowledge proofs on Starknet.**

> "Your creative expression is now your digital signature — and only you can prove it."

> **⚠️ Read first: [Project Direction](./docs/DIRECTION.md)** — this project has narrowed
> its focus to the **wallet recovery core**: a memorized musical pattern as one *factor*
> in key recovery (paired with Shamir sharing / fuzzy extraction), not a whole-wallet key.
> The gift/STRK20 features are deferred; the two open problems (pattern-space entropy,
> approximate human recall vs. exact hashes) are documented there. Hackathon assets below
> remain as completed Sepolia work.

---

## 🏆 Starknet Accelerator Application: Proof of Privacy (Cohort 01)

**Program:** [Proof of Privacy](https://proof.starknet.io) — an 8-week Starknet program for teams building privacy-preserving applications with STRK20.

**Status:** ✅ Sepolia deployed & funded | ✅ Sepolia RecoveryInvokeHelper | ⬜ 3 mainnet pool txs

### Hackathon (Private Sprint — deadline Aug 31, 2026)
- **[Hackathon checklist](./docs/HACKATHON.md)** — **Sepolia first**, then mainnet STRK20 scoring
- **[Deployment status](./contracts/DEPLOYMENT_STATUS.md)** — phased deploy plan
- **[`strk20.json`](./strk20.json)** — panel scoring file (fill tx hashes after mainnet runs)

### Quick Links
- **[Live App Flow](./QUICKSTART.md)** — Step-by-step demo
- **[Contract](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)** — Deployed on Starknet Sepolia
- **[Pattern Explorer](./docs/STRUDEL.md)** — 16+ interactive Strudel demos
- **[Architecture](./docs/ARCHITECTURE.md)** — Full technical breakdown

---

## 🔐 Privacy Architecture

Sonic Guardian is designed **privacy-first**: no musical pattern, DNA hash, or biometric data ever touches the blockchain or a server. Only cryptographic commitments are stored on-chain, providing zero-knowledge proof of authorship without revealing the underlying identity.

### Data Flow

```
User Vibe  →  Venice AI (vibe → Strudel code)
                   ↓
        Client-side DNA Extraction (SHA-256)
                   ↓
   Client-side Pedersen Commitment (dna_hash || blinding)
                   ↓
         Starknet stores only: commitment
         (never the DNA, never the blinding factor)
```

### Privacy Guarantees

| Stage | What Happens | Where | Data On-Chain? |
|-------|-------------|-------|----------------|
| **Pattern Synthesis** | Venice AI translates "dark techno" → Strudel code | Venice AI → Browser | ❌ |
| **DNA Extraction** | SHA-256 feature hash of musical pattern | Browser (client-side) | ❌ |
| **Commitment** | `Pedersen(dna_hash, blinding_factor)` → felt252 | Browser (client-side) | ✅ Commitment only |
| **Verification** | Prove knowledge via ECDSA acoustic signature — no DNA revealed | Browser verifies on-chain public key | ✅ Signature only |
| **Backup** | AES-GCM encrypted (wallet-derived key) → IPFS | Browser → IPFS | ❌ (encrypted) |
| **Recovery** | Replay pattern, verify commitment matches locally | Browser (client-side) | ❌ |

### Zero-Knowledge Proof Path (Preferred)

1. **Registration:** User registers by storing a Pedersen commitment **and** an acoustic public key (derived from the DNA hash via Stark Curve) on-chain.
2. **Verification:** To prove authorship, the user signs a challenge message with their DNA hash as the private key. The contract's `verify_acoustic_signature` uses `core::ecdsa::check_ecdsa_signature` to verify the signature against the stored public key.
3. **Result:** The contract confirms authorship **without ever learning the DNA hash or the musical pattern**. This is a true zero-knowledge proof.

```cairo
// Contract verifies authorship without seeing your DNA
fn verify_acoustic_signature(
    btc_address: felt252,
    message_hash: felt252,
    signature_r: felt252,
    signature_s: felt252
) -> bool {
    let public_key = self.acoustic_keys.read(btc_address);
    check_ecdsa_signature(message_hash, public_key, signature_r, signature_s)
}
```

### Why This Matters for Proof of Privacy

- **Privacy First:** The architecture guarantees that musical identity data *cannot* leak, even if the contract or frontend is compromised.
- **STRK20 Ready:** Contract uses standard ERC20 interfaces, compatible with STRK20 token standard on Starknet.
- **Starknet Native:** Leverages Cairo's built-in `pedersen` and `ecdsa` primitives for efficient ZK proofs.
- **Real Use Case:** Bitcoin wallet recovery with a human-memorable sonic identity — solving a $100B+ industry problem.

---

## How It Works

1. **Enter creative prompt** → "dark industrial techno"
2. **AI translates** → Strudel code (Venice AI) — Creative expression tool, privacy-preserving inference
3. **DNA extracted** → SHA-256 fingerprint for pattern identity (client-side only)
4. **Commit to Starknet** → Pedersen commitment stored on-chain (ZK proof of authorship)
5. **Verify Identity** → Prove you created it using an acoustic ZK signature — no pattern data revealed

```bash
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## Features

- 🎵 **3-step mint wizard** — Secret → Link BTC address → Generate & commit on Starknet
- 🔐 **Privacy-first** — All crypto client-side; only commitments on-chain
- 🧾 **Zero-knowledge verification** — `/verify` route with acoustic ECDSA proof
- 🛡️ **STRK20 integration** — Optional private STRK stake via Starknet Wallet API *(deferred — see [Direction](./docs/DIRECTION.md))*
- ⚡ **Instant navigation** — Next.js 16 Cache Components + per-route loading shells
- 📱 **Mobile-first** — Safe areas, touch targets, bottom-sheet modals
- 🎼 **Strudel showcase** — Pattern library + optional live editor
- 💰 **Xverse** — Bitcoin wallet for identifier linking

## Path to production

The core idea is sound; the current build is a demo of it. Two open problems
gate real use — **pattern-space entropy** (common AI prompts yield
brute-forceable secrets) and **approximate recall** (one misremembered note
breaks an exact hash). The plan — recovery *factor* via Shamir sharing, fuzzy
key derivation, audited entropy budgets, human recall study — is documented in
**[docs/DIRECTION.md](./docs/DIRECTION.md)**.

---

## Documentation

| Doc | Purpose |
|-----|---------|
| **[Quick Start](./QUICKSTART.md)** | TL;DR demo flow & judge demo |
| **[Hackathon](./docs/HACKATHON.md)** | Private Sprint checklist |
| **[Architecture](./docs/ARCHITECTURE.md)** | Privacy design & tech stack |
| **[Strudel](./docs/STRUDEL.md)** | Pattern generation & library |
| **[AGENTS.md](./AGENTS.md)** | Next.js 16 agent notes |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | Next.js 16, React 19, Tailwind |
| AI | Venice AI (optional vibe → Strudel) |
| Audio | Strudel (lazy-loaded, webpack build) |
| Chain | Starknet Sepolia (Cairo, Pedersen + ECDSA) |
| Privacy pool | STRK20 Wallet API (starknet.js 10.4) |
| Wallet | Argent, Braavos, Xverse, WalletConnect |
| Tests | Playwright + `@next/playwright` instant() |

---

## Contract Status

**Account:** `0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df` ✅ Deployed

**Contract:** `0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de` ✅ Deployed on Starknet Sepolia

**Explorer:** [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de) | [Starkscan](https://sepolia.starkscan.co/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

**Deploy TX:** [View on Starkscan](https://sepolia.starkscan.co/tx/0x06ba17c934fe2480c1e1f2fbc6af661b642fc60b8beddba6b9b397134c476e)

**Contract Interface:**
- `register_guardian(btc_address, commitment, blinding_commitment, acoustic_key)` — Register with ZK commitment
- `verify_acoustic_signature(btc_address, message_hash, sig_r, sig_s)` — ZK proof of authorship
- `authorize_with_acoustic_signature(...)` — Prove identity without revealing DNA
- `create_onchain_gift(vault_id, commitment, amount, token)` — Escrow tokens with sonic signature
- `claim_onchain_gift(vault_id, dna_hash, blinding, recipient)` — Claim gift with musical proof

See **[Contract Deployment Status](./contracts/DEPLOYMENT_STATUS.md)** for full details.

---

## License

MIT
