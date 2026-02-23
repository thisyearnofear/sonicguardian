import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { validators } from './api';

/**
 * Sonic DNA extraction with cryptographic security
 * Consolidates parsing, normalization, and hashing logic
 */
export interface SonicDNA {
  dna: string;
  features: string[];
  hash: string;
  salt: string;
  timestamp: number;
}

export interface DNAExtractionOptions {
  salt?: string;
  includeTimestamp?: boolean;
}

/**
 * Extracts musical features from a Strudel pattern string
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

    walk(ast as any, {
      enter(node) {
        if (node.type === 'CallExpression') {
          let name = '';
          if (node.callee.type === 'Identifier') {
            name = (node.callee as any).name;
          } else if (node.callee.type === 'MemberExpression') {
            name = (node.callee.property as any).name;
          }

          if (name) {
            const args = node.arguments.map((arg: any) => {
              if (arg.type === 'Literal') return arg.value;
              if (arg.type === 'TemplateLiteral') return arg.quasis[0].value.raw;
              return null;
            }).filter(a => a !== null);

            // Normalize: Round to nearest integer for robustness, and lowercase strings
            const normalizedArgs = args.map(a => {
              if (typeof a === 'number') return Math.round(a * 10) / 10; // 1 decimal place precision
              if (typeof a === 'string') return a.toLowerCase().trim();
              return a;
            });

            features.push({ name, args: normalizedArgs });
          }
        }
      }
    });

    // Normalize: Remove duplicates, sort by function name, and stringify
    // This makes the hash invariant to the ORDER of chainable functions (like .lpf().bank() vs .bank().lpf())
    const uniqueFeatures = Array.from(new Set(features
      .filter(f => !['m', 'evaluate', 's', 'stack'].includes(f.name)) // Ignore infrastructure functions
      .map(f => `${f.name}(${f.args.join(',')})`)
    )).sort();

    const normalized = uniqueFeatures.join('|');

    // Generate cryptographic hash
    const salt = options.salt || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    const hash = await generateHash(normalized + salt);
    const timestamp = options.includeTimestamp ? Date.now() : 0;

    return {
      dna: normalized,
      features: features.map(f => f.name).filter((v, i, a) => a.indexOf(v) === i), // Uniques
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
 * Synchronous version for simple mock generation
 */
export function mockAgentGenerate(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // Deterministic Logic for Demo
  if (lowerPrompt.includes("muffled") || lowerPrompt.includes("dark")) {
    return `s("bass").slow(2).distort(5).lpf(500)`;
  }
  if (lowerPrompt.includes("techno") || lowerPrompt.includes("fast")) {
    return `stack(s("bd*4"), s("hh*8").gain(0.8))`;
  }
  if (lowerPrompt.includes("bright") || lowerPrompt.includes("sharp")) {
    return `s("saw").hpf(2000).fast(2)`.trim();
  }
  // Default fallback
  return `s("bd").slow(2)`;
}

/**
 * Generates a hash from a string using Web Crypto API
 */
export async function generateHash(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback to simple hash if Web Crypto is unavailable (e.g. non-secure context)
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
