# Sonic Guardian — Quick Start

> *A privacy-preserving recovery factor: prove you know a memorable musical secret without ever revealing it on-chain.*

---

## Quick Links

- **Live App:** `pnpm dev` → http://localhost:3000
- **Verify flow:** http://localhost:3000/verify (or **Mint | Verify** in the header)
- **Contract:** [`0x02b680ba...` on Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)
- **Hackathon:** [`docs/HACKATHON.md`](./docs/HACKATHON.md) · [`strk20.json`](./strk20.json)
- **Pattern Explorer:** Expand **Explore Strudel patterns** below the mint wizard

---

## TL;DR

1. **Create a secret** — random musical chunks (recommended), a library pattern, or an AI vibe
2. **Link a Bitcoin address** — paste, connect wallet, or **Use Demo Address**
3. **Generate & commit** — client-side hash → Pedersen commitment on Starknet
4. **Verify anytime** at `/verify` — replay your secret; contract checks ZK signature, not your pattern

---

## Demo Flow

### 1. Mint (3-step wizard)

Use **Mint** in the header. The wizard walks through:

| Step | Action |
|------|--------|
| **Secret** | Choose **Random pattern** (recommended) or a curated library pattern |
| **Link** | Paste BTC address, connect Xverse, or **Use Demo Address** |
| **Commit** | **Generate Identity** → save recovery chunks → **Commit to Starknet** |

Optional: expand **Private STRK stake** (mainnet + privacy wallet) before committing.

**Judge demo:** tap **Run judge demo** on the home page — pre-fills random secret + demo BTC and generates your identity in one click.

### 2. Verify (ZK — no pattern revealed)

1. Open **[/verify](http://localhost:3000/verify)** or **Test recovery →** after a successful commit
2. Paste your **recovery chunks** (or vibe / IPFS CID)
3. Enter your linked Bitcoin address
4. Click **Verify authorship**

### 3. STRK20 (Hackathon — Mainnet)

1. In mint step 3, expand **Private STRK stake (optional)**
2. Switch wallet to **Starknet mainnet**; connect a privacy-enabled wallet (Ready)
3. **Shield 0.1 STRK** and/or run a **private transfer**
4. Copy recorded tx hashes into [`strk20.json`](./strk20.json)

---

## How It Works

| Step | What Happens | Where |
|------|-------------|-------|
| Pattern creation | Entropy → chunks, or library / AI → Strudel code | Browser |
| Hashing | SHA-256 → deterministic fingerprint | Browser |
| Commitment | `Pedersen(hash, blinding)` | Browser → Starknet |
| Verification | ECDSA signature; contract checks public key | Browser ↔ Starknet |
| On-chain | Commitment + acoustic public key only | Starknet |

---

## Quick Setup

```bash
pnpm install
cp .env.example .env.local   # add API keys as needed
pnpm dev                       # http://localhost:3000
pnpm build                     # production (webpack — Strudel compat)
pnpm typecheck                 # TypeScript 7 via @typescript/native
pnpm test:e2e                  # instant navigation (Playwright)
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`README.md`](./README.md) | Privacy architecture & overview |
| [`docs/HACKATHON.md`](./docs/HACKATHON.md) | Private Sprint checklist & judge demo script |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Technical architecture & ZK flow |
| [`docs/STRUDEL.md`](./docs/STRUDEL.md) | Pattern generation & library |
| [`AGENTS.md`](./AGENTS.md) | Next.js 16 agent notes |

---

## Contract (Sepolia)

`0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de` — [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

---

## License

MIT
