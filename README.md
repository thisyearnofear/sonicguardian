# Sonic Guardian 🎵🔐

**Private Bitcoin recovery using musical patterns.**

> "Your vibe is now your signature."

## 🏆 Starknet Hackathon RE{DEFINE} Submission

**Tracks:** Privacy + Bitcoin

**Status:** ✅ Account Deployed | ⏸️ Contract Deployment (tooling issue)

### Quick Links for Judges
- **[Quick Start](./QUICKSTART.md)** - Project overview & demo flow
- **[Pattern Explorer](./docs/STRUDEL.md)** - 16+ interactive Strudel demos
- **[Contract Status](./contracts/DEPLOYMENT_STATUS.md)** - Deployment info
- **[Account TX](https://sepolia.starkscan.co/tx/0x06ba17c934fe2480c1e1f2fbc6afba661b642fc60b8beddba6b9b397134c476e)** - On-chain proof

## Quick Start

```bash
pnpm install
pnpm dev
# Open http://localhost:3000
```

## How It Works

1. **Enter vibe** → "dark industrial techno"
2. **AI translates** → Strudel code (Venice AI)
3. **DNA extracted** → SHA-256 hash (client-side)
4. **Commit to Starknet** → Pedersen commitment
5. **Recover** → Replay your musical pattern

## Features

- 🎵 **Musical seed phrases** - 256-bit entropy in 5-7 chunks
- 🔐 **Privacy-first** - All crypto client-side
- 🤖 **Agent-ready** - REST API + MCP server
- 🎁 **Bitcoin gifting** - Starkzap integration
- 🎼 **Strudel Showcase** - 16+ interactive pattern demos

## Documentation

| Doc | Purpose |
|-----|---------|
| **[Quick Start](./QUICKSTART.md)** | TL;DR for judges |
| **[Docs Hub](./docs/)** | Complete documentation |
| **[Architecture](./docs/ARCHITECTURE.md)** | Privacy & tech stack |
| **[Agent API](./docs/AGENTS.md)** | REST & MCP integration |
| **[Strudel](./docs/STRUDEL.md)** | Pattern generation |
| **[Deployment](./contracts/DEPLOYMENT_STATUS.md)** | Contract status |

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | Next.js 14, Three.js |
| AI | Venice AI |
| Audio | Strudel |
| Chain | Starknet (Cairo) |
| Wallet | WalletConnect |

## Contract Status

**Account:** `0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df` ✅ Deployed

**Contract:** ⏸️ Pending (Cairo compiler version mismatch - Scarb 2.16 vs Starkli 2.11)

See **[Contract Deployment Status](./contracts/DEPLOYMENT_STATUS.md)** for details.

## License

MIT
