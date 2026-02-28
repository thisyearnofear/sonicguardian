import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { validators } from './api';

/**
 * Sonic DNA extraction with cryptographic security
 * Captures rhythmic, harmonic, and temporal semantics from Strudel patterns
 */
export interface SonicDNA {
  dna: string;
  features: string[];
  hash: string;
  salt: string;
  timestamp: number;
  rhythmicFeatures?: string[];
  harmonicFeatures?: string[];
  temporalFeatures?: string[];
}

export interface DNAExtractionOptions {
  salt?: string;
  includeTimestamp?: boolean;
  captureSemantics?: boolean;  // Capture rhythmic/temporal/harmonic features
}

/**
 * Extracts musical features from a Strudel pattern string
 * Now captures rhythmic, harmonic, and temporal semantics
 */
export async function extractSonicDNA(
  code: string,
  options: DNAExtractionOptions = {}
): Promise<SonicDNA | null> {
  try {
    const validatedCode = code.trim();

    if (!validatedCode) {
      throw new Error('Empty code provided');
    }

    const features: Array<{ name: string; args: (string | number)[] }> = [];
    const rhythmicFeatures: string[] = [];
    const harmonicFeatures: string[] = [];
    const temporalFeatures: string[] = [];

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
              if (typeof a === 'number') return Math.round(a * 10) / 10;
              if (typeof a === 'string') return a.toLowerCase().trim();
              return a;
            });

            features.push({ name, args: normalizedArgs });

            // Categorize features by musical semantics
            if (options.captureSemantics) {
              // Rhythmic: drums, patterns, timing
              if (['s', 'note', 'n', 'bd', 'sd', 'hh', 'oh', 'cp', 'rim'].includes(name)) {
                rhythmicFeatures.push(`${name}(${normalizedArgs.join(',')})`);
              }
              
              // Temporal: time modifiers
              if (['slow', 'fast', 'sometimes', 'when', 'cpm', 'slowfast'].includes(name)) {
                temporalFeatures.push(`${name}(${normalizedArgs.join(',')})`);
              }
              
              // Harmonic: scales, chords, notes
              if (['scale', 'chord', 'n', 'note'].includes(name)) {
                harmonicFeatures.push(`${name}(${normalizedArgs.join(',')})`);
              }

              // Pattern transformations
              if (['pattern', 'stack', 'seq', 'cat'].includes(name)) {
                rhythmicFeatures.push(`${name}(${normalizedArgs.join(',')})`);
              }
            }
          }
        }
      }
    });

    // Normalize: Remove duplicates, sort by function name, and stringify
    const uniqueFeatures = Array.from(new Set(features
      .filter(f => !['m', 'evaluate', 's', 'stack'].includes(f.name))
      .map(f => `${f.name}(${f.args.join(',')})`)
    )).sort();

    const normalized = uniqueFeatures.join('|');

    // Generate cryptographic hash
    const salt = options.salt || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    const hash = await generateHash(normalized + salt);
    const timestamp = options.includeTimestamp ? Date.now() : 0;

    return {
      dna: normalized,
      features: features.map(f => f.name).filter((v, i, a) => a.indexOf(v) === i),
      hash: hash,
      salt: salt,
      timestamp: timestamp,
      ...(options.captureSemantics && {
        rhythmicFeatures: Array.from(new Set(rhythmicFeatures)).sort(),
        harmonicFeatures: Array.from(new Set(harmonicFeatures)).sort(),
        temporalFeatures: Array.from(new Set(temporalFeatures)).sort(),
      })
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
