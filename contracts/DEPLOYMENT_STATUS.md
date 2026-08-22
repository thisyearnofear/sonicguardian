# Sonic Guardian — Contract Deployment Status

**Last Updated:** August 22, 2026  
**Strategy:** Sepolia integration first → mainnet STRK20 scoring

---

## Current state

| Component | Network | Address | Status |
|-----------|---------|---------|--------|
| **Deployer account** | Sepolia | `0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df` | ✅ Deployed, **funded** (~0.05 ETH, ~815 STRK) |
| **Deployer account** | Mainnet | same address | ⚠️ **Not funded** (0 ETH, 0 STRK) |
| **SonicGuardian** | Sepolia | `0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de` | ✅ Deployed (Mar 2026) — **verify interface** before recovery helper |
| **RecoveryInvokeHelper** | Sepolia | `0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32` | ✅ Deployed (Aug 22, 2026) |
| **RecoveryInvokeHelper** | Mainnet | — | ⬜ After funding (Phase 2) |
| **SonicGuardian** | Mainnet | — | ⬜ Optional for hackathon |

### Explorer links (Sepolia)

- **Account:** [Voyager](https://sepolia.voyager.online/contract/0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df)
- **SonicGuardian:** [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

---

## Why Sepolia first?

1. **Funds available** — declare/deploy costs are covered on testnet.
2. **Core product works here** — mint, commit, ZK verify, agent API, MCP tools all target Sepolia today.
3. **De-risk mainnet** — declare `RecoveryInvokeHelper` once on Sepolia; repeat on mainnet with confidence.
4. **STRK20 is mainnet-only** — the privacy pool does not exist on Sepolia; pool txs and private recovery UI require Phase 2.

See **[`docs/HACKATHON.md`](../docs/HACKATHON.md)** for the full phased checklist.

---

## RecoveryInvokeHelper (Sepolia) — deployed Aug 22, 2026

| Field | Value |
|-------|-------|
| **Contract** | `0x04159e043db4260022b55e6390fc7778e58bfa3f4be36d56b0f0310f04ab0e32` |
| **Class hash** | `0x05313a98372246878052460c11a931c1b822162859ab501862f955ecbb21d2cb` |
| **Declare tx** | [Voyager](https://sepolia.voyager.online/tx/0x04b90383b707bf73b47bf41afd3c24fdd72aa346bbca467863aa1cac3b320547) |
| **Deploy tx** | [Voyager](https://sepolia.voyager.online/tx/0x071954767fa7b1edc5f0185fb49ab556fcc7735d91b04487ef9d8a5cd82f73c3) |
| **Tooling** | sncast 0.57.0 + universal-sierra-compiler 2.10.0 |
| **Env** | `NEXT_PUBLIC_RECOVERY_HELPER_SEPOLIA` in `.env.local` |

> STRK20 `privacy_invoke` still requires mainnet pool. Sepolia deploy validates declare/deploy pipeline and on-chain helper presence.

---

## Phase 1 — Sepolia (remaining)

### 1. App smoke test

```bash
pnpm dev
# Judge demo → commit on Sepolia → /verify → curl /api/agent/chain
```

### 2. Verify SonicGuardian interface (optional)

If `authorize_with_acoustic_signature` is missing on the March 2026 deployment, redeploy `SonicGuardian` and update `NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS`.

---

## Phase 2 — Mainnet (hackathon scoring)

1. Fund deployer with ETH + STRK
2. Deploy `RecoveryInvokeHelper` → set `NEXT_PUBLIC_RECOVERY_HELPER_MAINNET`
3. Run 3 STRK20 pool transactions; fill [`strk20.json`](../strk20.json)
4. Deploy frontend to Vercel

Mainnet pool: `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`

---

## Deployer setup

**sncast account:** `sonicguardian`

```bash
sncast account list
# address: 0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df
# network: alpha-sepolia, deployed: true
```

**Env (`.env.local`):**

```bash
STARKNET_ACCOUNT_ADDRESS=0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df
STARKNET_ACCOUNT=~/.starkli-wallets/sonicguardian/account.json
STARKNET_ACCOUNT_PRIVATE_KEY=~/.starkli-wallets/sonicguardian/keystore.json
STARKNET_RPC_URL=https://starknet-sepolia.drpc.org
```

---

## Tooling

| Tool | Version | Notes |
|------|---------|-------|
| Scarb | 2.16.0 | Cairo 2.16; `casm = true` in Scarb.toml |
| sncast | 0.57.0 | Preferred for declare/deploy |
| universal-sierra-compiler | 2.10.0+ | Required for Sierra 1.8.0 (`curl -L …/install.sh \| sh`) |
| starkli | 0.4.2+ | Use `--casm-file` if declaring via starkli |

**CASM mismatch workaround (starkli only):**

```bash
starkli declare \
  target/dev/sonic_guardian_SonicGuardian.contract_class.json \
  --casm-file target/dev/sonic_guardian_SonicGuardian.compiled_contract_class.json \
  --account ~/.starkli-wallets/sonicguardian/account.json \
  --keystore ~/.starkli-wallets/sonicguardian/keystore.json \
  --rpc "$STARKNET_RPC_URL" \
  --watch
```

---

## Contract interface (current)

```cairo
// SonicGuardian — key entrypoints
register_guardian(btc_address, commitment, blinding_commitment)
verify_recovery(btc_address, dna_hash, blinding) -> bool
authorize_with_acoustic_signature(btc_address, message_hash, signature_r, signature_s) -> felt252
get_commitment(btc_address) -> felt252

// RecoveryInvokeHelper
privacy_invoke(guardian, btc_address, message_hash, signature_r, signature_s, token, note_deposit)
```

---

## Historical note

Initial SonicGuardian deployment: **March 2, 2026** via sncast on Starknet Sepolia. Class hash `0x003ad2e4c2bac8392ba214743c6494a06e76bb74755109bd0dced3840e3076ed`. Deploy tx on [Voyager](https://sepolia.voyager.online/tx/0x06e589ecb5f57e25b0786f64b43ab1fbc031f731cf83eb8645023caa463523cc).
