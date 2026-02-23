# Sonic Guardian | Privacy Architecture

Sonic Guardian provides **privacy-preserving Bitcoin recovery** using acoustic commitments and zero-knowledge proofs on Starknet. This document outlines the cryptographic measures that protect user recovery credentials.

## 🛡️ 1. Pedersen Commitments (Zero-Knowledge Proofs)
The core privacy primitive is the **Pedersen commitment scheme**, a cryptographically binding and hiding commitment.

- **Commitment Phase**: `commitment = pedersen_hash(dna_hash, blinding_factor)`
- **Hiding Property**: The commitment reveals nothing about the DNA hash
- **Binding Property**: Cannot change the DNA after commitment
- **Zero-Knowledge Verification**: Prove knowledge of DNA without revealing it

This is a true zero-knowledge construction, not simple hash comparison.

## 🔐 2. Private Recovery Flow
Recovery happens without exposing the acoustic DNA on-chain:

1. **Registration**: Store `pedersen(dna_hash, blinding)` on Starknet
2. **Recovery Request**: User provides `dna_hash` and `blinding` locally
3. **Proof Generation**: Client computes commitment locally
4. **Verification**: Contract verifies commitment match without seeing DNA
5. **Authorization**: If valid, authorize Bitcoin recovery transaction

The DNA hash never appears on-chain in plaintext.

## 🤖 3. Privacy-Focused Inference (Venice AI)
Acoustic synthesis uses **Venice AI** for privacy-preserving inference:
- **No Logging**: Venice does not log prompts or use data for training
- **Decentralized**: Permissionless inference infrastructure
- **Local Processing**: DNA extraction happens client-side
- **No Backend**: Static build with zero server-side data collection

## 🧬 4. Acoustic DNA Extraction
The acoustic DNA is derived from normalized AST features:

- **AST Parsing**: Extract musical features from Strudel code
- **Normalization**: Sort and deduplicate features for consistency
- **Deterministic**: Same vibe always produces same DNA
- **One-Way**: Cannot reverse DNA back to original vibe

The DNA serves as a memorable, reproducible secret for the commitment scheme.

## ⛓️ 5. On-Chain Privacy (Starknet)
- **Commitment Storage**: Only Pedersen commitments stored on-chain
- **No Hash Exposure**: DNA hash never appears in plaintext
- **Anonymous Recovery**: Prove ownership without revealing identity
- **BTC Address Mapping**: Private link between commitment and Bitcoin address

## 🔋 6. Client-Side Security
- **Local Blinding**: Blinding factors generated client-side using Web Crypto API
- **Secure Storage**: Blinding factors stored in encrypted localStorage
- **No Transmission**: Secrets never leave the user's device
- **Static Build**: No backend to compromise

## 🎯 Privacy Guarantees

**What's Hidden:**
- The acoustic DNA hash (via Pedersen commitment)
- The original vibe description (via one-way extraction)
- The blinding factor (never transmitted)
- Recovery attempts (verified locally before on-chain submission)

**What's Public:**
- The Pedersen commitment (reveals nothing)
- The Bitcoin address being guarded (necessary for recovery)
- Successful recovery events (required for Bitcoin authorization)

---
**Sonic Guardian: Private Bitcoin recovery through acoustic commitments.**
