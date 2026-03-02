# 🚀 Deploying to Starknet Sepolia Testnet

## Prerequisites

1. **Starknet Wallet** with Sepolia ETH
   - Address: `0x06a2cc31876df4b31c6c9b1ba650c2cecfab96e8c12c3148a5f2d5ac67915ce6`
   - Get free Sepolia ETH: https://starknet-faucet.vercel.app/

2. **Environment Variables** in `.env.local`:

```bash
# Copy this to .env.local and fill in your values
STARKNET_ACCOUNT_ADDRESS=0x06a2cc31876df4b31c6c9b1ba650c2cecfab96e8c12c3148a5f2d5ac67915ce6
STARKNET_ACCOUNT_PRIVATE_KEY=your_private_key_here
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

## Deployment Steps

### 1. Check Wallet Balance

Visit one of these to verify your wallet has Sepolia ETH:
- https://sepolia.starkscan.co/contract/0x06a2cc31876df4b31c6c9b1ba650c2cecfab96e8c12c3148a5f2d5ac67915ce6
- https://sepolia.voyager.online/contract/0x06a2cc31876df4b31c6c9b1ba650c2cecfab96e8c12c3148a5f2d5ac67915ce6

You need **~0.01 Sepolia ETH** for deployment (testnet = free from faucet)

### 2. Run Deployment Script

```bash
cd /Users/udingethe/Dev/sonicguardian
./contracts/deploy-testnet.sh
```

### 3. Wait for Deployment

The script will:
1. ✅ Build the Cairo contract
2. ✅ Declare the contract class (~30 seconds)
3. ✅ Deploy the contract instance (~30 seconds)
4. ✅ Output the contract address

### 4. Update Configuration

After deployment, add the contract address to `.env.local`:

```bash
NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

### 5. Verify on Explorer

The script will output links to:
- **Starkscan**: https://sepolia.starkscan.co/contract/0xYOUR_ADDRESS
- **Voyager**: https://sepolia.voyager.online/contract/0xYOUR_ADDRESS

## Manual Deployment (Alternative)

If the script fails, deploy manually:

```bash
cd contracts

# 1. Build
scarb build

# 2. Declare
starkli declare \
  target/dev/sonic_guardian_SonicGuardian.contract_class.json \
  --account 0x06a2cc31876df4b31c6c9b1ba650c2cecfab96e8c12c3148a5f2d5ac67915ce6 \
  --keystore your_private_key \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
  --watch

# 3. Deploy (replace CLASS_HASH with output from declare)
starkli deploy \
  CLASS_HASH \
  --account 0x06a2cc31876df4b31c6c9b1ba650c2cecfab96e8c12c3148a5f2d5ac67915ce6 \
  --keystore your_private_key \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
  --watch
```

## Troubleshooting

### "Insufficient balance"
- Visit https://starknet-faucet.vercel.app/
- Enter your wallet address
- Wait for faucet to complete

### "Account not deployed"
- Your account needs to be deployed first
- Use Argent X or Braavos wallet (they deploy automatically)

### "RPC error"
- Try different RPC: `https://rpc.pathfinder.dev/sepolia`
- Update `STARKNET_RPC_URL` in `.env.local`

## Post-Deployment

1. **Update README** with contract address
2. **Add Voyager/Starkscan links** for judges
3. **Test contract functions** using starkli invoke/call
4. **Commit deployment info** (but NOT private keys!)

## Security Notes

⚠️ **NEVER commit `.env.local` to git!**

The `.gitignore` already includes it, but double-check:
```bash
git status  # .env.local should NOT appear
```

✅ **Safe to share:**
- Contract address
- Class hash
- Transaction hashes

❌ **NEVER share:**
- Private keys
- Keystore passwords
- `.env.local` file
