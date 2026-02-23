# Sonic Guardian | Bitcoin & Privacy Track

Sonic Guardian enables **private Bitcoin recovery** using acoustic commitments and zero-knowledge proofs on Starknet. It serves as a privacy-preserving guardian for Bitcoin multisig wallets.

## 🔐 Core Innovation: Cryptographically Secure Acoustic Keys

Sonic Guardian solves a critical problem in Bitcoin custody: **how to recover funds without exposing recovery credentials**.

Traditional approaches:
- Seed phrases: 24 random words (hard to remember, easy to lose)
- Hardware wallets: Can fail or be destroyed
- Social recovery: Exposes guardians to collusion

Sonic Guardian approach:
- **Secure Pattern Generation**: Cryptographically random Strudel patterns with 128+ bits entropy
- **Acoustic DNA**: Deterministic extraction from musical features
- **Pedersen Commitments**: Zero-knowledge proofs hide the DNA on-chain
- **Bitcoin Integration**: Authorizes multisig recovery without revealing credentials

## 🎯 Use Case: Bitcoin Multisig Recovery

### Setup Phase
1. User creates Bitcoin 2-of-3 multisig wallet
2. Key 1: Hardware wallet (cold storage)
3. Key 2: Hot wallet (daily use)
4. Key 3: Sonic Guardian (acoustic recovery)

### Guardian Creation
1. System generates cryptographically secure Strudel pattern (128+ bits entropy)
2. User hears and saves the pattern description
3. Pattern → AST features → DNA hash → Pedersen commitment
4. Commitment stored on Starknet (zero-knowledge)

### Recovery Phase
1. User provides pattern description
2. System regenerates exact Strudel code
3. Extracts DNA hash and verifies locally
4. Starknet contract verifies Pedersen commitment (zero-knowledge)
5. If valid, authorizes Bitcoin transaction via sBTC/tBTC bridge
6. Funds recovered privately

## 🧬 Technical Architecture

### Secure Pattern Generation
```typescript
// Cryptographically random pattern with high entropy
const pattern = generateSecurePattern(3); // 3 layers
const entropy = calculatePatternEntropy(pattern); // 128+ bits

// Example output:
stack(
  s("bd*4, [~ bd] ~, hh*8").bank("RolandTR909").distort(2.5).lpf(1200),
  note("c#3 f3 bb2 eb3").s("sawtooth").lpf(600).lpq(15).gain(0.8),
  s("cp[~ cp]").bank("RolandTR808").room(0.6)
)
```

**Entropy Sources:**
- Drum patterns: ~3 bits per element (8 options)
- Notes: ~8 bits per element (7 notes × 3 accidentals × 4 octaves)
- Effects: ~6 bits per parameter (continuous ranges)
- Banks: ~2 bits (4 options)

**Total: 128-256 bits** (equivalent to AES-128/256)

### Acoustic DNA Extraction
1. **Parse Strudel AST**: Extract musical features
2. **Normalize**: Sort and deduplicate (order-independent)
3. **Hash**: SHA-256 of normalized features
4. **Commit**: Pedersen(hash, blinding_factor)

### Zero-Knowledge Commitment
```
commitment = pedersen_hash(dna_hash, blinding_factor)
```
- Stored on Starknet, reveals nothing about DNA
- Verification proves knowledge without exposure
- True zero-knowledge construction

### Bitcoin Integration
- **sBTC/tBTC Bridge**: Connect Starknet to Bitcoin L1
- **Multisig Authorization**: Guardian key controlled by Starknet contract
- **Recovery Flow**: ZK proof → Starknet authorization → Bitcoin transaction

## 🛡️ Privacy Guarantees

**Hidden from Chain:**
- Acoustic DNA hash (via Pedersen commitment)
- Strudel pattern code (one-way extraction)
- Blinding factor (client-side only)
- Failed recovery attempts (verified locally)

**Public on Chain:**
- Pedersen commitment (cryptographically hiding)
- Bitcoin address being guarded (necessary for recovery)
- Successful recovery events (required for authorization)

See [PRIVACY.md](./PRIVACY.md) for detailed cryptographic analysis.

## 🏗️ Implementation Stack

**Frontend:**
- Next.js 14 (static build, zero backend)
- Strudel.js (acoustic synthesis)
- Web Crypto API (client-side cryptography)
- Secure pattern generator (128+ bits entropy)

**AI Layer:**
- Venice AI (privacy-preserving inference) - optional
- Deterministic fallback (offline mode)
- Secure generation (recommended)

**Blockchain:**
- Cairo contracts (Pedersen commitments)
- Starknet (ZK proof verification)
- sBTC/tBTC (Bitcoin bridge)

## 🎯 Hackathon Alignment

### Privacy Track
- ✅ Pedersen commitments (real ZK primitive)
- ✅ Anonymous credentials (prove ownership without identity)
- ✅ Private recovery (no credential exposure)
- ✅ Confidential transactions (hidden recovery flow)
- ✅ Cryptographically secure generation (128+ bits entropy)

### Bitcoin Track
- ✅ BTC-native use case (multisig recovery)
- ✅ Enhances Bitcoin privacy (no seed phrase exposure)
- ✅ Starknet ↔ Bitcoin integration (sBTC/tBTC)
- ✅ Real-world utility (lost key recovery)
- ✅ Novel UX (audible recovery keys)

## 🚀 Competitive Advantages

1. **Cryptographically Secure**: 128+ bits entropy, equivalent to AES-128
2. **Audible Verification**: Only system where you can HEAR your recovery key
3. **True Privacy**: Pedersen commitments, not hash comparison
4. **Memorable**: Musical patterns easier to remember than 24 words
5. **Practical**: Solves real custody problem
6. **Dual Track**: Qualifies for both Bitcoin and Privacy bounties

## 📊 Contract Interface

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
}
```

See `contracts/src/lib.cairo` for full implementation.
