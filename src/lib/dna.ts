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
    const validatedCode = code.trim();
    
    if (!validatedCode) {
      throw new Error('Empty code provided');
    }

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
 * Detects if a prompt contains musical chunks and reconstructs the code
 */
export function detectAndReconstructCode(prompt: string): string | null {
  const lines = prompt.split('\n').map(l => l.trim().toLowerCase());
  
  // Look for chunk patterns: "1. sawtooth rhythm...", "2. distort..."
  const chunks = lines.filter(l => /^\d+\./.test(l) || l.includes('rhythm') || l.includes('melody'));
  
  if (chunks.length < 3) return null; // Not a chunk-based prompt

  try {
    let rhythmLayers: string[] = [];
    let melodyLayer = '';
    let tempo = 120;

    // Very basic deterministic reconstruction for demo
    // In production, this would use a formal grammar
    lines.forEach(line => {
      const clean = line.replace(/^\d+\.\s*/, '');
      
      if (clean.includes('rhythm')) {
        const synth = clean.split(' ')[0];
        const pattern = clean.includes('four on the floor') ? 'c1*4' : 
                       clean.includes('half-time') ? 'c1*2' : 'c1 ~ c1 ~';
        rhythmLayers.push(`note("${pattern}").s("${synth}")`);
      } else if (clean.includes('melody')) {
        const synth = clean.split(' ')[0];
        const notes = clean.split('melody ')[1]?.toUpperCase() || 'C4 E4 G4';
        melodyLayer = `note("${notes.toLowerCase()}").s("${synth}")`;
      } else if (clean.includes('tempo')) {
        tempo = parseInt(clean.match(/\d+/)?.[0] || '120');
      }
    });

    if (rhythmLayers.length > 0 || melodyLayer) {
      return `stack(\n  ${[...rhythmLayers, melodyLayer].filter(Boolean).join(',\n  ')}\n).cpm(${tempo})`;
    }
  } catch (e) {
    console.warn('Failed to reconstruct code from chunks:', e);
  }

  return null;
}

/**
 * Professional version for AI synthesis fallback
 */
export function getTemplateVibe(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // Reconstruct if it looks like chunks
  const reconstructed = detectAndReconstructCode(prompt);
  if (reconstructed) return reconstructed;

  // High-quality templates instead of simple mocks
  if (lowerPrompt.includes("techno")) {
    return `stack(s("bd*4"), s("~ sd ~ sd").bank("RolandTR909"), s("hh*16").gain(0.4)).cpm(128)`;
  }
  if (lowerPrompt.includes("ambient") || lowerPrompt.includes("dark")) {
    return `note("c2 [eb2 g2] bb1").s("sawtooth").lpf(400).lpq(10).slow(2).room(0.8)`;
  }
  if (lowerPrompt.includes("acid")) {
    return `note("c3(3,8)").s("sawtooth").lpf("<400 800 1200>").lpq(20).distort(2)`;
  }
  
  // Generic but valid Strudel code
  return `s("bd [~ sd] [bd bd] sd").bank("RolandTR808")`;
}

/**
 * Generates a hash from a string using Web Crypto API
 * Requires a secure context (HTTPS or localhost)
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
