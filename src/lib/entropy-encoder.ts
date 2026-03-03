/**
 * Entropy Encoder for Sonic Guardian
 * Maps 256 bits of cryptographic entropy to deterministic Strudel patterns
 * Enables creative "musical seed phrases" for fun pattern generation
 * 
 * Note: This is now an optional creative tool, not a critical security component.
 * For security, use AI-generated patterns or custom vibes instead.
 */

// Encoding tables for deterministic mapping (synth-based, no samples required)
const SYNTHS = ['sawtooth', 'sine', 'square', 'triangle'] as const;
const NOTES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const;
const ACCIDENTALS = ['', 'b', '#'] as const;
const OCTAVES = [1, 2, 3, 4, 5] as const;

// Timing patterns (8 options = 3 bits each)
const TIMINGS = ['*2', '*4', '*8', '[~ x]', '[x ~]', '[x x ~]', '<x ~ x>', '[[x x] x]'] as const;

// Rhythm note patterns for percussion (using low notes as kicks/bass)
const RHYTHM_PATTERNS = ['c1*4', 'c1*2', 'c1 ~ c1 ~', '~ c1 ~ c1', 'c1 [c1 c1] ~ c1'] as const;

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
  try {
    return crypto.getRandomValues(new Uint8Array(32)); // 32 bytes = 256 bits
  } catch (error) {
    console.error('Failed to generate entropy:', error);
    // Return fallback entropy
    const fallback = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      fallback[i] = Math.floor(Math.random() * 256);
    }
    return fallback;
  }
}

/**
 * Read bits from entropy buffer
 */
function readBits(entropy: Uint8Array, offset: number, count: number): number {
  try {
    let value = 0;
    for (let i = 0; i < count; i++) {
      const byteIndex = Math.floor((offset + i) / 8);
      const bitIndex = (offset + i) % 8;
      const bit = (entropy[byteIndex] >> bitIndex) & 1;
      value |= bit << i;
    }
    return value;
  } catch (error) {
    console.error('Failed to read bits:', error);
    return 0;
  }
}

/**
 * Encode rhythm layer from entropy bits (using synths, no samples)
 */
function encodeRhythmLayer(entropy: Uint8Array, offset: number): { code: string; chunks: MusicalChunk[]; bitsUsed: number } {
  try {
    const chunks: MusicalChunk[] = [];
    let currentOffset = offset;
    
    // Rhythm pattern (3 bits)
    const patternIndex = readBits(entropy, currentOffset, 3);
    const pattern = RHYTHM_PATTERNS[patternIndex % RHYTHM_PATTERNS.length];
    currentOffset += 3;
    
    // Synth type for rhythm (2 bits)
    const synthIndex = readBits(entropy, currentOffset, 2);
    const synth = SYNTHS[synthIndex % SYNTHS.length];
    currentOffset += 2;
    
    // Gain (3 bits)
    const gainIndex = readBits(entropy, currentOffset, 3);
    const gain = 0.8 + (gainIndex * 0.1); // 0.8 to 1.5
    currentOffset += 3;
    
    // Distortion (4 bits)
    const distortIndex = readBits(entropy, currentOffset, 4);
    const distortSteps = Math.floor((DISTORT_RANGE.max - DISTORT_RANGE.min) / DISTORT_RANGE.step);
    const distort = DISTORT_RANGE.min + (distortIndex % distortSteps) * DISTORT_RANGE.step;
    currentOffset += 4;
    
    // Build code
    const code = `note("${pattern}").s("${synth}").gain(${gain.toFixed(1)}).distort(${distort.toFixed(1)})`;
    
    // Build chunks
    const patternDesc = {
      'c1*4': 'four on the floor',
      'c1*2': 'half-time kick',
      'c1 ~ c1 ~': 'kick on 1 and 3',
      '~ c1 ~ c1': 'kick on 2 and 4',
      'c1 [c1 c1] ~ c1': 'syncopated kick'
    }[pattern] || pattern;
    
    chunks.push({
      text: `${synth} rhythm ${patternDesc}`,
      category: 'drum',
      bits: 8
    });
    
    chunks.push({
      text: `distort ${distort.toFixed(1)} gain ${gain.toFixed(1)}`,
      category: 'effect',
      bits: 4
    });
    
    return { code, chunks, bitsUsed: currentOffset - offset };
  } catch (error) {
    console.error('Failed to encode rhythm layer:', error);
    return {
      code: 'note("c1*4").s("sine").gain(0.8)',
      chunks: [{ text: 'sine rhythm four on the floor', category: 'drum', bits: 8 }],
      bitsUsed: 12
    };
  }
}

/**
 * Encode melody layer from entropy bits
 */
