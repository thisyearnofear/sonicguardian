# Sonic Guardian Contracts

Cairo smart contracts for the Sonic Guardian project on Starknet.

## Quick Deploy

```bash
# From project root
npm run contracts:deploy
```

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.

## Contract Overview

### SonicGuardian.cairo

Zero-knowledge guardian system for Bitcoin recovery using sonic patterns.

**Features:**
- Register guardians with Pedersen commitments
- Verify recovery using ZK proofs
- Authorize Bitcoin recovery with acoustic signatures
- Privacy-preserving (pattern never revealed on-chain)

**Functions:**
- `register_guardian(btc_address, commitment, blinding_commitment)` - Register a new guardian
- `verify_recovery(btc_address, dna_hash, blinding)` - Verify recovery proof
- `authorize_btc_recovery(btc_address, dna_hash, blinding)` - Authorize recovery and get token
- `get_commitment(btc_address)` - Get stored commitment
- `get_guardian_count()` - Get total guardians registered

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
Extract DNA hash from pattern
    ↓
Generate blinding factor
    ↓
Compute Pedersen commitment = pedersen(dna_hash, blinding)
    ↓
Store commitment on Starknet (privacy preserved!)
    ↓
Recovery: Provide dna_hash + blinding
    ↓
Contract verifies: pedersen(dna_hash, blinding) == stored_commitment
    ↓
If valid: Issue recovery authorization token
```

## Security

- **Zero-knowledge**: Pattern never revealed on-chain
- **Pedersen commitments**: Cryptographically secure hiding
- **Blinding factors**: Prevent rainbow table attacks
- **One-time registration**: Each BTC address can only register once
- **Verifiable recovery**: Anyone can verify without revealing the pattern

## Resources

- [Starknet Docs](https://docs.starknet.io/)
- [Cairo Book](https://book.cairo-lang.org/)
- [Scarb Docs](https://docs.swmansion.com/scarb/)
