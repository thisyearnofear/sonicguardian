# Sonic Guardian Deployment Guide

Quick reference for deploying the Sonic Guardian contracts to Starknet.

## 🚀 Quick Start

```bash
# 1. Install tools
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
curl https://get.starkli.sh | sh && starkliup

# 2. Set up account
starkli signer keystore new ~/.starkli-wallets/deployer/keystore.json
# Get testnet ETH: https://starknet-faucet.vercel.app/
starkli account fetch <YOUR_ADDRESS> --output ~/.starkli-wallets/deployer/account.json

# 3. Export variables
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
export STARKNET_NETWORK=sepolia

# 4. Deploy
pnpm contracts:deploy
```

## 📋 Prerequisites Checklist

- [ ] Scarb installed (`scarb --version`)
- [ ] Starkli installed (`starkli --version`)
- [ ] Starknet account created
- [ ] Testnet ETH in account
- [ ] Environment variables exported
- [ ] `.env.local` file created

## 🔧 Environment Variables

### Required for Deployment
```bash
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
export STARKNET_NETWORK=sepolia  # or mainnet
```

### Required in .env.local
```env
# After deployment, add:
NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0x...

# Also needed:
VENICE_API_KEY=your_venice_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🎯 Deployment Commands

### Build Only
```bash
pnpm contracts:build
# or
cd contracts && scarb build
```

### Deploy (Automated)
```bash
pnpm contracts:deploy
```

### Deploy (Manual)
```bash
cd contracts

# Build
scarb build

# Declare
starkli declare target/dev/sonic_guardian_SonicGuardian.contract_class.json --network sepolia

# Deploy (use class hash from declare output)
starkli deploy <CLASS_HASH> --network sepolia
```

## 🌐 Networks

### Sepolia Testnet (Recommended for Development)
```bash
export STARKNET_NETWORK=sepolia
```
- Faucet: https://starknet-faucet.vercel.app/
- Explorer: https://sepolia.starkscan.co/

### Mainnet (Production)
```bash
export STARKNET_NETWORK=mainnet
```
- Explorer: https://starkscan.co/

## 🔍 Verification

After deployment, verify your contract:

1. **Check on Explorer**
   - Sepolia: `https://sepolia.starkscan.co/contract/<YOUR_ADDRESS>`
   - Mainnet: `https://starkscan.co/contract/<YOUR_ADDRESS>`

2. **Test Contract Interaction**
   ```bash
   # Get commitment for an address
   starkli call <CONTRACT_ADDRESS> get_commitment <USER_ADDRESS> --network sepolia
   ```

3. **Test in UI**
   - Connect wallet
   - Click "Mint Sonic DNA"
   - Click "Anchor to Starknet"
   - Check transaction on explorer

## 🐛 Troubleshooting

### "command not found: scarb"
```bash
# Restart terminal or source your shell config
source ~/.bashrc  # or ~/.zshrc

# Verify installation
which scarb
scarb --version
```

### "command not found: starkli"
```bash
# Run starkliup again
starkliup

# Add to PATH if needed
export PATH="$HOME/.starkli/bin:$PATH"
```

### "Account not found"
```bash
# Make sure you have testnet ETH
# Check account file exists
cat ~/.starkli-wallets/deployer/account.json

# Verify account on explorer
# https://sepolia.starkscan.co/contract/<YOUR_ADDRESS>
```

### "Class already declared"
This is normal! The script will handle it automatically. The contract class only needs to be declared once per network.

### "Insufficient balance"
```bash
# Get testnet ETH from faucet
# https://starknet-faucet.vercel.app/

# Check balance
starkli balance <YOUR_ADDRESS> --network sepolia
```

### "Invalid signature"
```bash
# Make sure keystore password is correct
# Re-export environment variables
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
```

## 📝 Post-Deployment Checklist

- [ ] Contract address added to `.env.local`
- [ ] Contract verified on explorer
- [ ] Test registration in UI
- [ ] Test verification in UI
- [ ] Document contract address
- [ ] Update frontend ABI if needed

## 🔐 Security Notes

### DO
✅ Use `.env.local` for secrets (already in `.gitignore`)
✅ Keep keystore password secure
✅ Test on Sepolia before mainnet
✅ Verify contract on explorer
✅ Use hardware wallet for mainnet

### DON'T
❌ Commit private keys or keystore files
❌ Share keystore passwords
❌ Deploy to mainnet without testing
❌ Use same account for dev and prod
❌ Expose private keys in code

## 📚 Resources

- [Scarb Documentation](https://docs.swmansion.com/scarb/)
- [Starkli Book](https://book.starkli.rs/)
- [Cairo Book](https://book.cairo-lang.org/)
- [Starknet Documentation](https://docs.starknet.io/)
- [Sepolia Faucet](https://starknet-faucet.vercel.app/)
- [Starknet Explorer](https://starkscan.co/)

## 🆘 Getting Help

If you encounter issues:

1. Check the [contracts/README.md](contracts/README.md)
2. Review error messages carefully
3. Search [Starknet Discord](https://discord.gg/starknet)
4. Check [Starkli GitHub Issues](https://github.com/xJonathanLEI/starkli/issues)

## 🎉 Success!

Once deployed, your Sonic Guardian contract is live on Starknet! Users can now:
- Register their Sonic DNA on-chain
- Verify their identity cryptographically
- Use it as a Guardian for account recovery
- Authorize session keys with acoustic proofs

Your vibe is now your signature. 🎵🔒
