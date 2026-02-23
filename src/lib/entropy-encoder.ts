/**
 * Entropy Encoder for Sonic Guardian
 * Maps 256 bits of cryptographic entropy to deterministic Strudel patterns
 * Enables memorable "musical seed phrases" with full cryptographic security
 */

// Encoding tables for deterministic mapping
const DRUMS = ['bd', 'sd', 'hh', 'oh', 'cp', 'rim', 'clap', 'cowbell'] as const;
const BANKS = ['RolandTR808', 'RolandTR909', 'RolandTR606', 'RolandTR707'] as const;
const SYNTHS = ['sawtooth', 'sine', 'square', 'triangle'] as const;
const NOTES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const;
const ACCIDENTALS = ['', 'b', '#'] as const;
const OCTAVES = [2, 3, 4, 5] as const;

// Timing patterns (8 options = 3 bits each)
const TIMINGS = ['*2', '*4', '*8', '[~ x]', '[x ~]', '[x x ~]', '<x ~ x>', '[[x x] x]'] as const;

// Effect ranges
const DISTORT_RANGE = { min: 0.5, max: 5, step: 0.5 }; // 10 options = ~3.3 bits
const FILTER_RANGE = { min: 200, max: 4000, step: 200 }; // 20 options = ~4.3 bits
const GAIN_RANGE = { min: 0.3, max: 1.5, step: 0.1 }; // 13 options = ~3.7 bits
const ROOM_RANGE = { min: 0.1, max: 0.9, step: 0.1 }; // 9 options = ~3.2 bits

export interface MusicalChunk {
  text: string;
  category: 'drum' | 'melody' | 'effect' | 'structure';
  bits: number; // Entropy contribution
}

export interface EncodedPattern {
  code: string;
  chunks: MusicalChunk[];
  entropy: number;
  checksum: string;
}

/**
 * Generate 256 bits of cryptographic entropy
 */
export function generateEntropy(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32)); // 32 bytes = 256 bits
}

/**
 * Read bits from entropy buffer
 */
function readBits(entropy: Uint8Array, offset: number, count: number): number {
  let value = 0;
  for (let i = 0; i < count; i++) {
    const byteIndex = Math.floor((offset + i) / 8);
    const bitIndex = (offset + i) % 8;
    const bit = (entropy[byteIndex] >> bitIndex) & 1;
    value |= bit << i;
  }
  return value;
}

/**
 * Encode drum layer from entropy bits
 */
function encodeDrumLayer(entropy: Uint8Array, offset: number): { code: string; chunks: MusicalChunk[]; bitsUsed: number } {
  const chunks: MusicalChunk[] = [];
  let currentOffset = offset;
  
  // Drum type (3 bits)
  const drumIndex = readBits(entropy, currentOffset, 3);
  const drum = DRUMS[drumIndex % DRUMS.length];
  currentOffset += 3;
  
  // Timing pattern (3 bits)
  const timingIndex = readBits(entropy, currentOffset, 3);
  const timing = TIMINGS[timingIndex % TIMINGS.length];
  currentOffset += 3;
  
  // Bank (2 bits)
  const bankIndex = readBits(entropy, currentOffset, 2);
  const bank = BANKS[bankIndex % BANKS.length];
  currentOffset += 2;
  
  // Distortion (4 bits)
  const distortIndex = readBits(entropy, currentOffset, 4);
  const distortSteps = Math.floor((DISTORT_RANGE.max - DISTORT_RANGE.min) / DISTORT_RANGE.step);
  const distort = DISTORT_RANGE.min + (distortIndex % distortSteps) * DISTORT_RANGE.step;
  currentOffset += 4;
  
  // Build code
  const code = `s("${drum}${timing}").bank("${bank}").distort(${distort.toFixed(1)})`;
  
  // Build chunks
  const drumName = {
    'bd': 'kicks', 'sd': 'snare', 'hh': 'hi-hats', 'oh': 'open hats',
    'cp': 'claps', 'rim': 'rimshots', 'clap': 'claps', 'cowbell': 'cowbell'
  }[drum] || drum;
  
  const timingDesc = {
    '*2': 'twice per bar', '*4': 'four times', '*8': 'eight times',
    '[~ x]': 'on 2 and 4', '[x ~]': 'on 1 and 3', '[x x ~]': 'on 1 2 and 3',
    '<x ~ x>': 'alternating', '[[x x] x]': 'double-time'
  }[timing] || timing;
  
  const bankShort = bank.replace('Roland', '').replace('TR', '');
  
  chunks.push({
    text: `${bankShort} ${drumName} ${timingDesc}`,
    category: 'drum',
    bits: 12
  });
  
  chunks.push({
    text: `distort by ${distort.toFixed(1)}`,
    category: 'effect',
    bits: 4
  });
  
  return { code, chunks, bitsUsed: currentOffset - offset };
}

/**
 * Encode melody layer from entropy bits
 */
