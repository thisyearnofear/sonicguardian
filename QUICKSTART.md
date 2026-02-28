# Sonic Guardian - Quick Start Guide

> "Your vibe is now your signature."

Sonic Guardian enables Bitcoin recovery using musical patterns as seed phrases, with ZK proofs on Starknet.

---

## TL;DR

1. **User enters a musical vibe** (e.g., "dark industrial techno")
2. **AI translates it to Strudel code** (Venice AI)
3. **DNA is extracted and committed** to Starknet
4. **Recovery = replay the pattern** - no seed words needed

---

## Demo Flow

### 1. Registration
1. Enter a Bitcoin address to protect
2. Either:
   - Use **Secure Mode** (256-bit entropy, musical chunks)
   - Or enter a **Custom Vibe** ("fast dark techno")
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

```bash
# Register
POST /api/agent/register
{ "btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2" }

# Verify
POST /api/agent/verify
{ "btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2" }

# Trigger
POST /api/agent/trigger
{ "btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2" }
```

---

## Running Locally

```bash
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## What's Built

- [x] Next.js 14 app with Three.js visualizer
- [x] Venice AI integration for vibe→code
- [x] Musical pattern DNA extraction
- [x] Pedersen commitment logic
- [x] Agent REST API
- [x] MCP server package (standalone)
- [x] Cairo contracts (contracts/)
- [x] Starknet wallet integration

---

## Key Files

- `src/components/SonicGuardian.tsx` - Main UI
- `src/lib/ai-agent.ts` - AI synthesis
- `src/lib/dna.ts` - DNA extraction
- `src/lib/crypto.ts` - Pedersen commitments
- `contracts/src/lib.cairo` - Starknet contract
- `packages/mcp-server/` - Agent integration
