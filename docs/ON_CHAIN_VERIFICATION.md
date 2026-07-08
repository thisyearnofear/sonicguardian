# On-Chain Verification

This document describes how to verify Sonic Guardian on-chain using **zero-knowledge acoustic signatures** — the preferred method that proves authorship without revealing your musical DNA.

---

## ✅ What's Implemented

1. **Register Guardian** — Commits Pedersen commitment + acoustic public key to Starknet
2. **ZK Verify Authorship** — Proves authorship via ECDSA signature (no DNA revealed)
3. **Read Commitment** — Reads stored commitment from contract (view function)
4. **Guardian Count** — Reads total registered guardians

---

## 🔒 ZK Verification Flow (Privacy-First)

This is the **recommended** way to prove authorship. It uses an ECDSA acoustic signature to verify you know the musical DNA without ever revealing it on-chain.

### Step 1: Register a Guardian

```bash
pnpm dev
# Navigate to http://localhost:3000
```

1. Connect your Starknet wallet
2. Enter a Bitcoin address to link
3. Generate a musical pattern (entropy-based or AI vibe)
4. Click **"🔒 Commit Identity to Starknet"**
5. Approve the transaction in your wallet

**What gets stored on-chain:**
- `commitment = pedersen(dna_hash, blinding)` — hides the DNA
- `acoustic_key = stark_curve(dna_hash)` — public key for ZK verification
- The actual musical pattern and DNA hash **never** touch the chain

### Step 2: Verify Authorship (ZK)

Switch to the **"Verify Authorship"** tab to prove you created this identity:

1. Enter your linked Bitcoin address
2. Enter your musical pattern or vibe description
3. Click **"Verify Authorship"**

**What happens under the hood:**
```
1. Browser extracts DNA hash from pattern (SHA-256)
2. Browser signs a challenge message with the DNA as private key
   → ECDSA signature (r, s)
3. Transaction sent to contract: authorize_with_acoustic_signature(
       btc_address, message_hash, sig_r, sig_s
   )
4. Contract verifies: check_ecdsa_signature(message, acoustic_key, sig_r, sig_s)
5. ✅ Verified! — Contract confirms authorship without ever learning the DNA
```

### Step 3: Check On-Chain Data (Read-Only)

After registration, click **"🔍 Verify On-Chain"** to read your commitment from the contract:

```cairo
// Read-only view function — no transaction needed
let commitment = contract.get_commitment(felt_btc_address);
```

This confirms the commitment exists on-chain but reveals nothing about the pattern.

---

## 🔍 What Judges Can Verify

| Check | Method | What It Proves |
|-------|--------|---------------|
| **Contract deployed** | [Voyager link](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de) | Contract exists on Sepolia |
| **Guardians registered** | `get_guardian_count()` on Starkscan | Identity anchoring works |
| **Commitment stored** | `get_commitment(address)` on Starkscan | Your identity committed on-chain |
| **ZK authorship** | Verify tab in the app | Proves you know the DNA without revealing it |
| **Privacy preserved** | Check contract storage | Only commitment + public key — no DNA |

---

## 🎯 Proof Points

| Proof | Status | Privacy |
|-------|--------|---------|
| ✅ Contract deployed on Starknet Sepolia | `0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de` | — |
| ✅ Pedersen commitments stored on-chain | `get_commitment()` returns non-zero | Only commitment, not DNA |
| ✅ Acoustic public key stored | `get_acoustic_key()` returns key | Enables ZK verification |
| ✅ ZK authorship verification | `authorize_with_acoustic_signature()` | DNA **never** revealed |
| ✅ UI reads from contract | "Verify On-Chain" button | Closes the loop |

---

## Contract Details

**Address:** `0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de`

**Explorer links:**
- [Voyager](https://sepolia.voyager.online/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)
- [Starkscan](https://sepolia.starkscan.co/contract/0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de)

**Key functions:**
| Function | Type | Purpose |
|----------|------|---------|
| `register_guardian(btc, commitment, blinding_commitment, acoustic_key)` | Write | Register identity on-chain |
| `authorize_with_acoustic_signature(btc, msg_hash, sig_r, sig_s)` | Write | **ZK proof of authorship** |
| `verify_acoustic_signature(btc, msg_hash, sig_r, sig_s)` | View | Check signature off-chain |
| `get_commitment(btc)` | View | Read stored commitment |
| `get_acoustic_key(btc)` | View | Read stored public key |
| `get_guardian_count()` | View | Total identities registered |

---

## Privacy Guarantee

```
On-chain data:    commitment = pedersen(dna_hash, blinding)
                  acoustic_key = stark_curve(dna_hash)
Never on-chain:   dna_hash, blinding_factor, musical_pattern
```

The contract can verify your authorship **without ever learning** the underlying DNA. This is the core privacy guarantee of Sonic Guardian.
