# Sonic Guardian AI Skill

This document defines the interface and protocols for AI Agents to interact with the **Sonic Guardian ZK-Acoustic Privacy Protocol**.

## 🧬 Protocol Overview
Sonic Guardian uses deterministic **Acoustic Synthesis** to generate cryptographic identities from subjective musical descriptions ("Vibes"). Agents can use this protocol to programmatically mint or verify anonymous credentials.

## 🛠️ Agent Capabilities
Agents interacting with this protocol must be able to:
1.  **Generate Strudel Patterns**: Translate high-level vibes into Strudel live-coding patterns.
2.  **Verify DNA Invariants**: Understand how AST normalization ensures hash stability across minor variations.
3.  **Anchor to Starknet**: Execute `register_identity` and `verify_identity` transactions.

## 🎼 Synthesis Specification
When generating patterns for the protocol, agents should strictly adhere to the functional Strudel style:

### Valid Primitive Sounds
- `bd` (bass drum), `sn` (snare), `hh` (high-hat), `oh` (open hat)
- `bass`, `lead`, `pad`, `saw`, `sine`, `tri`

### Protocol-Accepted Modifiers
- `.bank("tr909" | "tr808" | "linn" | "casio")`
- `.distort(n)`, `.lpf(freq)`, `.hpf(freq)`
- `.slow(factor)`, `.fast(factor)`, `.dec(seconds)`
- `.gain(level)`, `.echo(feedback)`, `.rev()`

### Example Patterns
- **Industrial**: `s("[bd*2, [~ sn]*2, hh*4]").bank("tr909").distort(2)`
- **Ethereal**: `s("pad").slow(4).rev().echo(0.5).lpf(400)`

## 🤖 Integration for LLM Agents
If you are an LLM agent attempting to assist a user with verification:

1.  **Synthesis Mode**:
    - Prompt: "Synthesis engine, generate a dark industrial techno vibe."
    - Output: `s("bd*2").bank("tr909").distort(5)`
2.  **Normalization Check**:
    - Be aware that the protocol extracts the AST and sorts features.
    - Example: `.lpf(500).bank("909")` == `.bank("909").lpf(500)`

## 📦 API Endpoints (For Tool Use)
- `POST /api/agent/generate`: Body `{ prompt: string }` -> Returns `{ code: string }`
- `POST /api/dna/extract`: Body `{ code: string }` -> Returns `{ hash: string, features: string[] }`

## ⛓️ Starknet Interface
- **Contract**: `ISonicGuardian`
- **Method**: `register_identity(commitment: felt252)`
- **Method**: `verify_identity(proof_hash: felt252)`

---
**AX Note**: To optimize for agentic use, ensure your outputs are pure Strudel code without markdown wrappers unless requested.
