# Sonic Guardian Cairo Contracts

Zero-knowledge Bitcoin recovery using Pedersen commitments on Starknet.

## Overview

The `SonicGuardian` contract stores Pedersen commitments of acoustic DNA hashes, enabling:
- Private Bitcoin multisig recovery
- Zero-knowledge proof verification
- Anonymous credential management

## Contract Interface

```cairo
trait ISonicGuardian {
    fn register_guardian(
        ref self: TContractState,
        btc_address: felt252,
        commitment: felt252,
        blinding_commitment: felt252
    );
    
    fn verify_recovery(
        self: @TContractState,
        btc_address: felt252,
        dna_hash: felt252,
        blinding: felt252
    ) -> bool;
    
    fn authorize_btc_recovery(
        ref self: TContractState,
        btc_address: felt252,
        proof: RecoveryProof
    ) -> felt252;
    
    fn get_commitment(
        self: @TContractState,
        btc_address: felt252
    ) -> felt252;
}
```

## Functions

### `register_guardian`
Stores a Pedersen commitment for a Bitcoin address.

**Parameters:**
- `btc_address`: Bitcoin address being guarded
- `commitment`: `pedersen_hash(dna_hash, blinding)`
- `blinding_commitment`: Commitment to blinding factor for verification

**Privacy:** The DNA hash never appears on-chain.

### `verify_recovery`
Verifies a recovery attempt using zero-knowledge proof.

**Parameters:**
- `btc_address`: Bitcoin address to recover
- `dna_hash`: Acoustic DNA hash (provided by user)
- `blinding`: Blinding factor (provided by user)

**Returns:** `true` if `pedersen_hash(dna_hash, blinding)` matches stored commitment

### `authorize_btc_recovery`
Authorizes a Bitcoin recovery transaction after successful verification.

**Parameters:**
- `btc_address`: Bitcoin address to recover
- `proof`: Recovery proof structure

**Returns:** Authorization token for sBTC/tBTC bridge

## Prerequisites

### 1. Install Scarb (Cairo Package Manager)

Choose one method:

**Option A: Using curl (Recommended)**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
```

**Option B: Using Homebrew (macOS)**
```bash
brew install scarb
```

**Option C: Using asdf**
```bash
asdf plugin add scarb
asdf install scarb latest
asdf global scarb latest
```

Verify:
```bash
scarb --version
```

### 2. Install Starkli (Deployment Tool)

```bash
curl https://get.starkli.sh | sh
starkliup
```

Verify:
```bash
starkli --version
```

## Building

From the `contracts` directory:

```bash
scarb build
```

Generates:
- `target/dev/sonic_guardian_SonicGuardian.contract_class.json`
- `target/dev/sonic_guardian_SonicGuardian.compiled_contract_class.json`

## Deployment

### Step 1: Setup Account

**Interactive helper:**
```bash
cd .. && pnpm contracts:setup
```

**Or manual:**
```bash
# Create keystore
starkli signer keystore new ~/.starkli-wallets/deployer/keystore.json

# Get testnet ETH: https://starknet-faucet.vercel.app/

# Fetch account
starkli account fetch <YOUR_ADDRESS> \
  --output ~/.starkli-wallets/deployer/account.json \
  --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

### Step 2: Export Variables

```bash
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
export STARKNET_NETWORK=sepolia
```

### Step 3: Deploy

**Automated:**
```bash
cd .. && pnpm contracts:deploy
```

**Manual:**
```bash
# Declare
starkli declare target/dev/sonic_guardian_SonicGuardian.contract_class.json --network sepolia

# Deploy (use class hash from declare)
starkli deploy <CLASS_HASH> --network sepolia
```

### Step 4: Update Environment

Add to `.env.local`:
```env
NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS=0x...
```

## Security Notes

- Never commit keystores or private keys
- Pre-commit hook scans for secrets
- Use `.env.local` for sensitive values (in `.gitignore`)
- Test on Sepolia before mainnet
- Audit contract before production deployment

## Cryptographic Primitives

### Pedersen Commitments

The contract uses Pedersen hash for zero-knowledge commitments:

```cairo
use starknet::pedersen::pedersen_hash;

let commitment = pedersen_hash(dna_hash, blinding_factor);
```

**Properties:**
- **Hiding**: Commitment reveals nothing about DNA
- **Binding**: Cannot change DNA after commitment
- **Deterministic**: Same inputs always produce same commitment

### Verification Flow

```
Registration:
1. Client: commitment = pedersen(dna_hash, blinding)
2. Client → Contract: store commitment
3. Contract: commitments[btc_address] = commitment

Recovery:
1. User provides: dna_hash, blinding
2. Client: computed = pedersen(dna_hash, blinding)
3. Client → Contract: verify(btc_address, dna_hash, blinding)
4. Contract: stored == pedersen(dna_hash, blinding) ?
5. If true: authorize recovery
```

## Testing

```bash
# Run Cairo tests (when added)
scarb test
```

## Troubleshooting

**"command not found: scarb"**
- Restart terminal or `source ~/.bashrc` (or `~/.zshrc`)
- Verify: `which scarb`

**"Account not found"**
- Ensure testnet ETH in account
- Verify account file path
- Check on explorer: https://sepolia.starkscan.co/

**"Class already declared"**
- Normal on redeployment
- Script handles automatically

## Resources

- [Scarb Documentation](https://docs.swmansion.com/scarb/)
- [Starkli Book](https://book.starkli.rs/)
- [Cairo Book](https://book.cairo-lang.org/)
- [Starknet Sepolia Faucet](https://starknet-faucet.vercel.app/)
- [Pedersen Hash](https://docs.starknet.io/documentation/architecture_and_concepts/Cryptography/hash-functions/)
