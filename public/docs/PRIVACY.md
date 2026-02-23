# Sonic Guardian | Privacy Architecture

Sonic Guardian is designed with **Privacy-First** principles at its core. This document outlines the technical measures taken to ensure that user identities and secret recovery "vibes" remain private, secure, and decentralized.

## 🛡️ 1. Zero-Backend Architecture (Static Build)
The Sonic Guardian client is built as a **static Next.js application**. 
- **Local Synthesis**: All translation from human intuition to Strudel pattern code happens within the user's browser environment.
- **No Data Exfiltration**: There is no centralized backend server that receives, logs, or stores the user's secret "vibe" or the resulting code.
- **Client-Side Hashing**: The cryptographic commitment (`felt252`) is generated locally using the Web Crypto API before being sent to the Starknet network.

## 🤖 2. Privacy-Focused Inference (Venice AI)
We utilize **Venice AI** as the primary inference provider for sonic synthesis.
- **Permissionless & Private**: Venice provides decentralized inference that does not log prompts or use user data for model training.
- **Anonymous Bridge**: By routing synthesis through a privacy-preserving provider, we ensure that even the AI phase of identity creation adheres to ZK principles.

## 🧬 3. Acoustic Hashing & AST Normalization
To prevent information leakage and ensure robustness, we do not hash the raw secret text or the raw generated code.
- **Feature Extraction**: We parse the generated code into an **Abstract Syntax Tree (AST)**.
- **Normalization**: We extract only the technical "Acoustic Features" (e.g., `bank`, `lpf`, `distort`). These features are then sorted and normalized to remove order-variance and minor token drift.
- **Irreversibility**: It is computationally infeasible to reconstruct the original "vibe" description from the resulting DNA hash, as the hash represents a normalized structural mapping of musical parameters, not the input text.

## ⛓️ 4. On-Chain Privacy (Starknet)
- **Commitment-Only Storage**: Only the `felt252` hash is stored on the Starknet blockchain.
- **Anonymous Credentials**: The protocol allows users to prove "Knowledge of a Vibe" without revealing the description, pattern, or any PII (Personally Identifiable Information).

## 🔋 5. Local Mock Fallback
For maximum privacy in offline or highly restricted environments, the system includes a **Deterministic Mock Engine**. This ensures that core protocol functions can be demonstrated and verified without any external API calls, maintaining a fully air-gapped identity path if required.

---
**Sonic Guardian: Your vibe is your key. Your privacy is our protocol.**
