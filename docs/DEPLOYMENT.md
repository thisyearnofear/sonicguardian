# Deployment

## Strategy

**Sepolia first** (funded deployer) → **mainnet** (STRK20 hackathon scoring).

See **[HACKATHON.md](./HACKATHON.md)** and **[../contracts/DEPLOYMENT_STATUS.md](../contracts/DEPLOYMENT_STATUS.md)** for the full phased plan.

---

## Prerequisites

- Node.js 18+, pnpm
- Scarb 2.16+ (`scarb build` in `contracts/`)
- sncast / starkli (starknet-foundry)
- sncast account `sonicguardian` on Sepolia (already deployed)

---

## Environment

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `STARKNET_ACCOUNT_ADDRESS` | Deployer `0x023e62…55df` |
| `STARKNET_ACCOUNT` | `~/.starkli-wallets/sonicguardian/account.json` |
| `STARKNET_ACCOUNT_PRIVATE_KEY` | Keystore path for deploy scripts |
| `NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS` | Sepolia contract (Phase 1) |
| `NEXT_PUBLIC_RECOVERY_HELPER_SEPOLIA` | Sepolia helper (deployed) |
| `NEXT_PUBLIC_RECOVERY_HELPER_MAINNET` | After mainnet helper deploy (Phase 2) |
| `NEXT_PUBLIC_STARKNET_SEPOLIA_RPC` | Sepolia RPC |
| `NEXT_PUBLIC_STARKNET_MAINNET_RPC` | Mainnet RPC |
| `VENICE_API_KEY` | AI vibe → Strudel |

---

## Phase 1 — Sepolia contracts

**RecoveryInvokeHelper** — deployed Aug 22, 2026:

| | |
|--|--|
| Contract | `0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32` |
| Class hash | `0x05313a98372246878052460c11a931c1b822162859ab501862f955ecbb21d2cb` |
| Explorer | [Voyager](https://sepolia.voyager.online/contract/0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32) |

Requires **universal-sierra-compiler 2.10.0+** (`curl -L https://raw.githubusercontent.com/software-mansion/universal-sierra-compiler/master/scripts/install.sh | sh`).

```bash
cd contracts
scarb build

sncast -a sonicguardian declare --contract-name RecoveryInvokeHelper --network sepolia
sncast -a sonicguardian deploy --class-hash 0x05313a98372246878052460c11a931c1b822162859ab501862f955ecbb21d2cb --network sepolia

# Redeploy SonicGuardian only if upgrading on-chain interface
sncast -a sonicguardian declare --contract-name SonicGuardian --network sepolia
sncast -a sonicguardian deploy --class-hash <CLASS_HASH> --network sepolia
```

Update `.env.local`:

```bash
NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de
NEXT_PUBLIC_RECOVERY_HELPER_SEPOLIA=0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32
```

Legacy shell script (starkli + keystore paths):

```bash
./contracts/deploy-testnet.sh
```

---

## Phase 2 — Mainnet

1. Fund deployer with ETH + STRK
2. Deploy `RecoveryInvokeHelper` on mainnet
3. Set `NEXT_PUBLIC_RECOVERY_HELPER_MAINNET`
4. Run 3 STRK20 pool txs in-app; fill [`strk20.json`](../strk20.json)

Pool: `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`

---

## Frontend (Vercel)

```bash
pnpm build
vercel --prod
```

Set Vercel env vars from `.env.example` (public keys only — never deploy private keys).

---

## Verify

```bash
pnpm typecheck
pnpm build
pnpm test:e2e:ci
curl http://localhost:3000/api/agent/chain
```

---

## MCP server

```bash
pnpm mcp:build
pnpm mcp:dev
```

Tools: `sonic_guardian_chain_status`, `sonic_guardian_verify_zk`, `sonic_guardian_agent_manifest`
