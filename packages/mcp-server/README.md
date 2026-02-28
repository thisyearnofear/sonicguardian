# Sonic Guardian MCP Server

MCP (Model Context Protocol) server for Sonic Guardian - enables AI agents to interact with the musical pattern Bitcoin guardian system.

## Features

Exposes the following tools for AI agents:

- `sonic_guardian_register` - Register a Bitcoin address with a musical pattern
- `sonic_guardian_verify` - Verify a recovery pattern without triggering
- `sonic_guardian_trigger_recovery` - Trigger guardian recovery 
- `sonic_guardian_status` - Check guardian status
- `sonic_guardian_list` - List all registered guardians

## Installation

```bash
npm install @sonicguardian/mcp-server
# or
pnpm add @sonicguardian/mcp-server
```

## Usage

### Standalone (Stdio Mode)

```bash
# Run the MCP server
npx @sonicguardian/mcp-server
```

### HTTP Mode

```bash
# Run on specific port
npx @sonicguardian/mcp-server http 3001
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

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

### Cursor

Add to your Cursor settings MCP configuration:

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

Add to your `mcp.config.json`:

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

## Example Agent Interactions

### Register a Guardian

```
Agent: "Register bc1q... as a guardian with the musical pattern 'sawtooth c2 ~ c2, sine c4*4, 120 BPM'"

MCP Response:
{
  "success": true,
  "dnaHash": "0xabc123...",
  "transactionHash": "0xdef456..."
}
```

### Verify Recovery

```
Agent: "Verify if the pattern 'sawtooth c2 ~ c2' matches the guardian for bc1q..."

MCP Response:
{
  "success": true,
  "verified": true
}
```

### Trigger Recovery

```
Agent: "Trigger recovery for bc1q... using the pattern 'sawtooth c2 ~ c2' and send to bc1r..."

MCP Response:
{
  "success": true,
  "authorized": true
}
```

## Configuration

Set environment variables as needed:

```bash
# Starknet RPC (for on-chain operations)
STARKNET_RPC_URL=

# Sonic Guardian Contract Address  
SONIC_GUARDIAN_ADDRESS=

# Venice AI API Key (for pattern generation)
# Get from https://venice.ai
```

## Development

```bash
cd packages/mcp-server
npm install
npm run build
npm start
```

## Publishing

```bash
npm publish --access public
```
