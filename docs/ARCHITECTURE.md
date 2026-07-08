# Architecture

## Privacy-First Design

Sonic Guardian is built **privacy-first by design** — no musical pattern, DNA hash, or biometric data ever touches the blockchain or a server. Only cryptographic commitments and public keys are stored on-chain, providing **zero-knowledge proof of authorship** without revealing the underlying identity.

## Data Flow

```
User Vibe ("dark industrial techno")
    → Venice AI (vibe → Strudel code, privacy-preserving inference)
    → Client-side DNA Extraction (SHA-256 feature hash)
    → Client-side Pedersen Commitment (dna_hash || blinding_factor)
    → Starknet: stores commitment + acoustic public key only
```

### Verification Flow (ZK Path — Preferred)

```
User replays musical pattern
    → Client-side DNA Extraction (SHA-256)
    → Off-chain ECDSA signature using DNA hash as private key
    → Starknet: verify_acoustic_signature(message, sig_r, sig_s) against stored public key
    → Result: ✓ Verified without revealing DNA or pattern
```

## Privacy Guarantees

| Stage | What Happens | Where | Data On-Chain? |
|-------|-------------|-------|----------------|
| Pattern Synthesis | Venice AI translates vibe → Strudel code | Venice AI → Browser | ❌ |
| DNA Extraction | SHA-256 feature hash of musical pattern | Browser (client-side) | ❌ |
| Commitment | `Pedersen(dna_hash, blinding_factor)` → felt252 | Browser (client-side) | ✅ Commitment only |
| **ZK Verification** | **ECDSA signature proving DNA knowledge — no DNA revealed** | **Browser → Contract** | **✅ Signature only** |
| Legacy Verification | `Pedersen(dna_hash, blinding) == stored_commitment` — requires revealing DNA | Browser → Contract | ⚠️ Reveals DNA hash |
| Backup | AES-GCM encrypted (wallet-derived key) | Browser → IPFS | ❌ (encrypted) |
| Recovery | Replay pattern, verify via acoustic ZK signature | Browser ↔ Contract | ❌ (ZK verified) |

> **Note:** The ZK verification path using `verify_acoustic_signature` / `authorize_with_acoustic_signature` is the **preferred** method. It proves authorship without ever revealing the DNA hash. The legacy `verify_recovery` path which reveals the DNA hash is deprecated at the application layer.

## Zero-Knowledge Proof Flow

### Registration
1. User generates a musical pattern (via AI or 256-bit entropy)
2. Client extracts DNA: `sha256(musical_features)`
3. Derives acoustic key pair: `private_key = dna_hash`, `public_key = stark_curve(private_key)`
4. Computes Pedersen commitment: `commitment = pedersen(dna_hash, blinding)`
5. Sends to Starknet: `register_guardian(btc_address, commitment, blinding_commitment, public_key)`
6. On-chain: stores the commitment, public key, and emits `GuardianRegistered` event

### Verification (ZK — No DNA Revealed)
1. User replays their musical pattern
2. Client extracts DNA hash (same process as registration)
3. Generates ECDSA signature: `sign(dna_hash, challenge_message)`
4. Sends to Starknet: `authorize_with_acoustic_signature(btc_address, message, sig_r, sig_s)`
5. Contract verifies: `check_ecdsa_signature(message, stored_public_key, sig_r, sig_s)`
6. If valid → authorship confirmed. **Contract never learns the DNA hash.**

```cairo
// True zero-knowledge: contract verifies without seeing your DNA
fn verify_acoustic_signature(
    btc_address: felt252,
    message_hash: felt252,
    signature_r: felt252,
    signature_s: felt252
) -> bool {
    let public_key = self.acoustic_keys.read(btc_address);
    check_ecdsa_signature(message_hash, public_key, signature_r, signature_s)
}
```

## Key Privacy Properties

- **Blinding factors**: Every commitment uses a random 256-bit blinding factor, ensuring the same pattern produces a different commitment each time (prevents brute-force matching)
- **Client-side only**: SHA-256 extraction, Pedersen computation, and ECDSA signing all happen in the browser. The server never sees musical data
- **Encrypted backups**: IPFS backups are AES-GCM encrypted with a wallet-derived key. The IPFS gateway never sees unencrypted data
- **Plausible deniability**: Since only the commitment is on-chain, the user can deny knowledge of any specific pattern. Only someone who knows the pattern can prove it

## Tech Stack

- **Frontend**: Next.js 14, Three.js visualizer
- **AI**: Venice AI (privacy-first inference)
- **Audio**: Strudel (live-coded synthesis)
- **Blockchain**: Starknet (commitments, ZK signature verification)
- **ZK Primitives**: `core::pedersen::pedersen`, `core::ecdsa::check_ecdsa_signature`
- **Wallet**: Starknet.js, WalletConnect, Xverse

## Key Modules

| Module | Purpose |
|--------|---------|
| `ai-agent.ts` | Vibe → Strudel code (Venice AI) |
| `dna.ts` | Pattern → SHA-256 DNA hash |
| `crypto.ts` | Pedersen commitments, ECDSA acoustic signatures |
| `entropy-encoder.ts` | 256-bit entropy → musical chunks |
| `storage.ts` | Session management, vault encryption |
| `abi.ts` | Contract interface (Cairo ABI) |
