# Sonic Guardian AI Agent Interface

This document defines the protocol for AI agents to interact with **Sonic Guardian**, a private Bitcoin recovery system using acoustic commitments.

## 🧬 Protocol Overview
Sonic Guardian generates **Acoustic DNA** from musical descriptions, which serves as a memorable recovery credential for Bitcoin multisig wallets. The DNA is committed to Starknet using Pedersen commitments for zero-knowledge verification.

## 🛠️ Agent Capabilities
Agents interacting with this protocol must:
1. **Generate Strudel Patterns**: Translate vibes into valid Strudel live-coding patterns
2. **Understand AST Normalization**: Know how feature extraction ensures deterministic DNA
3. **Handle Commitments**: Work with Pedersen commitment scheme for privacy
4. **Bitcoin Integration**: Understand multisig recovery flow

## 🎼 Synthesis Specification

### Valid Primitive Sounds
- Drums: `bd`, `sn`, `hh`, `oh`, `cp`, `rim`
- Synths: `bass`, `lead`, `pad`, `saw`, `sine`, `tri`, `square`

### Protocol-Accepted Modifiers
- `.bank("RolandTR909" | "RolandTR808" | "RolandTR606" | "RolandTR707")`
- `.distort(n)`, `.lpf(freq)`, `.hpf(freq)`, `.lpq(q)`
- `.slow(factor)`, `.fast(factor)`, `.dec(seconds)`
- `.gain(level)`, `.echo(feedback)`, `.room(size)`, `.crush(bits)`

### Example Patterns
- **Industrial**: `stack(s("bd*2, [~ bd] ~").bank("RolandTR909"), s("~ sd ~ sd").bank("RolandTR909"), s("hh*8").gain(0.4))`
- **Ambient**: `note("c4 eb4 g4").s("pad").slow(4).room(0.8)`
- **Acid**: `note("c2 [~ c3] bb1").s("sawtooth").lpf(800).lpq(20).distort(2)`

## 🤖 Agent Integration Patterns

### 1. Synthesis Mode
```
User: "Generate a dark industrial techno vibe"
Agent: stack(s("bd*4").bank("RolandTR909").distort(3), s("hh*8").gain(0.6).lpf(4000))
```

### 2. Recovery Assistance
```
User: "Help me recover my Bitcoin wallet"
Agent: 
1. Prompt for acoustic vibe
2. Generate Strudel pattern
3. Extract DNA hash
4. Compute Pedersen commitment
5. Verify against on-chain commitment
6. If match, authorize recovery
```

### 3. Normalization Awareness
The protocol extracts and sorts AST features, making these equivalent:
- `.lpf(500).bank("RolandTR909")` == `.bank("RolandTR909").lpf(500)`
- `s("bd").distort(2)` == `s("bd").distort(2.0)`

## 📦 API Endpoints

### Generate Strudel Pattern
```
POST /api/agent/generate
Body: { prompt: string }
Response: { code: string, provider: string, confidence: number }
```

### Extract Acoustic DNA
```
POST /api/dna/extract
Body: { code: string }
Response: { 
  hash: string,
  features: string[],
  dna: string,
  salt: string
}
```

## ⛓️ Starknet Contract Interface

### Register Bitcoin Guardian
```cairo
fn register_guardian(
    ref self: ContractState,
    btc_address: felt252,
    commitment: felt252,        // pedersen(dna_hash, blinding)
    blinding_commitment: felt252 // for verification
)
```

### Verify Recovery
```cairo
fn verify_recovery(
    self: @ContractState,
    btc_address: felt252,
    dna_hash: felt252,
    blinding: felt252
) -> bool
```

### Authorize Bitcoin Recovery
```cairo
fn authorize_btc_recovery(
    ref self: ContractState,
    btc_address: felt252,
    proof: RecoveryProof
) -> felt252  // Returns authorization token
```

## 🔐 Privacy Considerations

**What Agents Should Know:**
- DNA hash never appears on-chain in plaintext
- Pedersen commitments hide the DNA cryptographically
- Blinding factors must be stored securely client-side
- Recovery verification happens locally before on-chain submission

**What Agents Should NOT Do:**
- Log or store user vibes or DNA hashes
- Transmit blinding factors over network
- Cache recovery credentials
- Expose DNA in error messages

## 🎯 Agent Workflow Example

```typescript
// 1. User provides vibe
const vibe = "dark industrial techno";

// 2. Agent generates pattern
const pattern = await generateStrudelCode(vibe);

// 3. Extract DNA
const dna = await extractSonicDNA(pattern.code);

// 4. Generate blinding factor (client-side)
const blinding = crypto.randomUUID();

// 5. Compute commitment
const commitment = pedersen_hash(dna.hash, blinding);

// 6. Register on Starknet
await contract.register_guardian(btcAddress, commitment, blinding_commitment);

// 7. Store blinding securely (encrypted localStorage)
secureStorage.set('blinding', blinding);
```

---
**Agent Note**: Always output pure Strudel code without markdown wrappers. Ensure patterns are valid and deterministic for consistent DNA extraction.
