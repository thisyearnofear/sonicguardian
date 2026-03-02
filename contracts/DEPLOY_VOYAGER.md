# Contract Deployment via Voyager (Workaround)

Since the CLI deployment faces CASM hash mismatch issues, use Voyager's web interface:

## Steps

1. **Go to Voyager Sepolia**: https://sepolia.voyager.online/

2. **Connect Wallet**:
   - Click "Connect"
   - Use the wallet that owns your account: `0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df`

3. **Declare Contract**:
   - Go to "Contracts" → "Declare Contract"
   - Upload: `target/dev/sonic_guardian_SonicGuardian.contract_class.json`
   - Upload: `target/dev/sonic_guardian_SonicGuardian.compiled_contract_class.json` (if prompted)
   - Pay declaration fee
   - Wait for confirmation

4. **Deploy Contract**:
   - After declaration, click "Deploy"
   - Enter constructor calldata (empty for our contract)
   - Pay deployment fee
   - Get contract address

5. **Update Environment**:
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
   ```

## Alternative: Katana Local Devnet

For demo purposes, deploy to local Katana:

```bash
# Install Katana
cargo install katana

# Start local devnet
katana --validate-max-steps 4000000 --invoke-max-steps 4000000

# In another terminal, deploy
cd contracts
starkli declare \
  target/dev/sonic_guardian_SonicGuardian.contract_class.json \
  --casm-file target/dev/sonic_guardian_SonicGuardian.compiled_contract_class.json \
  --account <KATANA_ACCOUNT> \
  --private-key <KATANA_KEY> \
  --rpc http://localhost:5050
```

## Current Status

- ✅ Account deployed: `0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df`
- ✅ Contract builds successfully
- ⏸️ Contract deployment (Voyager web workaround recommended)
