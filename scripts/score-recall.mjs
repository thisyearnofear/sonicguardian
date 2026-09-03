#!/usr/bin/env node
/**
 * M1 Recall Study — Scoring Harness (docs/RECALL_STUDY.md)
 *
 * Scores a Day-7 recall attempt against the Day-0 pattern, per musical
 * dimension, emitting the results JSON schema defined in the study protocol.
 * The per-dimension error distributions this produces are the input to the
 * fuzzy-extractor tolerance proposal (DIRECTION.md M2).
 *
 * Usage:
 *   node scripts/score-recall.mjs study/materials/P001 attempt.txt -o study/results/P001.json
 *
 * The attempt file may be either:
 *   - Condition A: the participant's re-entered chunks (numbered lines) —
 *     decoded back to Strudel code via decodeChunks, or
 *   - Any condition: Strudel code pasted/written directly.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeChunks, encodePattern } from '../src/lib/entropy-encoder.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Feature extraction (mirrors entropy-estimate.ts conventions)
// ---------------------------------------------------------------------------

const NOTE_RE = /^([a-g])([#b]?)(\d)$/i;
const SEMITONE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

function parseNote(token) {
  const m = token.match(NOTE_RE);
  if (!m) return null;
  const letter = m[1].toLowerCase();
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return {
    pitchClass: (SEMITONE[letter] + accidental + 12) % 12,
    letter: letter + m[2],
    octave: parseInt(m[3], 10),
  };
}

function extractFeatures(code) {
  const synths = new Set();
  const notes = [];
  const rhythmStrings = [];
  let tempo = null;

  for (const m of code.matchAll(/\.s\("([^"]+)"\)/g)) synths.add(m[1].trim());
  for (const m of code.matchAll(/"([^"]*)"/g)) {
    const parts = m[1].split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    rhythmStrings.push(parts);
    for (const t of parts) {
      const note = parseNote(t);
      if (note) notes.push(note);
    }
  }
  const tempoMatch = code.match(/\.cpm\((\d+)\)/);
  if (tempoMatch) tempo = parseInt(tempoMatch[1], 10);
  return { synths: [...synths], notes, rhythmStrings, tempo };
}

// ---------------------------------------------------------------------------
// Scoring per the RECALL_STUDY.md error taxonomy
// ---------------------------------------------------------------------------

function score(day0, attempt) {
  const a = extractFeatures(day0);
  const b = extractFeatures(attempt);

  // --- Sound/synth dimension ---
  const missingSynths = a.synths.filter((s) => !b.synths.includes(s)).length;
  const extraSynths = b.synths.filter((s) => !a.synths.includes(s)).length;

  // --- Melody (pitch) dimension ---
  const expected = a.notes;
  const observed = b.notes;
  const pitchDeltas = [];
  const octaveErrors = [];
  const n = Math.max(expected.length, observed.length);
  let pitchErrors = 0;
  for (let i = 0; i < n; i++) {
    const e = expected[i];
    const o = observed[i];
    if (e && !o) { pitchErrors += 1; continue; }        // dropped note
    if (!e && o) { pitchErrors += 1; continue; }        // added note
    if (e.pitchClass !== o.pitchClass) {
      const semitones = o.pitchClass - e.pitchClass;
      // wrap to shortest interval (-6..+6)
      const delta = semitones > 6 ? semitones - 12 : semitones < -6 ? semitones + 12 : semitones;
      pitchErrors += 1;
      pitchDeltas.push(delta);
    } else if (e.octave !== o.octave) {
      octaveErrors.push(o.octave - e.octave);
    }
  }

  // --- Rhythm dimension (on/off diff per string, positional) ---
  let rhythmErrors = 0;
  const rhythmDiffs = [];
  const len = Math.max(a.rhythmStrings.length, b.rhythmStrings.length);
  for (let i = 0; i < len; i++) {
    const ea = a.rhythmStrings[i] ?? [];
    const ob = b.rhythmStrings[i] ?? [];
    const maxSteps = Math.max(ea.length, ob.length);
    let diff = 0;
    for (let s = 0; s < maxSteps; s++) {
      const onA = ea[s] !== undefined && ea[s] !== '~';
      const onB = ob[s] !== undefined && ob[s] !== '~';
      if (onA !== onB) diff += 1;
    }
    if (diff > 0) { rhythmErrors += diff; rhythmDiffs.push(diff); }
  }

  // --- Tempo dimension ---
  const tempoDelta = a.tempo !== null && b.tempo !== null ? b.tempo - a.tempo : 0;

  const exactRecall =
    pitchErrors === 0 && octaveErrors.length === 0 && rhythmErrors === 0 &&
    missingSynths === 0 && extraSynths === 0 && tempoDelta === 0;

  return {
    exact_recall: exactRecall,
    dimension_errors: {
      rhythm: rhythmErrors,
      rhythm_per_string: rhythmDiffs,
      pitch: pitchErrors,
      pitch_semitone_delta: pitchDeltas,
      pitch_octave_error: octaveErrors,
      sound_missing: missingSynths,
      sound_extra: extraSynths,
      tempo_bpm_delta: tempoDelta,
    },
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-o') args.out = argv[++i];
    else args._.push(argv[i]);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const [materialDir, attemptPath] = args._;

if (!materialDir || !attemptPath) {
  console.error('Usage: node scripts/score-recall.mjs <materials_dir> <attempt_file> [-o results.json]');
  process.exit(1);
}

const manifestPath = resolve(ROOT, materialDir, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`No manifest at ${manifestPath} — run generate-study-materials.mjs first.`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const day0 = readFileSync(resolve(ROOT, materialDir, 'pattern.strudel'), 'utf8').trim();
const attemptRaw = readFileSync(resolve(ROOT, attemptPath), 'utf8').trim();

// Condition A attempts may be numbered chunk lines — decode back to code
let attemptCode = attemptRaw;
if (/^\d+\./m.test(attemptRaw) && !attemptRaw.includes('stack(') && !attemptRaw.includes('note(')) {
  const chunks = attemptRaw
    .split('\n')
    .map((l) => l.replace(/^\d+\.\s*/, '').trim().toLowerCase())
    .filter(Boolean)
    .map((text) => ({ text, category: 'drum', bits: 0 }));
  const entropy = decodeChunks(chunks);
  attemptCode = encodePattern(entropy).code;
}

const result = {
  participant_id: manifest.participant_id,
  condition: manifest.condition,
  ...score(day0, attemptCode),
  scored_at: new Date().toISOString(),
};

if (args.out) {
  mkdirSync(dirname(resolve(ROOT, args.out)), { recursive: true });
  writeFileSync(resolve(ROOT, args.out), JSON.stringify(result, null, 2) + '\n');
  console.log(`✓ scored ${manifest.participant_id} → ${args.out}`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
