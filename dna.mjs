import { parse } from 'acorn';
import { walk } from 'estree-walker';
import crypto from 'crypto';

/**
 * Extracts musical features from a Strudel pattern string.
 * Normalizes values to ensure the same "sonic feel" produces the same DNA.
 */
export function extractSonicDNA(code) {
  const features = [];
  
  try {
    const ast = parse(code, {
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
  } catch (e) {
    console.error("Failed to parse Strudel code:", e.message);
    return null;
  }

  // Normalize: Sort by function name and stringify
  const normalized = features
    .filter(f => f.name !== 'evaluate' && f.name !== 'm') // Ignore boilerplates
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(f => `${f.name}(${f.args.join(',')})`)
    .join('|');

  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  
  return {
    dna: normalized,
    hash: hash
  };
}

// --- AGENTIC TEST CASE ---
const agentOutput = `s("bass").slow(2).distort(5).lpf(500)`;
const agentDNA = extractSonicDNA(agentOutput);

console.log("--- Sonic Guardian Recovery ---");
console.log("User Secret Prompt: 'A slow industrial bassline that is very muffled'");
console.log("Generated DNA:", agentDNA.dna);
console.log("Recovery Hash:", agentDNA.hash);
