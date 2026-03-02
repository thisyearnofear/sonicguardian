# Sonic Guardian - Quick Start Guide

> "Your vibe is now your signature."

**Private Bitcoin recovery using musical patterns on Starknet.**

---

## 🏆 Hackathon Submission

**Tracks:** Privacy + Bitcoin  
**Status:** ✅ Account Deployed | ⏸️ Contract Pending (tooling issue)

### Quick Links
- **Pattern Explorer:** Click "🎓 Explore 16+ Strudel Features" in-app
- **Contract Status:** [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md)
- **Account TX:** [View on Starkscan](https://sepolia.starkscan.co/tx/0x06ba17c934fe2480c1e1f2fbc6afba661b642fc60b8beddba6b9b397134c476e)

---

## TL;DR

1. **User enters a musical vibe** (e.g., "dark industrial techno")
2. **AI translates to Strudel code** (Venice AI)
3. **DNA extracted & committed** to Starknet (Pedersen hash)
4. **Recovery = replay the pattern** - no seed words needed

---

## Demo Flow

### 1. Registration
1. Enter a Bitcoin address to protect
2. Either:
   - **Secure Mode** (256-bit entropy, musical chunks)
   - **Custom Vibe** ("fast dark techno")
3. Click **Generate Guardian**
4. Hear your acoustic signature
5. Optionally anchor to Starknet

### 2. Recovery
1. Switch to Recovery tab
2. Enter your Bitcoin address
3. Enter your musical pattern/chunks
4. Click **Verify & Recover**
5. If matched → funds unlocked

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
| **DNA Extraction** | Deterministic AST parsing → SHA-256 |
| **ZK Commitment** | Pedersen hash on Starknet |
| **Recovery** | Acoustic pattern verification |
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

**Contract:** ⏸️ Pending (Cairo compiler version mismatch)

See [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md) for details.

---

## Tech Stack

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
