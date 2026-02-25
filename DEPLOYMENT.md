# Sonic Guardian - Starknet Deployment Guide

Complete guide for deploying the Sonic Guardian contract to Starknet.

## 🎯 Quick Start (TL;DR)

```bash
# 1. Install tools (macOS)
brew install scarb
curl https://get.starkli.sh | sh && starkliup

# 2. Build contract
cd contracts && scarb build

# 3. Set up account (using existing browser wallet)
source ~/.starkli/env
starkli account fetch <YOUR_ADDRESS> \
  --output ~/.starkli-wallets/deployer/account.json \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7

starkli signer keystore from-key ~/.starkli-wallets/deployer/keystore.json

# 4. Export environment variables
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
export STARKNET_NETWORK=sepolia

# 5. Deploy!
cd .. && npm run contracts:deploy
```

## 📋 Full Guide

See sections below for detailed instructions on:
- Prerequisites installation
- Account setup (browser wallet or CLI)
- Getting testnet funds
- Deploying the contract
- Verification and testing
- Troubleshooting

## 🔨 Prerequisites

### Install Scarb
```bash
brew install scarb  # macOS
scarb --version     # Verify
```

### Install Starkli
```bash
curl https://get.starkli.sh | sh && starkliup
source ~/.starkli/env
starkli --version   # Verify
```

## 🔐 Account Setup

### Option A: Use Browser Wallet (Recommended)
1. Get address from Argent X/Braavos (Sepolia testnet)
2. Fetch account: `starkli account fetch <ADDRESS> --output ~/.starkli-wallets/deployer/account.json`
3. Export private key from wallet extension
4. Create keystore: `starkli signer keystore from-key ~/.starkli-wallets/deployer/keystore.json`

### Option B: Create CLI Wallet
```bash
starkli signer keystore new ~/.starkli-wallets/deployer/keystore.json
starkli account oz init ~/.starkli-wallets/deployer/account.json
# Fund from faucet, then deploy account
```

## � Deploy

```bash
# Set environment variables
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
export STARKNET_NETWORK=sepolia

# Deploy
npm run contracts:deploy
```

## ✅ Verify

Check on Starkscan: `https://sepolia.starkscan.co/contract/<ADDRESS>`

Test: `starkli call <ADDRESS> get_guardian_count --network sepolia`

## 📚 Resources

- Faucet: https://starknet-faucet.vercel.app/
- Explorer: https://sepolia.starkscan.co/
- Docs: https://docs.starknet.io/
- Discord: https://discord.gg/starknet

**Your vibe is now your signature.** 🎵🔒
