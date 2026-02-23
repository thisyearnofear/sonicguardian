# Sonic Guardian | Starknet Privacy Track

Sonic Guardian is a **ZK-Acoustic Privacy Protocol** that transforms subjective musical "vibes" into immutable, privacy-preserving credentials on Starknet.

## 🧬 Innovation: Acoustic Hashing & Strudel Mechanisms
Instead of static seed phrases, we utilize **Strudel Recursive Patterns** to generate deterministic cryptographic identity.

1.  **Acoustic Synthesis**: A user's vibe (e.g., *"Deep Sea Pulse"*) is processed via a deterministic Neural Agent into **Strudel Pattern Code**. 
2.  **AST-to-Felt Normalization**: We parse the Strudel AST to extract unique musical features (oscillators, filters, rhythmic density). These are normalized into a `felt252` commitment.
3.  **On-Chain Anchoring**: The commitment is anchored to a Cairo Guardian contract.
4.  **ZK-Proof of Frequency**: Recovery is performed by re-synthesizing the vibe. The verifier proves the new pattern matches the on-chain hash without revealing the original description or the full pattern.

## 🛡️ Privacy Track Alignment
We implement several key primitives requested for the Starknet Privacy Track:

*   **Anonymous Credentials System**: Sonic DNA acts as an anonymous, multi-factor credential that doesn't rely on PII (Personally Identifiable Information).
*   **ZK-Social Recovery Integration**: By framing identity as a "Social Vibe," we align with **Sumo Login** and social-attestation patterns.
*   **Acoustic Sigma Protocols**: The verification flow mimics a Sigma protocol where the "Knowledge of a Vibe" is the secret being proven.
*   **Shielded UI/UX**: The entire interface is designed for premium, privacy-first consumer interactions, providing a "Shielded Wallet" experience for identity.

## 🛠️ Technical Stack
*   **Next.js 14**: High-fidelity, reactive frontend.
*   **Starknet.js & Starknet React**: Native connection to Argent-X & Braavos.
*   **Cairo 1.0**: Optimized on-chain commitment storage and verification.
*   **Three.js**: Real-time visualization of the "Sonic Singularity" DNA structure.

## 🚀 Hackathon Strategy
1.  **Expose the Strudel Genius**: We provide a "Frequency Library" in the UI to demonstrate how specific musical parameters deterministically change the DNA structure.
2.  **The "Vibe-to-Proof" Narrative**: We move Starknet identity from a 24-word mechanical chore to an experiential, privacy-preserving ritual.

### Contract Details (Sepolia)
*   **Contract Logic**: `contracts/src/lib.cairo`
*   **Frontend Hook**: `src/hooks/use-starknet-guardian.ts`
*   **Interface**: `ISonicGuardian`
