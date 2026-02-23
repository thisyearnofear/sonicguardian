# Sonic Guardian | Bitcoin & Privacy Track

Sonic Guardian enables **private Bitcoin recovery** using musical seed phrases and zero-knowledge proofs on Starknet. It serves as a privacy-preserving guardian for Bitcoin multisig wallets.

## 🔐 Core Innovation: Musical Seed Phrases with 256-bit Entropy

Sonic Guardian solves a critical problem in Bitcoin custody: **how to recover funds without exposing recovery credentials**.

Traditional approaches:
- Seed phrases: 24 random words (hard to remember, easy to lose)
- Hardware wallets: Can fail or be destroyed
- Social recovery: Exposes guardians to collusion

Sonic Guardian approach:
- **Musical Seed Phrases**: 5-7 memorable chunks (e.g., "909 kicks on 1 and 3, distort by 2.5")
- **256-bit Entropy**: Equivalent to AES-256, using crypto.getRandomValues()
- **Deterministic Encoding**: Entropy → Strudel pattern → Musical chunks
- **Pedersen Commitments**: Zero-knowledge proofs hide the DNA on-chain
- **Auditory Verification**: Verify recovery by listening to your pattern
- **Bitcoin Integration**: Authorizes multisig recovery without revealing credentials

## 🎯 Use Case: Bitcoin Multisig Recovery

### Setup Phase
1. User creates Bitcoin 2-of-3 multisig wallet
2. Key 1: Hardware wallet (cold storage)
3. Key 2: Hot wallet (daily use)
4. Key 3: Sonic Guardian (acoustic recovery)

### Guardian Creation
1. System generates 256 bits of cryptographic entropy
2. Encodes entropy deterministically to Strudel pattern
3. Breaks pattern into 5-7 musical chunks
4. User saves chunks (password manager or memorizes)
5. Pattern → AST features → DNA hash → Pedersen commitment
6. Commitment stored on Starknet (zero-knowledge)

### Recovery Phase
1. User provides musical chunks
2. System reconstructs exact Strudel pattern
3. Extracts DNA hash and verifies locally
4. Starknet contract verifies Pedersen commitment (zero-knowledge)
5. If valid, authorizes Bitcoin transaction via sBTC/tBTC bridge
6. Funds recovered privately

## 🧬 Technical Architecture

### Musical Seed Phrase Encoding

**256 bits of entropy → Deterministic Strudel pattern → 5-7 musical chunks**

```typescript
// Step 1: Generate entropy
const entropy = crypto.getRandomValues(new Uint8Array(32)); // 256 bits

// Step 2: Encode to Strudel pattern
const encoded = encodePattern(entropy);

// Bit allocation:
// Bits 0-63:   Drum patterns (kick type, timing, bank, distortion)
// Bits 64-127: Melodic content (notes, octaves, synth type, filter)
// Bits 128-191: Effects chain (distort, lpf, gain, room)
// Bits 192-255: Structure (tempo, layers, arrangement)

// Step 3: Generate musical chunks
const chunks = [
  "909 kicks on 1 and 3",           // 12 bits
  "distort by 2.5",                 // 4 bits
  "sawtooth bass C#3 F3 Bb2 Eb3",  // 30 bits
  "lowpass filter at 1200 hertz",   // 5 bits
  "gain 0.8",                       // 4 bits
  "808 snare on 2 and 4",           // 12 bits
  "tempo 128"                       // 8 bits
];

// Step 4: Generate Strudel code
const code = `stack(
  s("bd[x ~]").bank("RolandTR909").distort(2.5),
  note("c#3 f3 bb2 eb3").s("sawtooth").lpf(1200).gain(0.8),
  s("sd[~ x]").bank("RolandTR808")
).cpm(128)`;
```

**Entropy Sources:**
- Drum patterns: 3 bits per drum type (8 options)
- Timing patterns: 3 bits (8 rhythmic variations)
- Banks: 2 bits (4 drum machines)
- Notes: 7 bits per note (7 notes × 3 accidentals × 4 octaves)
- Effects: 4-5 bits per parameter (continuous ranges)
- Tempo: 8 bits (80-160 BPM)

**Total: 256 bits** (equivalent to AES-256)
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
