/**
 * Sonic Guardian MCP Server
 * 
 * Exposes Sonic Guardian operations as MCP tools for AI agents.
 * Supports both stdio and HTTP server modes.
 * 
 * Available tools:
 * - sonic_guardian_register: Register a musical pattern as BTC guardian
 * - sonic_guardian_verify: Verify acoustic proof for recovery
 * - sonic_guardian_status: Check guardian status
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Guardian state (in production, this would be a database)
interface GuardianRecord {
  btcAddress: string;
  dnaHash: string;
  blinding: string;
  registeredAt: number;
  status: 'active' | 'recovered' | 'triggered';
}

const guardians = new Map<string, GuardianRecord>();

/**
 * Register a new guardian with a musical pattern
 */
async function registerGuardian(
  btcAddress: string, 
  musicalPattern: string,
  agentWalletAddress?: string
): Promise<{ success: boolean; dnaHash: string; transactionHash?: string; error?: string }> {
  try {
    // Validate Bitcoin address format
    if (!isValidBtcAddress(btcAddress)) {
      return { success: false, dnaHash: '', error: 'Invalid Bitcoin address format' };
    }
    
    // In production, this would:
    // 1. Generate DNA hash from musical pattern
    // 2. Create Pedersen commitment
    // 3. Submit transaction to Starknet contract
    
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
    
    // Simulate transaction hash (in production, this would be real)
    const transactionHash = `0x${Buffer.from(JSON.stringify({ 
      btcAddress, 
      dnaHash, 
      blinding,
      timestamp: Date.now() 
    })).toString('hex').slice(0, 64)}`;
    
    return { 
      success: true, 
      dnaHash, 
      transactionHash 
    };
  } catch (error) {
    return { 
      success: false, 
      dnaHash: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Verify a recovery attempt
 */
async function verifyRecovery(
  btcAddress: string,
  musicalPattern: string
): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const guardian = guardians.get(btcAddress);
    
    if (!guardian) {
      return { success: false, verified: false, error: 'Guardian not found' };
    }
    
    // In production, this would:
    // 1. Generate DNA hash from provided pattern
    // 2. Compare with stored hash
    // 3. Optionally verify on-chain
    
    const providedDnaHash = await generateDnaHash(musicalPattern);
    const verified = providedDnaHash === guardian.dnaHash;
    
    return { success: true, verified };
  } catch (error) {
    return { 
      success: false, 
      verified: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Trigger a recovery (for automated agents)
 */
async function triggerRecovery(
  btcAddress: string,
  musicalPattern: string,
  recipientAddress?: string
): Promise<{ success: boolean; authorized: boolean; error?: string }> {
  try {
    const guardian = guardians.get(btcAddress);
    
    if (!guardian) {
      return { success: false, authorized: false, error: 'Guardian not found' };
    }
    
    // Verify the pattern first
    const providedDnaHash = await generateDnaHash(musicalPattern);
    
    if (providedDnaHash !== guardian.dnaHash) {
      guardian.status = 'triggered';
      return { success: true, authorized: false, error: 'Invalid musical pattern' };
    }
    
    // In production, this would:
    // 1. Generate authorization token
    // 2. Submit recovery transaction to Starknet
    // 3. Transfer funds to recipient
    
    guardian.status = 'recovered';
    
    return { success: true, authorized: true };
  } catch (error) {
    return { 
      success: false, 
      authorized: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get guardian status
 */
function getGuardianStatus(btcAddress: string): GuardianRecord | null {
  return guardians.get(btcAddress) || null;
}

// Utility functions (simplified - production would use proper crypto)
function isValidBtcAddress(address: string): boolean {
  const p2pkhRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^(bc1)[a-z0-9]{39,87}$/;
  return p2pkhRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
}

async function generateDnaHash(pattern: string): Promise<string> {
  // Simplified - production would use proper hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(pattern);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateBlinding(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// MCP Server Implementation
class SonicGuardianMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'sonic-guardian',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'sonic_guardian_register',
            description: 'Register a Bitcoin address with a musical pattern as a guardian. The musical pattern serves as the recovery key.',
            inputSchema: {
              type: 'object',
              properties: {
                btcAddress: {
                  type: 'string',
                  description: 'Bitcoin address to protect (bc1q..., 1..., or 3...)'
                },
                musicalPattern: {
                  type: 'string',
                  description: 'Musical pattern or chunks that will be used for recovery (e.g., "sawtooth c2 ~ c2, sine c4*4, 120 BPM")'
                },
                agentWalletAddress: {
                  type: 'string',
                  description: 'Optional Starknet wallet address of the agent registering the guardian'
                }
              },
              required: ['btcAddress', 'musicalPattern']
            }
          },
          {
            name: 'sonic_guardian_verify',
            description: 'Verify if a musical pattern matches the guardian for a Bitcoin address. Used to test recovery without triggering it.',
            inputSchema: {
              type: 'object',
              properties: {
                btcAddress: {
                  type: 'string',
                  description: 'Bitcoin address to verify'
                },
                musicalPattern: {
                  type: 'string',
                  description: 'Musical pattern to verify against the guardian'
                }
              },
              required: ['btcAddress', 'musicalPattern']
            }
          },
          {
            name: 'sonic_guardian_trigger_recovery',
            description: 'Trigger recovery of a Bitcoin guardian using a musical pattern. This authorizes the transfer of funds.',
            inputSchema: {
              type: 'object',
              properties: {
                btcAddress: {
                  type: 'string',
                  description: 'Bitcoin address of the guardian to recover'
                },
                musicalPattern: {
                  type: 'string',
                  description: 'Musical pattern for recovery'
                },
                recipientAddress: {
                  type: 'string',
                  description: 'Optional recipient Bitcoin address (defaults to guardian owner)'
                }
              },
              required: ['btcAddress', 'musicalPattern']
            }
          },
          {
            name: 'sonic_guardian_status',
            description: 'Get the status of a guardian for a Bitcoin address.',
            inputSchema: {
              type: 'object',
              properties: {
                btcAddress: {
                  type: 'string',
                  description: 'Bitcoin address to check'
                }
              },
              required: ['btcAddress']
            }
          },
          {
            name: 'sonic_guardian_list',
            description: 'List all registered guardians (for agent administration).',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'sonic_guardian_register': {
            const result = await registerGuardian(
              args.btcAddress as string,
              args.musicalPattern as string,
              args.agentWalletAddress as string | undefined
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'sonic_guardian_verify': {
            const result = await verifyRecovery(
              args.btcAddress as string,
              args.musicalPattern as string
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'sonic_guardian_trigger_recovery': {
            const result = await triggerRecovery(
              args.btcAddress as string,
              args.musicalPattern as string,
              args.recipientAddress as string | undefined
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'sonic_guardian_status': {
            const status = getGuardianStatus(args.btcAddress as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(status || { error: 'Guardian not found' }, null, 2)
                }
              ]
            };
          }

          case 'sonic_guardian_list': {
            const allGuardians = Array.from(guardians.entries()).map(([addr, record]) => ({
              btcAddress: addr,
              ...record
            }));
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ guardians: allGuardians, count: allGuardians.length }, null, 2)
                }
              ]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'sonic-guardian://schema',
            name: 'Sonic Guardian Schema',
            description: 'JSON schema for guardian operations',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'sonic-guardian://schema') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                $schema: 'http://json-schema.org/draft-07/schema#',
                title: 'Sonic Guardian MCP',
                description: 'Musical Pattern Bitcoin Guardian MCP Tools',
                tools: {
                  sonic_guardian_register: {
                    description: 'Register a Bitcoin guardian with musical pattern',
                    parameters: {
                      btcAddress: { type: 'string', pattern: '^(bc1|1|3)[a-zA-HJ-NP-Z0-9]+$' },
                      musicalPattern: { type: 'string', minLength: 3 },
                      agentWalletAddress: { type: 'string' }
                    }
                  },
                  sonic_guardian_verify: {
                    description: 'Verify recovery pattern',
                    parameters: {
                      btcAddress: { type: 'string' },
                      musicalPattern: { type: 'string' }
                    }
                  },
                  sonic_guardian_trigger_recovery: {
                    description: 'Trigger guardian recovery',
                    parameters: {
                      btcAddress: { type: 'string' },
                      musicalPattern: { type: 'string' },
                      recipientAddress: { type: 'string' }
                    }
                  }
                }
              }, null, 2)
            }
          ]
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  async run(mode: 'stdio' | 'http' = 'stdio', port?: number) {
    if (mode === 'http') {
      const transport = new HttpServerTransport({ port: port || 3000 });
      await this.server.connect(transport);
      console.error(`Sonic Guardian MCP Server running on http://localhost:${port || 3000}`);
    } else {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Sonic Guardian MCP Server running on stdio');
    }
  }
}

// Main entry point
const args = process.argv.slice(2);
const mode = args[0] as 'stdio' | 'http' || 'stdio';
const port = args[1] ? parseInt(args[1]) : undefined;

const server = new SonicGuardianMCPServer();
server.run(mode, port).catch(console.error);
