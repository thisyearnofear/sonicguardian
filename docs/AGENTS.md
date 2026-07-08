# AI Agent Integration

## REST API

All API operations use **zero-knowledge acoustic signatures** — the musical pattern is never transmitted or stored on the server. Verification happens via ECDSA signatures against on-chain public keys.

### Register Guardian

Creates a sonic identity by committing a Pedersen commitment and acoustic public key to Starknet. The musical pattern stays in the request body only for client-side DNA extraction.

```bash
POST /api/agent/register
{
  "btcAddress": "bc1q...",
  "musicalPattern": "sawtooth c2 ~ c2",
  "dnaHash": "0x...",         // Pre-computed SHA-256 hash (optional, for ZK path)
  "blindingFactor": "0x..."   // Client-generated blinding factor
}
```

**Privacy note:** The server never stores the musical pattern. Only the Pedersen commitment and acoustic public key are stored on-chain.

### Verify Authorship (ZK)

Prove authorship of a sonic identity using an acoustic ECDSA signature. The musical pattern is used client-side to generate a signature — it is never sent to the server.

```bash
POST /api/agent/verify
{
  "btcAddress": "bc1q...",
  "messageHash": "0x...",       // Challenge message to sign
  "signatureR": "0x...",        // ECDSA signature (r component)
  "signatureS": "0x..."         // ECDSA signature (s component)
}
```

**Success response:**
```json
{ "verified": true, "method": "zk_acoustic_signature", "message": "Authorship confirmed without revealing DNA" }
```

> This is the **preferred verification path** — it proves knowledge of the DNA without ever revealing it on-chain.
> The legacy `verify_recovery` endpoint (which requires revealing the DNA hash) is deprecated.

### Trigger Recovery

Authorize Bitcoin recovery by proving authorship via ZK acoustic signature.

```bash
POST /api/agent/trigger
{
  "btcAddress": "bc1q...",
  "messageHash": "0x...",
  "signatureR": "0x...",
  "signatureS": "0x..."
}
```

### Check Guardian Status

```bash
GET /api/agent/status/:btcAddress
```

**Response:**
```json
{
  "btcAddress": "bc1q...",
  "registered": true,
  "commitment": "0x...",
  "guardianCount": 42
}
```

## MCP Server

The MCP server exposes Sonic Guardian operations as MCP tools for AI agents. All tools use ZK acoustic signatures for verification — never transmit raw musical patterns.

```bash
npm install @sonicguardian/mcp-server
npx @sonicguardian/mcp-server http 3001
```

### Claude Desktop

```json
{
  "mcpServers": {
    "sonic-guardian": {
      "command": "npx",
      "args": ["@sonicguardian/mcp-server"]
    }
  }
}
```

### Snak Agent

```json
{
  "servers": {
    "sonic-guardian": {
      "command": "npx",
      "args": ["@sonicguardian/mcp-server"]
    }
  }
}
```

## Available MCP Tools

| Tool | Description | Verification Method |
|------|-------------|-------------------|
| `sonic_guardian_register` | Register a guardian with a musical pattern. The pattern is hashed client-side; only the commitment reaches the chain. | Pedersen commitment (ZK) |
| `sonic_guardian_verify` | **Verify authorship** using an acoustic ECDSA signature. Proves knowledge of the musical DNA without revealing it. | Acoustic signature (ZK) |
| `sonic_guardian_trigger_recovery` | Trigger Bitcoin recovery authorized by a ZK acoustic signature. | Acoustic signature (ZK) |
| `sonic_guardian_status` | Check guardian registration status and on-chain commitment. | Read-only (view function) |

## Privacy Guarantees for Agent Operations

- Musical patterns are **never stored server-side** — only hashed commitments reach the chain
- Verification uses **ECDSA zero-knowledge signatures** — the DNA hash is never revealed
- All sensitive operations happen **in the agent's execution environment** (client-side)
- On-chain data reveals **only** the commitment and acoustic public key — nothing about the original pattern
