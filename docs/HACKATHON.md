# STRK20 Private Sprint — Hackathon Checklist

**Deadline:** August 31, 2026, 23:59 UTC  
**Hub:** [strk20.starknet.io/hackathon](https://strk20.starknet.io/hackathon)

Sonic Guardian combines **ZK sonic identity** (Pedersen commitments + acoustic signatures) with **STRK20 private recovery authority**.

---

## Recommended path: Sepolia first, then mainnet

**Yes — deploy and validate on Sepolia first.** The deployer account is funded there (~0.05 ETH, ~815 STRK). Mainnet deployer is unfunded and STRK20 pool actions only exist on mainnet.

| Phase | Network | Goal | Funded? |
|-------|---------|------|---------|
| **1 — Integration** | Sepolia | End-to-end mint → verify → agent API; deploy `RecoveryInvokeHelper` | ✅ |
| **2 — Scoring** | Mainnet | 3 STRK20 pool txs + private recovery authorize | ⬜ fund deployer |

### Phase 1 — Sepolia (do this now)

What you **can** validate on testnet:

1. **Mint → commit → verify** — full ZK authorship flow against the live Sepolia contract
2. **Redeploy if needed** — if the on-chain contract predates `authorize_with_acoustic_signature`, redeploy `SonicGuardian` and update `NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS`
3. **Deploy `RecoveryInvokeHelper`** — ✅ done on Sepolia (`0x04159…0e32`); repeat on mainnet in Phase 2
4. **Agent / MCP** — `GET/POST /api/agent/chain` and MCP tools read Sepolia RPC by default
5. **Judge demo + e2e** — record the narrative; swap to mainnet STRK20 clip later

What you **cannot** validate on Sepolia:

- STRK20 shield / private transfer / `privacy_invoke` — **mainnet pool only** ([pool address](https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a))
- In-app **Authorize via STRK20 pool** panel — UI gates on mainnet + privacy wallet

```bash
# Phase 1 commands (from repo root)
cd contracts && scarb build

# Redeploy SonicGuardian (only if upgrading contract interface)
sncast -a sonicguardian declare --contract-name SonicGuardian --network sepolia
sncast -a sonicguardian deploy --class-hash <CLASS_HASH> --network sepolia

# Deploy RecoveryInvokeHelper (no constructor) — Sepolia done Aug 22, 2026
sncast -a sonicguardian declare --contract-name RecoveryInvokeHelper --network sepolia
sncast -a sonicguardian deploy --class-hash 0x05313a98372246878052460c11a931c1b822162859ab501862f955ecbb21d2cb --network sepolia
# NEXT_PUBLIC_RECOVERY_HELPER_SEPOLIA=0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32

pnpm dev   # mint → verify → test /api/agent/chain
pnpm test:e2e:ci
```

### Phase 2 — Mainnet (hackathon scoring)

After Phase 1 passes locally:

1. Fund deployer `0x023e62…55df` with **~0.01+ ETH** (gas) and **~0.5+ STRK** (pool demo)
2. Deploy `RecoveryInvokeHelper` on mainnet → set `NEXT_PUBLIC_RECOVERY_HELPER_MAINNET`
3. Run **3 pool txs** (shield, private transfer, private recovery authorize)
4. Copy hashes into [`strk20.json`](../strk20.json)
5. Deploy Vercel + record 3-min video

---

## Scoring requirements

| Item | Status | Action |
|------|--------|--------|
| 3 mainnet txs touching STRK20 pool | ⬜ | Phase 2 — after Sepolia integration |
| Public demo URL | ⬜ | Deploy to Vercel; set GitHub **Website** field |
| 3-min demo video | ⬜ | Phase 1 script on Sepolia; add mainnet STRK20 segment |
| `strk20.json` at repo root | ✅ | Fill `transactions` + `demo_video` when ready |

---

## Mainnet values (verified)

```bash
CHAIN_ID=SN_MAIN
RPC_URL=https://rpc.starknet.lava.build
POOL_ADDRESS=0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a
STRK_TOKEN=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
```

Pool on Voyager: [0x040337…812a](https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a)

---

## Sepolia values (deployed)

```bash
CHAIN_ID=SN_SEPOLIA
RPC_URL=https://starknet-sepolia.drpc.org
SONIC_GUARDIAN=0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de
DEPLOYER=0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df
RECOVERY_HELPER=0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32
```

---

## Differentiation: Private Recovery Oracle

Sonic Guardian is **not** a shield UI clone. The core innovation:

1. **Human sonic ZK** — prove authorship without revealing the pattern (acoustic ECDSA)
2. **STRK20 private recovery** — `RecoveryInvokeHelper` anonymizer calls `authorize_with_acoustic_signature` inside the pool
3. **Agent validation (ERC-8004)** — MCP tools read chain status and verify ZK signatures without receiving patterns

### RecoveryInvokeHelper flow (mainnet)

After deploy, verify flow shows **Authorize via STRK20 pool** — a 3-action STRK20 tx:
withdraw → open note → `privacy_invoke` → Sonic Guardian authorize.

Env (mainnet):

```bash
NEXT_PUBLIC_RECOVERY_HELPER_MAINNET=0x...
NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0x...   # mainnet when deployed; Sepolia addr OK for Phase 1
```

### MCP server (agent demo — works on Sepolia today)

```bash
pnpm mcp:build
pnpm mcp:dev
# Cursor: add packages/mcp-server/mcp.config.json
```

Tools: `sonic_guardian_chain_status`, `sonic_guardian_verify_zk`, `sonic_guardian_agent_manifest`

HTTP API: `GET/POST /api/agent/chain` — `{ "action": "status", "btcAddress": "..." }`

---

## Recommended judge demo (3 minutes)

**Sepolia cut (Phase 1):**

1. **Run judge demo** — pre-fills random secret + demo BTC (~15s)
2. **Connect wallet** → **Commit to Starknet** on Sepolia (~30s)
3. **Test recovery →** `/verify` with saved chunks (~45s)
4. **Agent validation** — curl `/api/agent/chain` or MCP tool (~30s)
5. Mention STRK20 private recovery (mainnet clip or live if funded)

**Mainnet add-on (Phase 2):**

6. Shield 0.1 STRK → private transfer → **Authorize via STRK20 pool** after verify
7. Copy pool tx hashes into `strk20.json`

---

## In-app UX

- **Header nav** — Mint | Verify pill switcher + wallet connect
- **3-step wizard** — Create sonic identity with clear empty/success states
- **Judge demo button** — Home page; for hackathon recordings
- **STRK20 panel** — Collapsed optional section in commit step (mainnet)
- **Private recovery panel** — After successful verify (mainnet + helper deployed)

---

## Three pool transactions (minimum — mainnet only)

1. **Deposit (shield)** — `{ type: "deposit", token, amount }` — public leg, creates private note
2. **Private transfer** — `{ type: "transfer", token, amount, recipient }` — no public link
3. **Private recovery authorize** — anonymizer `privacy_invoke` on `RecoveryInvokeHelper`

Copy transaction hashes from the in-app panel or [Voyager](https://voyager.online) into `strk20.json`.

---

## Deploy checklist

```bash
pnpm build          # webpack (Strudel compat)
pnpm typecheck      # TS 7
pnpm test:e2e:ci    # instant navigation tests
```

Vercel env:

- `NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS` — Sepolia for Phase 1; mainnet when ready
- `NEXT_PUBLIC_STARKNET_MAINNET_RPC` + `NEXT_PUBLIC_STARKNET_SEPOLIA_RPC`
- `NEXT_PUBLIC_RECOVERY_HELPER_MAINNET` — after Phase 2 deploy
- `NEXT_PUBLIC_APP_URL`

Deployer env (local only, never commit):

- `STARKNET_ACCOUNT_ADDRESS` — `0x023e62…55df`
- `STARKNET_ACCOUNT` / keystore paths — see [`.env.example`](../.env.example)

---

## Resources

- [Mainnet Day 0](https://github.com/starkience/strk20-hackathon/blob/main/docs/MAINNET-DAY-0.md)
- [STRK20 by example](https://strk20-by-example.org/)
- [Starter kit](https://github.com/Akashneelesh/strk20-starter-kit)
- [Privacy SDK](https://github.com/starkware-libs/starknet-privacy)
- [Contract deployment status](../contracts/DEPLOYMENT_STATUS.md)
