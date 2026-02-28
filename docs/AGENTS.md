# AI Agent Integration

## REST API

```bash
# Register guardian
POST /api/agent/register
{ "btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2" }

# Verify recovery
POST /api/agent/verify
{ "btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2" }

# Trigger recovery
POST /api/agent/trigger
{ "btcAddress": "bc1q...", "musicalPattern": "sawtooth c2 ~ c2" }

# Check status
GET /api/agent/status/:btcAddress
```

## MCP Server

```bash
npm install @sonicguardian/mcp-server
npx @sonicguardian/mcp-server http 3001
```

### Claude Desktop
```json
{ "mcpServers": { "sonic-guardian": { "command": "npx", "args": ["@sonicguardian/mcp-server"] } } }
```

### Snak Agent
```json
{ "servers": { "sonic-guardian": { "command": "npx", "args": ["@sonicguardian/mcp-server"] } } }
```

## Available Tools

- `sonic_guardian_register` - Register guardian
- `sonic_guardian_verify` - Verify pattern
- `sonic_guardian_trigger_recovery` - Trigger recovery
- `sonic_guardian_status` - Check status
