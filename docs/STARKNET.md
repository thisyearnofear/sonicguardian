# Sonic Guardian | Starknet Privacy Track

This project implements a **ZK-Acoustic Recovery Protocol** for Starknet, designed for the Privacy Track.

## 🧬 Innovation: Acoustic Hashing
Instead of relying on insecure "secret phrases" or complex hardware, Sonic Guardian uses **Strudel Recursive Patterns** to generate a deterministic "Sonic DNA".

1.  **Sonic DNA Extraction**: A user's "vibe" (e.g., "fast dark techno loop") is synthesized into a unique Strudel live-coding pattern.
2.  **Cryptographic Commitment**: We extract the AST (Abstract Syntax Tree) of the pattern, normalize it, and hash it into a `felt252` commitment.
3.  **On-Chain Anchoring**: This commitment is saved to the `SonicGuardian.cairo` contract on Starknet.
4.  **ZK-Proof of Frequency**: To recover a wallet, the user re-synthesizes their vibe. The system proves the new pattern matches the on-chain commitment without ever exposing the original vibe or the full pattern.

## 🛠️ Technical Stack
*   **Next.js 14**: Premium frontend experience.
*   **Starknet.js & Starknet React**: Seamless wallet integration (Argent/Braavos).
*   **Cairo 1.0**: On-chain guardian contract for immutable identity anchoring.
*   **Three.js**: High-fidelity visualization of the "Sonic Singularity".

## 🚀 Hackathon Positioning
*   **Privacy Track**: Solves the "Secret Recovery Phrase" problem with a privacy-preserving acoustic alternative.
*   **Technical Depth**: Features a custom Cairo contract and complex AST parsing logic for DNA extraction.
*   **UX Frontier**: Moves Starknet identity from "mechanical" to "experiential".

### Contract Details (Sepolia)
*   **Contract**: `contracts/src/lib.cairo`
*   **Interface**: `ISonicGuardian`
*   **Methods**: `register_identity(commitment)`, `verify_identity(proof_hash)`
