# Sonic Guardian Documentation

**Deployed on Starknet Sepolia** — mainnet STRK20 scoring in progress.

## Deployment roadmap

| Phase | Network | Status |
|-------|---------|--------|
| **1 — Integration** | Sepolia | ✅ Account funded · ✅ SonicGuardian · ✅ RecoveryInvokeHelper |
| **2 — Hackathon scoring** | Mainnet | ⬜ Fund deployer · ⬜ 3 pool txs · ⬜ demo video |

Full checklist: **[HACKATHON.md](./HACKATHON.md)** · **[DEPLOYMENT_STATUS.md](../contracts/DEPLOYMENT_STATUS.md)**

---

## Deployment status

| Component | Status | Link |
|-----------|--------|------|
| **Account (Sepolia)** | ✅ Funded | [Voyager](https://sepolia.voyager.online/contract/0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df) |
| **SonicGuardian (Sepolia)** | ✅ Deployed | [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de) |
| **RecoveryInvokeHelper (Sepolia)** | ✅ Deployed | [Voyager](https://sepolia.voyager.online/contract/0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32) |
| **STRK20 pool txs** | ⬜ Mainnet | [Pool](https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a) |
| **Frontend** | ✅ Production-ready | Mint · Verify · Agent API · MCP |

---

## Documentation index

### Getting started
- **[Quick Start](../QUICKSTART.md)** — TL;DR + phased demo flow
- **[README](../README.md)** — Project overview & privacy architecture
- **[Hackathon checklist](./HACKATHON.md)** — Sepolia first → mainnet scoring

### Technical
- **[Architecture](./ARCHITECTURE.md)** — System design & privacy guarantees
- **[Agent API](./AGENTS.md)** — REST API & MCP server integration
- **[Strudel Integration](./STRUDEL.md)** — Musical pattern generation

### Deployment
- **[Contract Status](../contracts/DEPLOYMENT_STATUS.md)** — Phased deploy plan & commands
- **[Deployment Guide](./DEPLOYMENT.md)** — Environment & Vercel
- **[Environment Setup](../.env.example)** — Env var reference

---

## Quick navigation

### Demo path (Sepolia — do first)
1. **[QUICKSTART.md](../QUICKSTART.md)** — Judge demo → commit → verify
2. **`/api/agent/chain`** — Agent validation (no pattern exposure)
3. Deploy **RecoveryInvokeHelper** on Sepolia — see DEPLOYMENT_STATUS

### Hackathon path (Mainnet)
1. Fund deployer · deploy helper on mainnet
2. 3 STRK20 pool txs → [`strk20.json`](../strk20.json)
3. Record 3-min video · deploy Vercel

---

**Last Updated:** August 22, 2026
