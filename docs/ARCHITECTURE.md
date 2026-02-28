# Architecture

## Privacy-First Design

All sensitive operations happen **client-side**. Only commitments hit the blockchain.

## Data Flow

```
User Input (vibe) 
    → Venice AI (vibe → Strudel)
    → Client-side DNA extraction (SHA-256)
    → Client-side Pedersen commitment
    → Starknet (commitment only)
```

## Privacy Guarantees

| Stage | Data | On-Chain |
|-------|------|----------|
| DNA Extraction | Musical pattern → hash | ❌ |
| Commitment | Pedersen(hash, blinding) | ✅ Encrypted |
| Recovery | Pattern verified locally | ❌ |

## Tech Stack

- **Frontend**: Next.js 14, Three.js visualizer
- **AI**: Venice AI (privacy-first inference)
- **Audio**: Strudel (live-coded synthesis)
- **Blockchain**: Starknet (commitments)
- **Wallet**: Starknet.js, WalletConnect

## Key Modules

| Module | Purpose |
|--------|---------|
| `ai-agent.ts` | Vibe → Strudel code |
| `dna.ts` | Pattern → DNA hash |
| `crypto.ts` | Pedersen commitments |
| `entropy-encoder.ts` | 256-bit entropy → musical chunks |
