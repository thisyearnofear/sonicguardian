# Sonic Guardian | Starknet Privacy Track

Sonic Guardian is a **ZK-Acoustic Privacy Protocol** that transforms subjective musical "vibes" into immutable, privacy-preserving credentials on Starknet.

## 🧬 Innovation: Agentic Acoustic Synthesis
The core innovation of Sonic Guardian is the **Agentic Bridge** between human intuition and deterministic live-coding.

1.  **Subjective to Technical**: Users define a "Vibe" (e.g., *"$: s("[bd <hh oh>]*2").bank("tr909").dec(.4)"*). Instead of requiring users to be live-coding experts, our **Privacy-Focused AI Agent (Venice AI)** agentically crafts the precise Strudel pattern.
2.  **Sound-Verified Identity**: This isn't just a static string. The user **hears** their identity. The magic lies in the immediate translation of code to sound, creating a memorable, experiential key rather than a mechanical one.
3.  **Acoustic Hashing**: We parse the Strudel AST to extract unique musical features (oscillators, filters, rhythmic density), normalizing them into a `felt252` commitment anchored on Starknet.

## 🛡️ Privacy Track Alignment
We implement several key primitives requested for the Starknet Privacy Track. For a deep dive into our privacy measures, see [PRIVACY.md](./PRIVACY.md).

*   **Venice AI Integration**: By defaulting to **Venice AI**, we ensure that the "Vibe Synthesis" phase is private and decentralized. Venice provides permissionless, privacy-preserving inference, ensuring that a user's secret "vibe" never touches centralized logging systems.
*   **Anonymous Credentials**: Sonic DNA acts as an anonymous, multi-factor credential.
*   **Acoustic Sigma Protocols**: Verification flow proves "Knowledge of a Vibe" without exposure.

## 🕹️ The User Journey
1.  **Vibe Entrance**: User defines a subjective "Sonic Signature" (e.g., "Deep sea techno pulse").
2.  **Agentic Synthesis**: Our privacy-focused agent translates the vibe into Strudel pattern code.
3.  **DNA Extraction**: We parse the code's **AST** to extract deterministic "resonant features," creating a stable **Sonic DNA** hash.
4.  **On-Chain Anchor**: The user connects their Starknet wallet and stores the DNA hash as an immutable commitment.
5.  **Acoustic Recovery**: To verify, the user re-enters their vibe. If the newly synthesized DNA matches the on-chain anchor, access is granted.

## 🏗️ Project Status & AX
- **Mobile Optimized**: The UI is fully responsive, bringing a premium "Resonant Identity" experience to mobile devices.
- **Pure Private Inference**: Non-private fallbacks (Gemini) have been removed to ensure protocol integrity.
- **Agent Experience (AX)**: We provide a [SKILL.md](./SKILL.md) for LLM agents to programmatically integrate with the Sonic Guardian protocol.

---
**Build Strategy**: Static Next.js Export for Zero-Backend trust and IPFS compatibility.

## 🛠️ Technical Stack
*   **Next.js 14**: High-fidelity, reactive frontend.
*   **Venice AI**: Default privacy-focused inference backbone.
*   **Strudel Engine**: Real-time acoustic synthesis and AST generation.
*   **Starknet & Cairo**: Secure, high-performance on-chain anchoring.

## 🚀 Hackathon Strategy: The "Vibe-to-Proof" Narrative
We move Starknet identity from a 24-word mechanical chore to an experiential, privacy-preserving ritual. The judge doesn't just see a hash; they see the code being generated and hear the unique frequency being minted.

### Contract Details (Sepolia)
*   **Contract Logic**: `contracts/src/lib.cairo`
*   **Frontend Hook**: `src/hooks/use-starknet-guardian.ts`
*   **Interface**: `ISonicGuardian`
