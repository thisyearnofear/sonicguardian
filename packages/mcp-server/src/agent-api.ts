/**
 * Sonic Guardian Agent API
 * 
 * Simple HTTP API for AI agents to interact with Sonic Guardian.
 * Can be easily wrapped as an MCP server or called directly.
 * 
 * Endpoints:
 * - POST /register - Register a guardian
 * - POST /verify - Verify a recovery pattern
 * - POST /trigger - Trigger recovery
 * - GET /status/:btcAddress - Get guardian status
 * - GET /list - List all guardians
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createHash, randomBytes } from 'crypto';

interface GuardianRecord {
  btcAddress: string;
  dnaHash: string;
  blinding: string;
  registeredAt: number;
  status: 'active' | 'recovered' | 'triggered';
}

const guardians = new Map<string, GuardianRecord>();

// Utility functions
function isValidBtcAddress(address: string): boolean {
  const p2pkhRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^(bc1)[a-z0-9]{39,87}$/;
  return p2pkhRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
}

async function generateDnaHash(pattern: string): Promise<string> {
  const hash = createHash('sha256');
  hash.update(pattern + 'sonic-guardian-salt');
  return '0x' + hash.digest('hex');
}

function generateBlinding(): string {
  return '0x' + randomBytes(32).toString('hex');
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Request handlers
async function handleRegister(req: IncomingMessage, res: ServerResponse) {
  const { btcAddress, musicalPattern, agentWalletAddress } = await parseBody(req);
  
  if (!btcAddress || !musicalPattern) {
    return sendJson(res, 400, { success: false, error: 'Missing btcAddress or musicalPattern' });
  }
  
  if (!isValidBtcAddress(btcAddress)) {
    return sendJson(res, 400, { success: false, error: 'Invalid Bitcoin address format' });
  }
  
  const dnaHash = await generateDnaHash(musicalPattern);
  const blinding = generateBlinding();
  
  const record: GuardianRecord = {
    btcAddress,
    dnaHash,
    blinding,
    registeredAt: Date.now(),
    status: 'active'
  };
  
  guardians.set(btcAddress, record);
  
  sendJson(res, 200, {
    success: true,
    dnaHash,
    blinding,
    message: 'Guardian registered successfully'
  });
}

async function handleVerify(req: IncomingMessage, res: ServerResponse) {
  const { btcAddress, musicalPattern } = await parseBody(req);
  
  const guardian = guardians.get(btcAddress);
  if (!guardian) {
    return sendJson(res, 404, { success: false, verified: false, error: 'Guardian not found' });
  }
  
  const providedDnaHash = await generateDnaHash(musicalPattern);
  const verified = providedDnaHash === guardian.dnaHash;
  
  sendJson(res, 200, { success: true, verified });
}

async function handleTrigger(req: IncomingMessage, res: ServerResponse) {
  const { btcAddress, musicalPattern, recipientAddress } = await parseBody(req);
  
  const guardian = guardians.get(btcAddress);
  if (!guardian) {
    return sendJson(res, 404, { success: false, authorized: false, error: 'Guardian not found' });
  }
  
  const providedDnaHash = await generateDnaHash(musicalPattern);
  
  if (providedDnaHash !== guardian.dnaHash) {
    guardian.status = 'triggered';
    return sendJson(res, 200, { success: true, authorized: false, error: 'Invalid musical pattern' });
  }
  
  guardian.status = 'recovered';
  
  sendJson(res, 200, {
    success: true,
    authorized: true,
    message: 'Recovery authorized',
    recipient: recipientAddress || btcAddress
  });
}

function handleStatus(btcAddress: string, res: ServerResponse) {
  const guardian = guardians.get(btcAddress);
  
  if (!guardian) {
    return sendJson(res, 404, { error: 'Guardian not found' });
  }
  
  sendJson(res, 200, guardian);
}

function handleList(res: ServerResponse) {
  const allGuardians = Array.from(guardians.entries()).map(([addr, record]) => ({
    ...record,
    btcAddress: addr
  }));
  
  sendJson(res, 200, { guardians: allGuardians, count: allGuardians.length });
}

// Main server
const PORT = process.env.PORT || 3001;

const server = createServer(async (req, res) => {
  const url = req.url || '';
  const method = req.method || 'GET';
  
  // CORS preflight
  if (method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }
  
  try {
    // Route: POST /register
    if (url === '/register' && method === 'POST') {
      return handleRegister(req, res);
    }
    
    // Route: POST /verify
    if (url === '/verify' && method === 'POST') {
      return handleVerify(req, res);
    }
    
    // Route: POST /trigger
    if (url === '/trigger' && method === 'POST') {
      return handleTrigger(req, res);
    }
    
    // Route: GET /status/:btcAddress
    if (url?.match(/^\/status\/.+/) && method === 'GET') {
      const btcAddress = url.split('/status/')[1];
      return handleStatus(decodeURIComponent(btcAddress), res);
    }
    
    // Route: GET /list
    if (url === '/list' && method === 'GET') {
      return handleList(res);
    }
    
    // Route: GET /health
    if (url === '/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'ok', service: 'sonic-guardian-agent-api' });
    }
    
    // 404
    sendJson(res, 404, { error: 'Not found' });
    
  } catch (error) {
    console.error('Server error:', error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Sonic Guardian Agent API running on http://localhost:${PORT}`);
  console.log(`
Endpoints:
  POST /register     - Register a guardian
  POST /verify       - Verify recovery pattern  
  POST /trigger     - Trigger recovery
  GET  /status/:addr - Get guardian status
  GET  /list        - List all guardians
  GET  /health      - Health check
  `);
});
