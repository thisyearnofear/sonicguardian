#!/usr/bin/env node
/**
 * M1 Recall Study — Materials Generator (docs/RECALL_STUDY.md)
 *
 * Generates per-participant Day-0 materials: a chunk-encoded Strudel pattern
 * (condition A includes the written chunks; condition B is listen-only).
 *
 * Usage:
 *   node scripts/generate-study-materials.mjs P001 A
 *   node scripts/generate-study-materials.mjs P042 B --seed 12345
 *
 * Deterministic given --seed (reproducible research). Without --seed, uses
 * CSPRNG entropy. The raw seed is never written to disk — only a salted hash,
 * so materials can be audited for uniqueness without leaking the pattern
 * ahead of time beyond the pattern files themselves.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePattern } from '../src/lib/entropy-encoder.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Deterministic PRNG (mulberry32) so a seed reproduces materials exactly
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--seed') args.seed = Number(argv[++i]);
    else args._.push(argv[i]);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const [participantId, conditionRaw] = args._;
const condition = (conditionRaw || 'A').toUpperCase();

if (!participantId || !['A', 'B'].includes(condition)) {
  console.error('Usage: node scripts/generate-study-materials.mjs <participant_id> <A|B> [--seed N]');
  process.exit(1);
}

// 32 bytes of entropy — seeded (deterministic) or CSPRNG
const entropy = new Uint8Array(32);
if (args.seed !== undefined) {
  const rand = mulberry32(args.seed);
  for (let i = 0; i < 32; i++) entropy[i] = Math.floor(rand() * 256);
} else {
  crypto.getRandomValues(entropy);
}

const encoded = encodePattern(entropy);

const dir = join(ROOT, 'study', 'materials', participantId);
mkdirSync(dir, { recursive: true });

const patternPath = join(dir, 'pattern.strudel');
writeFileSync(patternPath, encoded.code + '\n');

if (condition === 'A') {
  writeFileSync(join(dir, 'chunks.txt'), encoded.chunks.map((c, i) => `${i + 1}. ${c.text}`).join('\n') + '\n');
}

const manifest = {
  participant_id: participantId,
  condition,
  generated_at: new Date().toISOString(),
  seeded: args.seed !== undefined,
  // Salted hash — audit uniqueness without pre-exposing the pattern mapping
  pattern_sha256: createHash('sha256').update(`${participantId}:${encoded.code}`).digest('hex'),
  checksum: encoded.checksum,
};
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`✓ ${participantId} (condition ${condition}) → ${dir}`);
console.log(`  pattern: ${patternPath}`);
if (condition === 'A') console.log(`  chunks:  ${join(dir, 'chunks.txt')}`);
