# Sonic Guardian — Quick Start

> *A privacy-preserving recovery and access factor: prove you know a memorable generated secret — a musical pattern — without ever revealing it on-chain.*

---

## Quick Links

- **Live App:** `pnpm dev` → http://localhost:3000
- **Contract:** [`0x02b680ba...` on Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)
- **Account TX:** [View on Starkscan](https://sepolia.starkscan.co/tx/0x06ba17c934fe2480c1e1f2fbc6af661b642fc60b8beddba6b9b397134c476e)
- **Pattern Explorer:** Click "🎓 Explore 16+ Strudel Features" in-app
- **Formal Application:** [Proof of Privacy Cohort 01](https://proof.starknet.io)

---

## TL;DR

1. **User enters a musical vibe** (e.g., "dark industrial techno") or uses random 256-bit entropy
2. **AI generates deterministic Strudel code** (Venice AI — same vibe always produces the same code)
3. **Pattern is hashed client-side** (SHA-256 → Pedersen commitment stores on Starknet)
4. **Verify by replaying** — replay the pattern, generate an ECDSA signature with the hash as your private key, and the contract confirms authorship **without ever seeing the pattern**

---

## Demo Flow

### 1. Register a Recovery Factor
1. Connect your Starknet wallet
2. Enter a Bitcoin address to link
3. Either:
   - **Random Pattern Generator** (256-bit entropy → musical chunks)
   - **Custom Vibe** ("fast dark techno" → AI generates pattern code)
4. Click **Mint Sonic Identity**
5. Hear your pattern played back
6. Click **🔒 Commit Identity to Starknet** — commits Pedersen commitment + acoustic public key on-chain

### 2. Verify Identity (ZK — No Pattern Revealed)
1. Switch to **Verify Authorship** tab
2. Enter your linked Bitcoin address
3. Replay your musical pattern or chunks
4. Click **Verify Identity**
5. The contract receives an ECDSA signature (proving knowledge of the pattern's hash) and confirms authorship **without learning the pattern or its hash**

---

## How It Works (No Buzzwords)

| Step | What Happens | Where |
|------|-------------|-------|
| Pattern creation | Vibe → Strudel code (AI) or 256-bit entropy → musical chunks | Browser |
| Hashing | SHA-256 of pattern features → deterministic fingerprint | Browser (client-side) |
| Commitment | `Pedersen(hash, blinding_factor)` | Browser → Starknet |
| Verification | ECDSA signature with hash as private key → contract checks against stored public key | Browser ↔ Starknet |
| What's stored | Only commitment + public key | On-chain |
| What's never stored | The pattern code, the hash, the blinding factor | — |

---

## Demo Flow

```
User Vibe → AI/Entropy → Strudel Code → SHA-256 Hash → Pedersen Commitment → Starknet
                                                          ↓
                                            ECDSA Signature (ZK Proof) → Verified
                                            Pattern never revealed
```

---

## Quick Setup

```bash
# 1. Install
pnpm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Run
pnpm dev
# Open http://localhost:3000
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`README.md`](./README.md) | Privacy architecture & overview |
| [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md) | Contract deployment status |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Technical architecture & ZK flow |
| [`docs/AGENTS.md`](./docs/AGENTS.md) | Agent API documentation |
| [`docs/STRUDEL.md`](./docs/STRUDEL.md) | Pattern generation & library |

---

## Contract Status

**Account:** `0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df` ✅ Deployed

**Contract:** `0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de` ✅ Deployed on Starknet Sepolia

**Explorer:** [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de) | [Starkscan](https://sepolia.starkscan.co/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

---

## License

MIT
