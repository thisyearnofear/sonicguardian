# Sonic Guardian - Quick Start Guide

> "Your creative expression is now your digital signature."

**Sonic Identity Protocol — musical patterns as creative expression on Starknet.**

---

## 🏆 Hackathon Submission

**Tracks:** Privacy + Bitcoin
**Status:** ✅ Account Deployed | ✅ Contract Deployed

### Quick Links
- **Pattern Explorer:** Click "🎓 Explore 16+ Strudel Features" in-app
- **Contract:** [0x02b680ba... on Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)
- **Account TX:** [View on Starkscan](https://sepolia.starkscan.co/tx/0x06ba17c934fe2480c1e1f2fbc6afba661b642fc60b8beddba6b9b397134c476e)
- **Deployment Docs:** [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md)

---

## TL;DR

1. **User enters a musical vibe** (e.g., "dark industrial techno")
2. **AI translates to Strudel code** (Venice AI) — Creative expression tool
3. **DNA extracted & committed** to Starknet (Pedersen hash) — ZK proof of authorship
4. **Verify Identity = Replay the pattern** — Prove you created it anytime

---

## Demo Flow

### 1. Mint Sonic Identity
1. Enter a Bitcoin address to link to your identity
2. Either:
   - **Random Pattern Generator** (256-bit entropy, musical chunks)
   - **Custom Vibe** ("fast dark techno")
3. Click **Mint Identity**
4. Hear your acoustic signature
5. Commit your sonic identity to Starknet

### 2. Verify Authorship
1. Switch to **Verify Authorship** tab
2. Enter your linked Bitcoin address
3. Replay your musical pattern/chunks
4. Click **Verify Identity**
5. If matched → authorship confirmed on-chain (ZK proof of knowledge)

---

## 🎼 Pattern Explorer (NEW!)

Click **"🎓 Explore 16+ Strudel Features"** in the app to explore:

- **Rhythm Patterns**: Basic rhythms, syncopation, polyrhythms, Euclidean
- **Harmony**: Scales, chord progressions (I-V-vi-IV, ii-V-I), arpeggios
- **Transformations**: `slow()`, `fast()`, rotation, probability
- **Effects**: Filter automation, distortion, reverb, bitcrush

Each demo is **interactive** - click play to hear it!

---

## Technical Highlights

| Feature | Implementation |
|---------|---------------|
| **AI Synthesis** | Venice AI → Strudel pattern code |
| **DNA Extraction** | Fingerprint for pattern identity |
| **ZK Commitment** | Pedersen hash on Starknet (Authorship proof) |
| **Verification** | ZK proof of knowledge of your sonic pattern |
| **Agent API** | REST + MCP for AI agents |

---

## API Endpoints

### Generate Pattern
```bash
curl -X POST http://localhost:3000/api/agent/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "dark industrial techno"}'
```

### Extract DNA
```bash
curl -X POST http://localhost:3000/api/dna/extract \
  -H "Content-Type: application/json" \
  -d '{"code": "s(\"bd*4\").distort(2)"}'
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
| [`README.md`](./README.md) | Overview & hackathon info |
| [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md) | Contract deployment status |
| [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md) | Full deployment guide |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Technical architecture |
| [`docs/AGENTS.md`](./docs/AGENTS.md) | Agent API documentation |

---

## Contract Status

**Account:** `0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df` ✅ Deployed

**Contract:** `0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de` ✅ Deployed

**Explorer:** [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de) | [Starkscan](https://sepolia.starkscan.co/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

See [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md) for deployment details.

| Layer | Technology |
|-------|------------|
| UI | Next.js 14, Three.js |
| AI | Venice AI |
| Audio | Strudel |
| Chain | Starknet (Cairo) |
| Wallet | WalletConnect |

---

## License

MIT
