# STRK20 Private Sprint — Hackathon Checklist

**Deadline:** August 31, 2026, 23:59 UTC  
**Hub:** [strk20.starknet.io/hackathon](https://strk20.starknet.io/hackathon)

Sonic Guardian combines **ZK sonic identity** (Pedersen commitments + acoustic signatures) with **STRK20 private registration bonds**.

---

## Scoring requirements

| Item | Status | Action |
|------|--------|--------|
| 3 mainnet txs touching STRK20 pool | ⬜ | Shield + private transfer in-app; add hashes to `strk20.json` |
| Public demo URL | ⬜ | Deploy to Vercel; set GitHub **Website** field |
| 3-min demo video | ⬜ | Record mint → shield → verify flow |
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

## Differentiation: Private Recovery Oracle

Sonic Guardian is **not** a shield UI clone. The core innovation:

1. **Human sonic ZK** — prove authorship without revealing the pattern (acoustic ECDSA)
2. **STRK20 private recovery** — `RecoveryInvokeHelper` anonymizer calls `authorize_with_acoustic_signature` inside the pool
3. **Agent validation (ERC-8004)** — MCP tools read chain status and verify ZK signatures without receiving patterns

### Deploy RecoveryInvokeHelper (mainnet)

```bash
cd contracts && scarb build
# Declare + deploy RecoveryInvokeHelper (no constructor args)
# Set in .env.local:
# NEXT_PUBLIC_RECOVERY_HELPER_MAINNET=0x...
# NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0x...  # mainnet when ready
```

After deploy, verify flow shows **Authorize via STRK20 pool** — a 3-action STRK20 tx:
withdraw → open note → `privacy_invoke` → Sonic Guardian authorize.

### MCP server (agent demo)

```bash
pnpm mcp:build
pnpm mcp:dev
# Cursor: add packages/mcp-server/mcp.config.json
```

Tools: `sonic_guardian_chain_status`, `sonic_guardian_verify_zk`, `sonic_guardian_agent_manifest`

HTTP API: `GET/POST /api/agent/chain` — `{ "action": "status", "btcAddress": "..." }`

---

## Recommended judge demo (3 minutes)

1. **Run judge demo** — one tap pre-fills random secret + demo BTC and generates identity (~15s)
2. **Connect wallet** → **Commit to Starknet** on Sepolia (~30s)
3. **Test recovery →** `/verify` with saved chunks (~45s)
4. **STRK20 (mainnet)** — expand optional stake, shield 0.1 STRK (~45s)
5. Copy pool tx hashes into `strk20.json`

Or walk through the wizard manually: **Mint** header tab → Secret → Link → Commit.

---

## In-app UX

- **Header nav** — Mint | Verify pill switcher + wallet connect
- **3-step wizard** — Create sonic identity with clear empty/success states
- **Judge demo button** — Home page; for hackathon recordings
- **STRK20 panel** — Collapsed optional section in commit step

---

## Three pool transactions (minimum)

1. **Deposit (shield)** — `{ type: "deposit", token, amount }` — public leg, creates private note
2. **Private transfer** — `{ type: "transfer", token, amount, recipient }` — no public link
3. **Third action** — Another private transfer, unshield, or anonymizer `invoke` (future)

Copy transaction hashes from the in-app panel or [Voyager](https://voyager.online) into `strk20.json`.

---

## Deploy checklist

```bash
pnpm build          # webpack (Strudel compat)
pnpm typecheck      # TS 7
pnpm test:e2e:ci    # instant navigation tests
```

Set env on Vercel:

- `NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS` — mainnet contract when deployed
- `NEXT_PUBLIC_STARKNET_MAINNET_RPC`
- `NEXT_PUBLIC_APP_URL`

---

## Resources

- [Mainnet Day 0](https://github.com/starkience/strk20-hackathon/blob/main/docs/MAINNET-DAY-0.md)
- [STRK20 by example](https://strk20-by-example.org/)
- [Starter kit](https://github.com/Akashneelesh/strk20-starter-kit)
- [Privacy SDK](https://github.com/starkware-libs/starknet-privacy)
