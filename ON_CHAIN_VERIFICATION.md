# On-Chain Verification Steps

## ✅ What's Implemented

1. **Verify On-Chain Button** - Added to UI after successful guardian registration
2. **getCommitment() Hook** - Reads stored commitment from contract
3. **getGuardianCount() Hook** - Reads total guardians registered

## 📋 Steps to Complete for Judges

### 1. Register a Guardian via the App

```bash
pnpm dev
# Navigate to http://localhost:3000
```

1. Connect your Starknet wallet (ArgentX/Braavos)
2. Enter a Bitcoin address (e.g., `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`)
3. Generate a musical pattern (or use secure generation)
4. Click "🔒 Anchor to Starknet"
5. Approve the transaction in your wallet
6. Wait for confirmation

### 2. Verify On-Chain

After successful registration:
1. Click "🔍 Verify On-Chain" button
2. The app will call `get_commitment(btc_address)` on the contract
3. Status will show the commitment hash from on-chain storage

### 3. Check Guardian Count

The contract tracks `guardian_count` which increments with each registration.

Judges can verify:
- Contract address: `0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de`
- View on [Starkscan](https://sepolia.starkscan.co/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)
- Check transactions tab for `register_guardian` calls

## 🔍 What Judges Will See

1. **Transaction History** - `register_guardian` calls on Starkscan
2. **Guardian Count** - `guardian_count >= 1` in contract storage
3. **Stored Commitments** - Pedersen commitments for each BTC address
4. **Verify Button** - Reads and displays on-chain commitment

## 🎯 Proof Points

✅ Contract deployed and verified  
✅ `register_guardian` function callable  
✅ Commitments stored on-chain  
✅ UI reads from contract (closes the loop)  
✅ Privacy maintained (only commitment stored, not DNA)  

---

**Note:** The "Verify On-Chain" button appears automatically after successful registration and reads the actual commitment from the deployed contract.
