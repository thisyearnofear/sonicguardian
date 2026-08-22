# Sonic Guardian — Quick Start

> *Private human authority for Bitcoin and agents — prove you know a memorable musical secret without revealing it on-chain.*

---

## Quick Links

- **Live App:** `pnpm dev` → http://localhost:3000
- **Verify flow:** http://localhost:3000/verify (or **Mint | Verify** in the header)
- **Contract (Sepolia):** [`0x02b680ba...` on Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)
- **Hackathon:** [`docs/HACKATHON.md`](./docs/HACKATHON.md) · [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md)
- **Pattern Explorer:** Expand **Explore Strudel patterns** below the mint wizard

---

## Deployment strategy (Aug 2026)

| Phase | Where | What |
|-------|-------|------|
| **1 — Now** | **Sepolia** (funded) | Mint → verify → agent API; ✅ `RecoveryInvokeHelper` deployed |
| **2 — Scoring** | **Mainnet** (fund first) | STRK20 pool txs + private recovery authorize |

STRK20 shield/transfer/private recovery **only work on mainnet**. Everything else can be validated on Sepolia first.

---

## TL;DR

1. **Create a secret** — random musical chunks (recommended), a library pattern, or an AI vibe
2. **Link a Bitcoin address** — paste, connect wallet, or **Use Demo Address**
3. **Generate & commit** — client-side hash → Pedersen commitment on Starknet (Sepolia)
4. **Verify anytime** at `/verify` — replay your secret; contract checks ZK signature, not your pattern
5. **(Mainnet)** After verify — optional **Authorize via STRK20 pool** once helper is deployed

---

## Demo Flow

### 1. Mint (3-step wizard)

Use **Mint** in the header. The wizard walks through:

| Step | Action |
|------|--------|
| **Secret** | Choose **Random pattern** (recommended) or a curated library pattern |
| **Link** | Paste BTC address, connect Xverse, or **Use Demo Address** |
| **Commit** | **Generate Identity** → save recovery chunks → **Commit to Starknet** (Sepolia) |

Optional (mainnet only): expand **Private STRK stake** before committing.

**Judge demo:** tap **Run judge demo** on the home page — pre-fills random secret + demo BTC and generates your identity in one click.

### 2. Verify (ZK — no pattern revealed)

1. Open **[/verify](http://localhost:3000/verify)** or **Test recovery →** after a successful commit
2. Paste your **recovery chunks** (or vibe / IPFS CID)
3. Enter your linked Bitcoin address
4. Click **Verify authorship**

### 3. Private recovery (mainnet — hackathon)

After successful verify, the **Private recovery authority** panel appears when:

- Wallet is on **Starknet mainnet**
- `NEXT_PUBLIC_RECOVERY_HELPER_MAINNET` is set (deploy `RecoveryInvokeHelper` first)
- Privacy-enabled wallet connected (e.g. Ready)

### 4. STRK20 pool txs (mainnet — hackathon scoring)

1. Fund mainnet deployer (see [`DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md))
2. In mint step 3, expand **Private STRK stake (optional)**
3. **Shield 0.1 STRK** → private transfer → private recovery authorize
4. Copy tx hashes into [`strk20.json`](./strk20.json)

### 5. Agent validation (Sepolia or mainnet)

```bash
curl http://localhost:3000/api/agent/chain
curl -X POST http://localhost:3000/api/agent/chain \
  -H 'content-type: application/json' \
  -d '{"action":"status","btcAddress":"YOUR_BTC_ADDRESS"}'
```

Or use MCP: `pnpm mcp:dev` — see [`docs/HACKATHON.md`](./docs/HACKATHON.md).

---

## How It Works

| Step | What Happens | Where |
|------|-------------|-------|
| Pattern creation | Entropy → chunks, or library / AI → Strudel code | Browser |
| Hashing | SHA-256 → deterministic fingerprint | Browser |
| Commitment | `Pedersen(hash, blinding)` | Browser → Starknet |
| Verification | ECDSA signature; contract checks public key | Browser ↔ Starknet |
| Private recovery | STRK20 anonymizer invokes acoustic authorize | Mainnet pool |
| On-chain | Commitment + acoustic public key only | Starknet |

---

## Quick Setup

```bash
pnpm install
cp .env.example .env.local   # deployer paths + API keys
pnpm dev                       # http://localhost:3000
pnpm build                     # production (webpack — Strudel compat)
pnpm typecheck                 # TypeScript 7 via @typescript/native
pnpm test:e2e                  # instant navigation (Playwright)
```

**Sepolia deploy (Phase 1 — done Aug 22, 2026):**

RecoveryInvokeHelper: `0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32` — [Voyager](https://sepolia.voyager.online/contract/0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32)

```bash
cd contracts && scarb build
# Requires universal-sierra-compiler 2.10.0+ for sncast declare
sncast -a sonicguardian declare --contract-name RecoveryInvokeHelper --network sepolia
sncast -a sonicguardian deploy --class-hash 0x05313a98372246878052460c11a931c1b822162859ab501862f955ecbb21d2cb --network sepolia
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`README.md`](./README.md) | Privacy architecture & overview |
| [`docs/HACKATHON.md`](./docs/HACKATHON.md) | Phased checklist & judge demo script |
| [`contracts/DEPLOYMENT_STATUS.md`](./contracts/DEPLOYMENT_STATUS.md) | Sepolia/mainnet deploy state |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Technical architecture & ZK flow |
| [`docs/STRUDEL.md`](./docs/STRUDEL.md) | Pattern generation & library |
| [`AGENTS.md`](./AGENTS.md) | Next.js 16 agent notes |

---

## Contract (Sepolia)

`0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de` — [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

---

## License

MIT
