import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { pedersen, hexToFelt } from './crypto';

/**
 * Sonic DNA - Advanced Musical Fingerprinting
 * Captures semantic musical features for on-chain ZK verification.
 * Follows CLEAN and ENHANCEMENT principles.
 */

export interface SonicDNA {
  dna: string;          // Normalized feature string
  commitment: string;   // Pedersen commitment (felt)
  features: string[];
  hash: string;         // SHA-256 hash
  salt: string;
}

/**
 * Deep semantic expansion of mini-notation strings.
 * Handles nested structures, multipliers (*n), and probability markers (?).
 * Ensures "bd*4" == "bd bd bd bd" and "[bd sd]*2" == "bd sd bd sd".
 */
function expandMiniNotation(input: string): string[] {
  // 1. Pre-process: simplify spaces and remove comments
  let text = input.replace(/\s+/g, ' ').trim();
  
  // 2. Handle multipliers recursively: [bd sd]*2 -> [bd sd] [bd sd]
  // This uses a balanced bracket matching approach
  while (text.includes('*')) {
    const starIndex = text.lastIndexOf('*');
    const multiplierMatch = text.slice(starIndex + 1).match(/^(\d+)/);
    
    if (multiplierMatch) {
      const count = parseInt(multiplierMatch[1]);
      let start = starIndex - 1;
      let content = '';
      
      if (text[start] === ']') {
        // Find matching '['
        let depth = 1;
        start--;
        while (start >= 0 && depth > 0) {
          if (text[start] === ']') depth++;
          else if (text[start] === '[') depth--;
          if (depth > 0) start--;
        }
        content = text.slice(start, starIndex);
      } else {
        // Single token multiplier: bd*4
        const tokenMatch = text.slice(0, starIndex).match(/([a-zA-Z0-9#b:]+)$/);
        if (tokenMatch) {
          start = starIndex - tokenMatch[0].length;
          content = tokenMatch[0];
        }
      }

      if (content) {
        const expanded = Array(count).fill(content).join(' ');
        text = text.slice(0, start) + expanded + text.slice(starIndex + 1 + multiplierMatch[1].length);
      } else {
        break; // Guard against infinite loop if parsing fails
      }
    } else {
      break;
    }
  }

  // 3. Handle Euclidean patterns (simplified): bd(3,8) -> bd bd bd
  text = text.replace(/([a-zA-Z0-9#b:]+)\((\d+),\s*(\d+)\)/g, (_, token, hits, pulses) => {
    return Array(parseInt(hits)).fill(token).join(' ');
  });

  // 4. Final cleaning: remove all remaining syntax chars and extract tokens
  return text
    .replace(/[\[\]\(\)\~<>?|]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0 && !/^\d+(\.\d+)?$/.test(t))
    .map(t => t.toLowerCase());
}

/**
 * Extract semantic musical DNA from Strudel code.
 */
export async function extractSonicDNA(
  code: string,
  salt?: string
): Promise<SonicDNA | null> {
  try {
    const trimmedCode = code.trim();
    if (!trimmedCode) throw new Error('Empty code');

    const features: Set<string> = new Set();
    const activeSalt = salt || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36));

    // 1. Parse JS AST
    const ast = parse(trimmedCode, { ecmaVersion: 2022, sourceType: 'module' });

    walk(ast as any, {
      enter(node) {
        if (node.type === 'CallExpression') {
          const name = node.callee.type === 'Identifier' ? 
            (node.callee as any).name : 
            (node.callee.type === 'MemberExpression' ? (node.callee.property as any).name : '');

          if (!name || ['evaluate', 'm', 'stack'].includes(name)) return;

          const args = node.arguments.map((arg: any) => {
            if (arg.type === 'Literal') return arg.value;
            if (arg.type === 'TemplateLiteral') return arg.quasis[0].value.raw;
            return null;
          }).filter(a => a !== null);

          // Deep parse mini-notation strings
          if (['s', 'n', 'note', 'chord', 'scale'].includes(name)) {
            args.forEach(arg => {
              if (typeof arg === 'string') {
                const tokens = expandMiniNotation(arg);
                tokens.forEach(t => features.add(`${name}:${t}`));
              }
            });
          } else {
            // General effects/modifiers
            features.add(`${name}(${args.map(a => typeof a === 'number' ? Math.round(a * 10) / 10 : a).join(',')})`);
          }
        }
      }
    });

    // 2. Normalize features (Sort and Join)
    const normalized = Array.from(features).sort().join('|');

    // 3. Generate SHA-256 Hash
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized + activeSalt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    // 4. Compute ZK-friendly Pedersen Commitment
    const commitment = await pedersen(hexToFelt(hashHex.substring(0, 32)), hexToFelt(activeSalt.substring(0, 32)));

    return {
      dna: normalized,
      commitment,
      features: Array.from(features),
      hash: hashHex,
      salt: activeSalt
    };
  } catch (error) {
    console.error('DNA Extraction Failed:', error);
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
