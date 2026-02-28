# Deployment

## Prerequisites

- Node.js 18+
- pnpm
- Scarb (Cairo compiler)
- Starknet wallet (for deployment)

## Setup

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local with your keys
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VENICE_API_KEY` | Venice AI for vibe→code |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect ID |
| `NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS` | Deployed contract |
| `NEXT_PUBLIC_STARKZAP_API_KEY` | Starkzap for gifts |

## Deploy Contract

```bash
cd contracts
scarb build
# Deploy using starkli or Argent X
```

## Vercel Deployment

```bash
vercel --prod
```

## Verify

```bash
pnpm build  # Should pass
```
