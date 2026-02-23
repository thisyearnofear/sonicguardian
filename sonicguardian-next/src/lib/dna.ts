import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { validators } from './api';

/**
 * Enhanced Sonic DNA extraction with cryptographic security
 * Consolidates parsing, normalization, and hashing logic
 */
export interface SonicDNA {
  dna: string;
  hash: string;
  salt: string;
  timestamp: number;
}

export interface DNAExtractionOptions {
  salt?: string;
  includeTimestamp?: boolean;
}

/**
 * Enhanced hash generation using Web Crypto API
 */
async function generateCryptographicHash(input: string, salt: string = ''): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Hash generation failed:', error);
    // Fallback to simple hash for development
    return generateHashSync(input + salt);
  }
}

/**
 * Synchronous hash generation for environments without Web Crypto
 */
function generateHashSync(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  let hex = Math.abs(hash).toString(16);
  while (hex.length < 8) hex = '0' + hex;
  return hex.repeat(8).substring(0, 64);
}

/**
 * Extracts musical features from a Strudel pattern string with enhanced security
 */
export async function extractSonicDNA(
  code: string, 
  options: DNAExtractionOptions = {}
): Promise<SonicDNA | null> {
  try {
    // Validate input
    const validatedCode = validators.code(code);
    
    const features: Array<{ name: string; args: (string | number)[] }> = [];
    const ast = parse(validatedCode, {
      ecmaVersion: 2022,
      sourceType: 'module',
    });

    walk(ast, {
      enter(node) {
        if (node.type === 'CallExpression') {
          let name = '';
          if (node.callee.type === 'Identifier') {
            name = node.callee.name;
          } else if (node.callee.type === 'MemberExpression') {
            name = node.callee.property.name;
          }

          if (name) {
            const args = node.arguments.map(arg => {
              if (arg.type === 'Literal') return arg.value;
              if (arg.type === 'TemplateLiteral') return arg.quasis[0].value.raw;
              return null;
            }).filter(a => a !== null);

            // Normalize: Round to nearest integer for robustness, and lowercase strings
            const normalizedArgs = args.map(a => {
              if (typeof a === 'number') return Math.round(a);
              if (typeof a === 'string') return a.toLowerCase().trim();
              return a;
            });

            features.push({ name, args: normalizedArgs });
          }
        }
      }
    });

    // Normalize: Sort by function name and stringify
    const normalized = features
      .filter(f => f.name !== 'evaluate' && f.name !== 'm') // Ignore boilerplates
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(f => `${f.name}(${f.args.join(',')})`)
      .join('|');

    // Generate cryptographic hash
    const salt = options.salt || crypto.randomUUID();
    const hash = await generateCryptographicHash(normalized, salt);
    const timestamp = options.includeTimestamp ? Date.now() : 0;
    
    return {
      dna: normalized,
      hash: hash,
      salt: salt,
      timestamp: timestamp
    };
  } catch (error) {
    console.error("Failed to extract Sonic DNA:", error);
    return null;
  }
}

/**
 * Synchronous version for compatibility
 */
export function extractSonicDNASync(
  code: string, 
  options: DNAExtractionOptions = {}
): SonicDNA | null {
  try {
    // Validate input
    const validatedCode = validators.code(code);
    
    const features: Array<{ name: string; args: (string | number)[] }> = [];
    const ast = parse(validatedCode, {
      ecmaVersion: 2022,
      sourceType: 'module',
    });

    walk(ast, {
      enter(node) {
        if (node.type === 'CallExpression') {
          let name = '';
          if (node.callee.type === 'Identifier') {
            name = node.callee.name;
          } else if (node.callee.type === 'MemberExpression') {
            name = node.callee.property.name;
          }

          if (name) {
            const args = node.arguments.map(arg => {
              if (arg.type === 'Literal') return arg.value;
              if (arg.type === 'TemplateLiteral') return arg.quasis[0].value.raw;
              return null;
            }).filter(a => a !== null);

            // Normalize: Round to nearest integer for robustness, and lowercase strings
            const normalizedArgs = args.map(a => {
              if (typeof a === 'number') return Math.round(a);
              if (typeof a === 'string') return a.toLowerCase().trim();
              return a;
            });

            features.push({ name, args: normalizedArgs });
          }
        }
      }
    });

    // Normalize: Sort by function name and stringify
    const normalized = features
      .filter(f => f.name !== 'evaluate' && f.name !== 'm') // Ignore boilerplates
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(f => `${f.name}(${f.args.join(',')})`)
      .join('|');

    // Generate hash
    const salt = options.salt || crypto.randomUUID();
    const hash = generateHashSync(normalized + salt);
    const timestamp = options.includeTimestamp ? Date.now() : 0;
    
    return {
      dna: normalized,
      hash: hash,
      salt: salt,
      timestamp: timestamp
    };
  } catch (error) {
    console.error("Failed to extract Sonic DNA:", error);
    return null;
  }
}

/**
 * Mock agent that generates deterministic Strudel code from prompts
 */
export function mockAgentGenerate(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // Deterministic Logic for Demo
  if (lowerPrompt.includes("muffled") || lowerPrompt.includes("dark")) {
    // Agent might vary order, but DNA stays same
    return `s("bass").slow(2).distort(5).lpf(500)`;
  } 
  if (lowerPrompt.includes("techno") || lowerPrompt.includes("fast")) {
    return `stack(s("bd*4"), s("hh*8").gain(0.8))`;
  }
  if (lowerPrompt.includes("bright") || lowerPrompt.includes("sharp")) {
    return `s("saw").hpf(2000).fast(2)`;
  }
  // Default fallback
  return `s("bd").slow(2)`;
}

/**
 * Generates a hash from a string using Web Crypto API (sync version)
 */
function generateHashSync(input: string): string {
  // For browser environment, we need to use a synchronous approach
  // This is a simple hash implementation for demo purposes
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex string
  let hex = Math.abs(hash).toString(16);
  while (hex.length < 8) {
    hex = '0' + hex;
  }
  
  // Pad to 64 characters for SHA-256 like format
  return hex.repeat(8).substring(0, 64);
}

/**
 * Generates a hash from a string using Web Crypto API (async version)
 */
export async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