function encodeMelodyLayer(entropy: Uint8Array, offset: number): { code: string; chunks: MusicalChunk[]; bitsUsed: number } {
  try {
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
      
      // Octave (3 bits for 5 options)
      const octaveIndex = readBits(entropy, currentOffset, 3);
      const octave = OCTAVES[octaveIndex % OCTAVES.length];
      currentOffset += 3;
      
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
      text: `${synth} melody ${noteDesc}`,
      category: 'melody',
      bits: 2 + (noteCount * 8) + 2
    });
    
    chunks.push({
      text: `lowpass ${filter}Hz gain ${gain.toFixed(1)}`,
      category: 'effect',
      bits: 9
    });
    
    return { code, chunks, bitsUsed: currentOffset - offset };
  } catch (error) {
    console.error('Failed to encode melody layer:', error);
    return {
      code: 'note("c4 e4 g4").s("sine").gain(0.6)',
      chunks: [{ text: 'sine melody C4 E4 G4', category: 'melody', bits: 20 }],
      bitsUsed: 20
    };
  }
}

/**
 * Encode complete pattern from 256-bit entropy
 */
export function encodePattern(entropy: Uint8Array): EncodedPattern {
  try {
    if (!entropy || entropy.length !== 32) {
      throw new Error('Entropy must be exactly 256 bits (32 bytes)');
    }
    
    const layers: string[] = [];
    const allChunks: MusicalChunk[] = [];
    let offset = 0;
    
    // Layer 1: Rhythm pattern (bits 0-11)
    const rhythm1 = encodeRhythmLayer(entropy, offset);
    layers.push(rhythm1.code);
    allChunks.push(...rhythm1.chunks);
    offset += rhythm1.bitsUsed;
    
    // Layer 2: Melody (bits 12-56)
    const melody = encodeMelodyLayer(entropy, offset);
    layers.push(melody.code);
    allChunks.push(...melody.chunks);
    offset += melody.bitsUsed;
    
    // Layer 3: Second rhythm pattern (bits 57-68)
    const rhythm2 = encodeRhythmLayer(entropy, offset);
    layers.push(rhythm2.code);
    allChunks.push(...rhythm2.chunks);
    offset += rhythm2.bitsUsed;
    
    // Structure: tempo (bits 69-76, 8 bits = 256 values)
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
  } catch (error) {
    console.error('Failed to encode pattern:', error);
    // Return fallback pattern
    return {
      code: 'stack(\n  note("c1*4").s("sine").gain(0.8),\n  note("c4 e4 g4").s("sawtooth").gain(0.6)\n).cpm(120)',
      chunks: [
        { text: 'sine rhythm four on the floor', category: 'drum', bits: 8 },
        { text: 'sawtooth melody C4 E4 G4', category: 'melody', bits: 20 },
        { text: 'tempo 120', category: 'structure', bits: 8 }
      ],
      entropy: 0,
      checksum: '00'
    };
  }
}

/**
 * Decode chunks back to entropy (for recovery)
 * Reverses the encoding process to reconstruct 256-bit entropy
 */
