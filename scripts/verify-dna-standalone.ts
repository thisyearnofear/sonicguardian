
import { parse } from 'acorn';
import { walk } from 'estree-walker';
import { hash } from 'starknet';

// --- Simplified Crypto for Verification ---

function hexToFelt(hex: string): string {
    const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
    const clean = hex.replace(/^0x/, '');
    return (BigInt('0x' + clean) % MODULO).toString();
}

async function pedersen(a: string, b: string): Promise<string> {
    const cleanA = a.startsWith('0x') ? a : '0x' + a;
    const cleanB = b.startsWith('0x') ? b : '0x' + b;
    return hash.computePedersenHash(cleanA, cleanB).replace(/^0x/, '');
}

// --- DNA Logic (Copied from src/lib/dna.ts for validation) ---

function expandMiniNotation(input: string): string[] {
  let text = input.replace(/\s+/g, ' ').trim();
  while (text.includes('*')) {
    const starIndex = text.lastIndexOf('*');
    const multiplierMatch = text.slice(starIndex + 1).match(/^(\d+)/);
    if (multiplierMatch) {
      const count = parseInt(multiplierMatch[1]);
      let start = starIndex - 1;
      let content = '';
      if (text[start] === ']') {
        let depth = 1;
        start--;
        while (start >= 0 && depth > 0) {
          if (text[start] === ']') depth++;
          else if (text[start] === '[') depth--;
          if (depth > 0) start--;
        }
        content = text.slice(start, starIndex);
      } else {
        const tokenMatch = text.slice(0, starIndex).match(/([a-zA-Z0-9#b:]+)$/);
        if (tokenMatch) {
          start = starIndex - tokenMatch[0].length;
          content = tokenMatch[0];
        }
      }
      if (content) {
        const expanded = Array(count).fill(content).join(' ');
        text = text.slice(0, start) + expanded + text.slice(starIndex + 1 + multiplierMatch[1].length);
      } else break;
    } else break;
  }
  text = text.replace(/([a-zA-Z0-9#b:]+)\((\d+),\s*(\d+)\)/g, (_, token, hits, pulses) => {
    return Array(parseInt(hits)).fill(token).join(' ');
  });
  return text
    .replace(/[\[\]\(\)\~<>?|]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0 && !/^\d+(\.\d+)?$/.test(t))
    .map(t => t.toLowerCase());
}

async function extractSonicDNA(code: string, salt: string) {
  try {
    const features: Set<string> = new Set();
    const ast = parse(code, { ecmaVersion: 2022, sourceType: 'module' });

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

          if (['s', 'n', 'note', 'chord', 'scale'].includes(name)) {
            args.forEach(arg => {
              if (typeof arg === 'string') {
                const tokens = expandMiniNotation(arg);
                tokens.forEach(t => features.add(`${name}:${t}`));
              }
            });
          } else {
            features.add(`${name}(${args.map(a => typeof a === 'number' ? Math.round(a * 10) / 10 : a).join(',')})`);
          }
        }
      }
    });

    const normalized = Array.from(features).sort().join('|');
    const hashHex = hash.computePoseidonHashOnElements([BigInt('0x' + Buffer.from(normalized).toString('hex'))]).toString();

    const commitment = await pedersen(hexToFelt(hashHex.substring(0, 32)), hexToFelt(salt.substring(0, 32)));

    return { dna: normalized, commitment, hash: hashHex };
  } catch (e: any) {
    console.error(e);
    return null;
  }
}



// --- Test Suite ---

async function runVerification() {
  console.log('🧪 VERIFYING SEMANTIC DNA COMMITMENTS\n');

  const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  console.log('Case 1: Basic Normalization (bd*4 vs bd bd bd bd)...');
  const d1 = await extractSonicDNA('s("bd*4")', salt);
  const d2 = await extractSonicDNA('s("bd bd bd bd")', salt);
  console.log(`Match: ${d1?.dna === d2?.dna ? '✅' : '❌'} (${d1?.dna})`);

  console.log('\nCase 2: Nested Expansion ([bd sd]*2 vs bd sd bd sd)...');
  const d3 = await extractSonicDNA('s("[bd sd]*2")', salt);
  const d4 = await extractSonicDNA('s("bd sd bd sd")', salt);
  console.log(`Match: ${d3?.dna === d4?.dna ? '✅' : '❌'} (${d3?.dna})`);

  console.log('\nCase 3: Euclidean Flattening (bd(3,8) vs bd bd bd)...');
  const d5 = await extractSonicDNA('s("bd(3,8)")', salt);
  const d6 = await extractSonicDNA('s("bd bd bd")', salt);
  console.log(`Match: ${d5?.dna === d6?.dna ? '✅' : '❌'} (${d5?.dna})`);

  console.log('\nCase 4: Complex Combo ([bd sd]*2 hh*4)...');
  const d7 = await extractSonicDNA('s("[bd sd]*2 hh*4")', salt);
  console.log(`DNA: ${d7?.dna}`);
  console.log(`Features: ${d7?.dna.split('|').length} tokens`);

  console.log(`\nFinal Commitment Example: ${d7?.commitment}`);
  console.log('🏁 Verification complete.');
}


runVerification();
