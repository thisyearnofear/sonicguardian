
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

function normalizeMiniNotation(input: string): string[] {
  let expanded = input.replace(/([a-zA-Z0-9#b:]+)\*(\d+)/g, (_, token, count) => {
    return Array(parseInt(count)).fill(token).join(' ');
  });
  expanded = expanded.replace(/[\[\]\(\)\~<>?]/g, ' ');
  return expanded
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
                const tokens = normalizeMiniNotation(arg);
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
    const hashHex = hash.computePoseidonHashOnElements([BigInt('0x' + Buffer.from(normalized).toString('hex'))]).toString(16);

    const commitment = await pedersen(hexToFelt(hashHex.substring(0, 32)), hexToFelt(salt.substring(0, 32)));

    return { dna: normalized, commitment, hash: hashHex };
  } catch (e) {
    console.error(e);
    return null;
  }
}


// --- Test Suite ---

async function runVerification() {
  console.log('🧪 VERIFYING SEMANTIC DNA COMMITMENTS\n');

  const p1 = 's("bd*4").bank("RolandTR909")';
  const p2 = 's("bd bd bd bd").bank("RolandTR909")';
  const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  console.log('Testing Normalization (bd*4 vs bd bd bd bd)...');
  const d1 = await extractSonicDNA(p1, salt);
  const d2 = await extractSonicDNA(p2, salt);

  console.log(`DNA 1: ${d1?.dna}`);
  console.log(`DNA 2: ${d2?.dna}`);
  
  if (d1?.dna === d2?.dna) {
    console.log('✅ DNA Strings Match (Semantic extraction successful)');
  } else {
    console.error('❌ DNA Strings Differ (Normalization failed)');
  }

  if (d1?.commitment === d2?.commitment) {
    console.log('✅ Commitments Match (Deterministic)');
  } else {
    console.error('❌ Commitments Differ');
  }

  console.log('\nTesting Uniqueness (techno vs ambient)...');
  const p3 = 'note("c2 eb2 g2").s("sawtooth").lpf(400)';
  const d3 = await extractSonicDNA(p3, salt);
  
  if (d1?.commitment !== d3?.commitment) {
    console.log('✅ Commitments are unique for different patterns');
  } else {
    console.error('❌ Collision detected!');
  }

  console.log(`\nFinal Commitment (felt): ${d1?.commitment}`);
  console.log('🏁 Verification complete.');
}

runVerification();