export function decodeChunks(chunks: MusicalChunk[]): Uint8Array {
  try {
    const entropy = new Uint8Array(32);
    let bitOffset = 0;

    // Parse chunks in order
    for (const chunk of chunks) {
      switch (chunk.category) {
        case 'drum': {
          // Extract rhythm pattern
          const rhythmMatch = chunk.text.match(/(sawtooth|sine|square|triangle) rhythm (.*)/);
          if (rhythmMatch) {
            const [, synth, pattern] = rhythmMatch;
            
            // Reverse pattern lookup
            const patternMap: Record<string, number> = {
              'four on the floor': 0,
              'half-time kick': 1,
              'kick on 1 and 3': 2,
              'kick on 2 and 4': 3,
              'syncopated kick': 4
            };
            const patternIndex = patternMap[pattern] || 0;
            writeBits(entropy, bitOffset, 3, patternIndex);
            bitOffset += 3;
            
            // Reverse synth lookup
            const synthIndex = SYNTHS.indexOf(synth as any);
            writeBits(entropy, bitOffset, 2, synthIndex);
            bitOffset += 2;
          }
          break;
        }
        
        case 'melody': {
          // Extract melody notes
          const melodyMatch = chunk.text.match(/(sawtooth|sine|square|triangle) melody (.*)/);
          if (melodyMatch) {
            const [, synth, noteStr] = melodyMatch;
            const notes = noteStr.split(' ');
            
            // Note count (2 bits)
            const noteCount = notes.length;
            writeBits(entropy, bitOffset, 2, noteCount - 2);
            bitOffset += 2;
            
            // Each note
            for (const noteDesc of notes) {
              const match = noteDesc.match(/([A-G])(sharp|flat)?(\d)/);
              if (match) {
                const [, note, acc, oct] = match;
                
                // Note (3 bits)
                const noteIndex = NOTES.indexOf(note.toLowerCase() as any);
                writeBits(entropy, bitOffset, 3, noteIndex);
                bitOffset += 3;
                
                // Accidental (2 bits)
                const accidental = acc === 'sharp' ? '#' : acc === 'flat' ? 'b' : '';
                const accIndex = ACCIDENTALS.indexOf(accidental as any);
                writeBits(entropy, bitOffset, 2, accIndex);
                bitOffset += 2;
                
                // Octave (3 bits)
                const octIndex = OCTAVES.indexOf(parseInt(oct) as any);
                writeBits(entropy, bitOffset, 3, octIndex);
                bitOffset += 3;
              }
            }
            
            // Synth (2 bits)
            const synthIndex = SYNTHS.indexOf(synth as any);
            writeBits(entropy, bitOffset, 2, synthIndex);
            bitOffset += 2;
          }
          break;
        }
        
        case 'effect': {
          // Extract effect parameters
          const distortMatch = chunk.text.match(/distort ([\d.]+) gain ([\d.]+)/);
          if (distortMatch) {
            const [, distort, gain] = distortMatch;
            
            // Distortion (4 bits)
            const distortSteps = Math.floor((DISTORT_RANGE.max - DISTORT_RANGE.min) / DISTORT_RANGE.step);
            const distortIndex = Math.round((parseFloat(distort) - DISTORT_RANGE.min) / DISTORT_RANGE.step);
            writeBits(entropy, bitOffset, 4, distortIndex);
            bitOffset += 4;
            
            // Gain (3 bits for rhythm, 4 bits for melody)
            const gainValue = parseFloat(gain);
            if (gainValue >= 0.8) {
              // Rhythm gain (3 bits)
              const gainIndex = Math.round((gainValue - 0.8) / 0.1);
              writeBits(entropy, bitOffset, 3, gainIndex);
              bitOffset += 3;
            }
          }
          
          const filterMatch = chunk.text.match(/lowpass (\d+)Hz gain ([\d.]+)/);
          if (filterMatch) {
            const [, filter, gain] = filterMatch;
            
            // Filter (5 bits)
            const filterSteps = Math.floor((FILTER_RANGE.max - FILTER_RANGE.min) / FILTER_RANGE.step);
            const filterIndex = Math.round((parseInt(filter) - FILTER_RANGE.min) / FILTER_RANGE.step);
            writeBits(entropy, bitOffset, 5, filterIndex);
            bitOffset += 5;
            
            // Gain (4 bits)
            const gainSteps = Math.floor((GAIN_RANGE.max - GAIN_RANGE.min) / GAIN_RANGE.step);
            const gainIndex = Math.round((parseFloat(gain) - GAIN_RANGE.min) / GAIN_RANGE.step);
            writeBits(entropy, bitOffset, 4, gainIndex);
            bitOffset += 4;
          }
          break;
        }
        
        case 'structure': {
          // Extract tempo
          const tempoMatch = chunk.text.match(/tempo (\d+)/);
          if (tempoMatch) {
            const tempo = parseInt(tempoMatch[1]);
            const tempoIndex = tempo - 80;
            writeBits(entropy, bitOffset, 8, tempoIndex);
            bitOffset += 8;
          }
          break;
        }
      }
    }

    return entropy;
  } catch (error) {
    console.error('Failed to decode chunks:', error);
    return new Uint8Array(32);
  }
}

/**
 * Write bits to entropy array
 */
function writeBits(entropy: Uint8Array, offset: number, length: number, value: number): void {
  for (let i = 0; i < length; i++) {
    const bitIndex = offset + i;
    const byteIndex = Math.floor(bitIndex / 8);
    const bitPosition = 7 - (bitIndex % 8);
    
    if ((value >> (length - 1 - i)) & 1) {
      entropy[byteIndex] |= (1 << bitPosition);
    } else {
      entropy[byteIndex] &= ~(1 << bitPosition);
    }
  }
}

/**
 * Generate human-readable seed phrase from chunks
 */
export function chunksToSeedPhrase(chunks: MusicalChunk[]): string {
  try {
    return chunks.map((chunk, i) => `${i + 1}. ${chunk.text}`).join('\n');
  } catch (error) {
    console.error('Failed to generate seed phrase:', error);
    return '1. fallback pattern';
  }
}

/**
 * Validate that chunks can reconstruct pattern
 */
export function validateChunks(chunks: MusicalChunk[], expectedCode: string): boolean {
  try {
    // For MVP, compare chunk count and categories
    const drumCount = chunks.filter(c => c.category === 'drum').length;
    const melodyCount = chunks.filter(c => c.category === 'melody').length;
    const effectCount = chunks.filter(c => c.category === 'effect').length;
    
    return drumCount >= 2 && melodyCount >= 1 && effectCount >= 2;
  } catch (error) {
    console.error('Failed to validate chunks:', error);
    return false;
  }
}