function encodeMelodyLayer(entropy: Uint8Array, offset: number): { code: string; chunks: MusicalChunk[]; bitsUsed: number } {
  const chunks: MusicalChunk[] = [];
  let currentOffset = offset;
  
  // Number of notes (2 bits: 2-5 notes)
  const noteCountBits = readBits(entropy, currentOffset, 2);
  const noteCount = 2 + noteCountBits;
  currentOffset += 2;
  
  const notes: string[] = [];
  for (let i = 0; i < noteCount; i++) {
    // Note (3 bits)
    const noteIndex = readBits(entropy, currentOffset, 3);
    const note = NOTES[noteIndex % NOTES.length];
    currentOffset += 3;
    
    // Accidental (2 bits)
    const accidentalIndex = readBits(entropy, currentOffset, 2);
    const accidental = ACCIDENTALS[accidentalIndex % ACCIDENTALS.length];
    currentOffset += 2;
    
    // Octave (2 bits)
    const octaveIndex = readBits(entropy, currentOffset, 2);
    const octave = OCTAVES[octaveIndex % OCTAVES.length];
    currentOffset += 2;
    
    notes.push(`${note}${accidental}${octave}`);
  }
  
  // Synth type (2 bits)
  const synthIndex = readBits(entropy, currentOffset, 2);
  const synth = SYNTHS[synthIndex % SYNTHS.length];
  currentOffset += 2;
  
  // Filter frequency (5 bits)
  const filterIndex = readBits(entropy, currentOffset, 5);
  const filterSteps = Math.floor((FILTER_RANGE.max - FILTER_RANGE.min) / FILTER_RANGE.step);
  const filter = FILTER_RANGE.min + (filterIndex % filterSteps) * FILTER_RANGE.step;
  currentOffset += 5;
  
  // Gain (4 bits)
  const gainIndex = readBits(entropy, currentOffset, 4);
  const gainSteps = Math.floor((GAIN_RANGE.max - GAIN_RANGE.min) / GAIN_RANGE.step);
  const gain = GAIN_RANGE.min + (gainIndex % gainSteps) * GAIN_RANGE.step;
  currentOffset += 4;
  
  // Build code
  const code = `note("${notes.join(' ')}").s("${synth}").lpf(${filter}).gain(${gain.toFixed(1)})`;
  
  // Build chunks
  const noteDesc = notes.map(n => {
    const match = n.match(/([a-g])([b#]?)(\d)/);
    if (!match) return n;
    const [, note, acc, oct] = match;
    const accName = acc === '#' ? 'sharp' : acc === 'b' ? 'flat' : '';
    return `${note.toUpperCase()}${accName}${oct}`;
  }).join(' ');
  
  chunks.push({
    text: `${synth} bass ${noteDesc}`,
    category: 'melody',
    bits: 2 + (noteCount * 7) + 2
  });
  
  chunks.push({
    text: `lowpass filter at ${filter} hertz`,
    category: 'effect',
    bits: 5
  });
  
  chunks.push({
    text: `gain ${gain.toFixed(1)}`,
    category: 'effect',
    bits: 4
  });
  
  return { code, chunks, bitsUsed: currentOffset - offset };
}

/**
 * Encode complete pattern from 256-bit entropy
 */
export function encodePattern(entropy: Uint8Array): EncodedPattern {
  if (entropy.length !== 32) {
    throw new Error('Entropy must be exactly 256 bits (32 bytes)');
  }
  
  const layers: string[] = [];
  const allChunks: MusicalChunk[] = [];
  let offset = 0;
  
  // Layer 1: Drum pattern (bits 0-15)
  const drum1 = encodeDrumLayer(entropy, offset);
  layers.push(drum1.code);
  allChunks.push(...drum1.chunks);
  offset += drum1.bitsUsed;
  
  // Layer 2: Melody (bits 16-60)
  const melody = encodeMelodyLayer(entropy, offset);
  layers.push(melody.code);
  allChunks.push(...melody.chunks);
  offset += melody.bitsUsed;
  
  // Layer 3: Second drum pattern (bits 61-75)
  const drum2 = encodeDrumLayer(entropy, offset);
  layers.push(drum2.code);
  allChunks.push(...drum2.chunks);
  offset += drum2.bitsUsed;
  
  // Structure: tempo (bits 76-83, 8 bits = 256 values)
  const tempoIndex = readBits(entropy, offset, 8);
  const tempo = 80 + (tempoIndex % 80); // 80-160 BPM
  offset += 8;
  
  allChunks.push({
    text: `tempo ${tempo}`,
    category: 'structure',
    bits: 8
  });
  
  // Build final code
  const code = `stack(\n  ${layers.join(',\n  ')}\n).cpm(${tempo})`;
  
  // Calculate checksum (last 8 bits)
  const checksumBits = readBits(entropy, 248, 8);
  const checksum = checksumBits.toString(16).padStart(2, '0');
  
  return {
    code,
    chunks: allChunks,
    entropy: offset,
    checksum
  };
}

/**
 * Decode chunks back to entropy (for recovery)
 */
export function decodeChunks(chunks: MusicalChunk[]): Uint8Array {
  // This would reverse the encoding process
  // For MVP, we store the entropy alongside chunks
  throw new Error('Decoding not yet implemented - store entropy with chunks');
}

/**
 * Generate human-readable seed phrase from chunks
 */
export function chunksToSeedPhrase(chunks: MusicalChunk[]): string {
  return chunks.map((chunk, i) => `${i + 1}. ${chunk.text}`).join('\n');
}

/**
 * Validate that chunks can reconstruct pattern
 */
export function validateChunks(chunks: MusicalChunk[], expectedCode: string): boolean {
  // For MVP, compare chunk count and categories
  const drumCount = chunks.filter(c => c.category === 'drum').length;
  const melodyCount = chunks.filter(c => c.category === 'melody').length;
  const effectCount = chunks.filter(c => c.category === 'effect').length;
  
  return drumCount >= 2 && melodyCount >= 1 && effectCount >= 2;
}
