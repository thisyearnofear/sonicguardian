# Sonic Guardian Contracts

Cairo smart contracts for the Sonic Guardian project on Starknet.

## Quick Deploy

```bash
# From project root
npm run contracts:deploy
```

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.

## Contract Overview

### lib.cairo

Zero-knowledge guardian system for Bitcoin recovery using sonic patterns.

**Features:**
- Register guardians with Pedersen commitments and acoustic public keys
- Verify authorship via ECDSA signature proof (ZK — pattern never revealed)
- Authorize recovery via acoustic signature (ZK, pattern never revealed)
- Privacy-preserving (pattern never revealed on-chain)

**Functions:**
- `register_guardian(btc_address, commitment, blinding_commitment, acoustic_key)` — Register a new guardian
- `verify_acoustic_signature(btc_address, message_hash, signature_r, signature_s)` — ZK verify authorship (view)
- `authorize_with_acoustic_signature(btc_address, message_hash, signature_r, signature_s)` — ZK authorize recovery
- `get_commitment(btc_address)` — Get stored commitment (view)
- `get_acoustic_key(btc_address)` — Get stored public key (view)
- `get_guardian_count()` — Get total guardians registered (view)
- `get_version()` — Get contract version (view)

**Deprecated entrypoints** (removed from contract, kept in ABI for backwards compat):
- `verify_recovery(btc_address, dna_hash, blinding)` — requires revealing DNA hash
- `authorize_btc_recovery(btc_address, dna_hash, blinding)` — requires revealing DNA hash
- `create_onchain_gift` / `claim_onchain_gift` — feature-creep removed
- `get_vault_commitment` — gifting abandoned

### recovery_helper.cairo

STRK20 privacy pool anonymizer: privately invoke `authorize_with_acoustic_signature` inside the pool, atomic and unlinkable to the user.

## Development

### Build
```bash
scarb build
```

### Test
```bash
scarb test
```

### Format
```bash
scarb fmt
```

## Architecture

```
User generates sonic pattern
    ↓
Client extracts DNA hash (SHA-256)
    ↓
Derive acoustic key pair: private_key = dna_hash → public_key = stark_curve(private_key)
    ↓
Compute Pedersen commitment = pedersen(dna_hash, blinding)
    ↓
Store commitment + acoustic_key on Starknet (privacy preserved!)
    ↓
Recovery: Replay pattern → extract DNA → sign message with DNA as private key
    ↓
Contract verifies ECDSA signature against stored acoustic_key (no DNA revealed!)
    ↓
If valid: Authorization confirmed
```

## Security

- **Zero-knowledge**: Pattern never revealed on-chain — only commitment + public key stored
- **Pedersen commitments**: Cryptographically secure hiding with fresh blinding factor per registration
- **Acoustic signatures**: DNA hash acts as ECDSA private key, proving authorship without revealing the pattern
- **One-time registration**: Each BTC address can only register once
- **Plausible deniability**: Anyone can deny the pattern since only the commitment is on-chain

## Resources

- [Starknet Docs](https://docs.starknet.io/)
- [Cairo Book](https://book.cairo-lang.org/)
- [Scarb Docs](https://docs.swmansion.com/scarb/)
