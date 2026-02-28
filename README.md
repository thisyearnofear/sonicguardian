# Sonic Guardian | Starknet Privacy Track ✦ ZK-Acoustic Protocol

**Sonic Guardian** enables private Bitcoin recovery and gifting using musical seed phrases, zero-knowledge proofs on Starknet, and **Starknet-native privacy primitives**.

> **"Your vibe is now your signature."**

---

## 🧬 The Vision

Sonic Guardian solves the "Seed Phrase Problem" in Bitcoin custody and gifting. Traditional 24-word phrases are hard to remember and risky to recover. Sonic Guardian replaces them with **Acoustic DNA**: memorable musical patterns that generate cryptographically secure zero-knowledge proofs.

### 🎯 Key Tracks
- **Privacy**: Uses Pedersen commitments and ZK-Acoustic proofs to prove ownership without exposing recovery credentials.
- **Bitcoin**: Enhances Bitcoin multisig security and enables frictionless BTC gifting via sBTC/tBTC bridges.
- **UX (Mass Adoption)**: Onboard non-crypto users via **Social Login**, where their "vibe" is their key.

---

## 🛠️ Technical Innovation

### 1. Agentic Synthesis (Powered by Venice AI)
We bridge human intuition and cryptographic precision. An AI Agent (running on **Venice AI** for privacy) translates a user's "vibe" into valid **Strudel** pattern code.
- *Input:* "A fast, dark industrial techno loop"
- *Output:* `stack(s("bd*4"), s("~ sd ~ sd").bank("909")).distort(2.5).lpf(800)`

### 2. ZK-Acoustic DNA
We extract deterministic musical features from the pattern AST to create a unique **Sonic DNA Hash**. This hash is then anchored to **Starknet** using a **Pedersen Commitment**, ensuring the recovery key is never exposed on-chain.

### 3. Musical Seed Phrases (256-bit Entropy)
For high-value assets, Sonic Guardian generates **Musical Seed Phrases**. 256 bits of cryptographic entropy are deterministically encoded into 5-7 musical chunks (e.g., "909 kicks on 1 and 3"). These chunks are fully reconstructible, providing AES-256 level security with auditory memorability.

---

## 🎁 Showcase App: Bitcoin Birthday Cards
Our showcase application demonstrates how Sonic Guardian + **Starkzap** can revolutionize Bitcoin gifting:
1. **Mint Vibe**: Sender generates a musical gift vibe.
2. **Anchor**: The DNA is committed to Starknet.
3. **Gift**: BTC is locked in a vault, keyed to the vibe.
4. **Claim**: Recipient logs in via Google/Apple, enters the vibe, and instantly unlocks their Bitcoin.

---

## 🚀 Technical Stack

- **Cairo 2.0**: Pedersen commitment & ZK-verification contracts on Starknet.
- **Next.js 14**: Premium, shader-based UI with Three.js visualizers.
- **Strudel.js**: The engine for live-coded acoustic synthesis.
- **Starknet.js**: Seamless integration with the Starknet ecosystem.
- **Venice AI**: Privacy-first inference for vibe-to-code synthesis.

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- A Starknet wallet (Argent X or Braavos)

### Setup
1. Clone the repo: `git clone https://github.com/your-username/sonicguardian`
2. Install dependencies: `pnpm install`
3. Set up `.env.local` (see `.env.example`)
4. Start the lab: `pnpm dev`

### Agent API

AI agents can interact with Sonic Guardian via the REST API:

```bash
# Register a guardian
curl -X POST http://localhost:3000/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2, sine c4*4"}'

# Verify recovery
curl -X POST http://localhost:3000/api/agent/verify \
  -H "Content-Type: application/json" \
  -d '{"btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2"}'

# Trigger recovery
curl -X POST http://localhost:3000/api/agent/trigger \
  -H "Content-Type: application/json" \
  -d '{"btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2"}'

# Check status
curl http://localhost:3000/api/agent/status/bc1q...
```

### MCP Server

For MCP-compatible agents (Claude, Cursor, Snak), use the standalone MCP server:

```bash
# Install
npm install @sonicguardian/mcp-server

# Run
npx @sonicguardian/mcp-server http 3001
```

See [packages/mcp-server/README.md](./packages/mcp-server/README.md) for full MCP documentation.

### Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide to deploying the Sonic Guardian contract to Sepolia.

---

## 🏆 Hackathon Goals
- [x] **Privacy Track**: Real ZK-commitment logic with Pedersen hashes.
- [x] **Bitcoin Track**: Novel BTC recovery and gifting utility.
- [x] **UX Track**: Agentic synthesis and social onboarding.

**Built for the Starknet Hackathon 2026.** 🛡️🎵
