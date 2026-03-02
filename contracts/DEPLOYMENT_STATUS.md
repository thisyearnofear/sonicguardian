# 🚀 Sonic Guardian - Contract Deployment Status

## ✅ COMPLETED: CONTRACT DEPLOYED!

### Contract Address
```
0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de
```

**Explorer Links:**
- [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)
- [Starkscan](https://sepolia.starkscan.co/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

**Deployment Tool:** starknet-foundry (sncast)
**Cairo Version:** 2.16.0 with universal-sierra-compiler v2.7.0

---

## ✅ Account Deployment

**Account Address:**
```
0x023e62ffc2122b734cb6df18d9920001ccb5acde8a775592820049b9e27855df
```

**Transaction:**
- [View on Starkscan](https://sepolia.starkscan.co/tx/0x06ba17c934fe2480c1e1f2fbc6afba661b642fc60b8beddba6b9b397134c476e)
- [View on Voyager](https://sepolia.voyager.online/tx/0x06ba17c934fe2480c1e1f2fbc6afba661b642fc60b8beddba6b9b397134c476e)

**Funding:**
- ✅ 0.05 ETH (Sepolia) - Received
- ✅ STRK (Sepolia) - Received

---

## ✅ Contract Build

```bash
cd contracts
scarb build
# Compiles successfully with Cairo 2.16.0
```

**Contract Class Hash (Sierra):**
```
0x029f7bf9199f28ce2f885f859e56e3d1d94d894c3cea73f5d078c38ef8271a1d
```

## ✅ Contract Deployment
**Status:** ✅ **DEPLOYED**

**Contract Address:**
```
0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de
```

**Class Hash:**
```
0x003ad2e4c2bac8392ba214743c6494a06e76bb74755109bd0dced3840e3076ed
```

**Transaction:**
- [View on Voyager](https://sepolia.voyager.online/tx/0x06e589ecb5f57e25b0786f64b43ab1fbc031f731cf83eb8645023caa463523cc)
- [View on Starkscan](https://sepolia.starkscan.co/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

**Deployed with:** `sncast` (starknet-foundry v0.57.0) + `universal-sierra-compiler` v2.7.0

---

## 📝 Previous Issue: Cairo Compiler Version Mismatch (Resolved)

### Issue: Cairo Compiler Version Mismatch

**Problem:**
- Scarb uses Cairo 2.16.0
- Starkli uses Cairo 2.11.4 for CASM compilation
- Network validates against CASM hash computed by network's compiler
- CASM hash mismatch prevents declaration

**Error:**
```
Mismatch compiled class hash for class with hash 0x29f7bf...
Actual: 0x2a44d5... (starkli's compilation)
Expected: 0x98f3de... (network's cached compilation)
```

### Solution: Use `--casm-file` flag

**Fix:** Pass the Scarb-compiled CASM file directly to starkli so it skips its own CASM compilation:

```bash
starkli declare \
  target/dev/sonic_guardian_SonicGuardian.contract_class.json \
  --casm-file target/dev/sonic_guardian_SonicGuardian.compiled_contract_class.json \
  --account ~/.starkli-wallets/sonicguardian/account.json \
  --keystore ~/.starkli-wallets/sonicguardian/keystore.json \
  --rpc https://starknet-sepolia.g.alchemy.com/v2/HXlRKIGaIPmjVLKTtnZvK \
  --watch
```

**Why this works:** `--casm-file` tells starkli to use Scarb's pre-compiled CASM (Cairo 2.16.0) instead of re-compiling with its bundled Cairo 2.11.4.

**Note:** The old Sierra class hash (`0x29f7bf...`) is permanently cached on the network with a mismatched CASM. The contract was updated with a `get_version()` function to produce a fresh Sierra hash.

**Prerequisite:** `Scarb.toml` must have `casm = true` under `[[target.starknet-contract]]` (already configured).

## 📋 Contract Interface

Once deployed, the contract will expose:

```cairo
trait ISonicGuardian {
    fn register_guardian(
        btc_address: felt252,
        commitment: felt252,
        blinding_commitment: felt252
    );
    
    fn verify_recovery(
        btc_address: felt252,
        dna_hash: felt252,
        blinding: felt252
    ) -> bool;
    
    fn authorize_btc_recovery(
        btc_address: felt252,
        dna_hash: felt252,
        blinding: felt252
    ) -> felt252;
    
    fn get_commitment(btc_address: felt252) -> felt252;
    fn get_guardian_count() -> u256;
    fn get_version() -> felt252;
}
```

## 🔧 Manual Deployment Steps

When tooling is ready:

```bash
cd contracts

# 1. Build
scarb build

# 2. Declare (--casm-file avoids compiler version mismatch)
starkli declare \
  target/dev/sonic_guardian_SonicGuardian.contract_class.json \
  --casm-file target/dev/sonic_guardian_SonicGuardian.compiled_contract_class.json \
  --account ~/.starkli-wallets/sonicguardian/account.json \
  --keystore ~/.starkli-wallets/sonicguardian/keystore.json \
  --keystore-password "" \
  --rpc https://starknet-sepolia.g.alchemy.com/v2/HXlRKIGaIPmjVLKTtnZvK \
  --watch

# 3. Deploy (replace CLASS_HASH with output from declare)
starkli deploy \
  CLASS_HASH \
  --account ~/.starkli-wallets/sonicguardian/account.json \
  --keystore ~/.starkli-wallets/sonicguardian/keystore.json \
  --keystore-password "" \
  --rpc https://starknet-sepolia.g.alchemy.com/v2/HXlRKIGaIPmjVLKTtnZvK \
  --watch
```

## 📊 Hackathon Submission Status

### Privacy Track Requirements
- ✅ Pedersen commitment implementation
- ✅ Zero-knowledge verification logic
- ✅ Private recovery flow
- ✅ Cairo contract code
- ✅ Deployed contract address
- ✅ On-chain transaction proof

### What Judges Can See Now
1. **Working Account**: Deployed and funded on Sepolia
2. **Buildable Contract**: Compiles successfully with Scarb
3. **Complete Code**: Full Cairo implementation with ZK primitives
4. **Documentation**: Comprehensive README and deployment guide

### What's Needed for Full Submission
1. Deploy contract to Sepolia (tooling issue)
2. Get contract address
3. Add Voyager/Starkscan links to README
4. Record demo showing on-chain verification

## 🛠️ Environment Setup

```bash
# Required versions
scarb 2.16.0 (Cairo 2.16.0)
starkli 0.4.2+ (needs upgrade for Cairo 2.16 support)

# Account files
~/.starkli-wallets/sonicguardian/account.json
~/.starkli-wallets/sonicguardian/keystore.json

# RPC Endpoint
https://starknet-sepolia.g.alchemy.com/v2/HXlRKIGaIPmjVLKTtnZvK
```

## 📝 Next Steps

1. **Immediate**: Try Voyager web deployment as workaround
2. **Short-term**: Upgrade starkli for Cairo 2.16 support  
3. **Alternative**: Deploy to Katana local devnet for demo
4. **Document**: Add deployment troubleshooting to README

---

**Last Updated:** March 2, 2026  
**Network:** Starknet Sepolia Testnet  
**Status:** Ready for deployment (tooling compatibility issue)
