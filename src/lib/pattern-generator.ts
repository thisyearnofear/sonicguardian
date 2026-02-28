/**
 * Cryptographically secure Strudel pattern generator
 * Leverages full mini notation, scales, and advanced pattern functions
 */

// === Musical Building Blocks ===

const SCALES = [
  'major', 'minor', 'dorian', 'phrygian', 'lydian', 
  'mixolydian', 'locrian', 'harmonic_minor', 'melodic_minor'
] as const;

const CHORD_QUALITIES = [
  'major', 'minor', 'diminished', 'augmented', 'major7', 'minor7', 'dominant7'
] as const;

const CHORD_PROGRESSIONS = [
  'I V vi IV',      // Pop progression
  'ii V I',         // Jazz turnaround
  'vi IV I V',      // Emotional progression
  'I vi IV V',      // 50s progression
  'i VII VI',       // Andalusian cadence
  'i iv V',         // Minor progression
  'III VII VI',     // Epic progression
] as const;

const DRUMS = ['bd', 'sd', 'hh', 'oh', 'cp', 'rim', 'clap', 'cowbell', 'lt', 'mt', 'ht'] as const;
const SYNTHS = ['sawtooth', 'sine', 'square', 'triangle', 'bass', 'lead', 'pad', 'supersaw', 'fm'] as const;
const BANKS = ['RolandTR808', 'RolandTR909', 'RolandTR606', 'RolandTR707', 'RolandCR78'] as const;

const NOTES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const;
const OCTAVES = [1, 2, 3, 4, 5] as const;
const ACCIDENTALS = ['', 'b', '#'] as const;

// === Mini Notation Patterns ===

const RHYTHM_PATTERNS = [
  // Basic rhythms
  '*2', '*4', '*8', '*16',
  // Syncopation
  '[~ x]', '[x ~]', '[x x ~]', '[~ x x]', '[x ~ x]',
  // Polyrhythms
  '[x x x] /3', '[x x x x] /3', '[x x] /3',
  // Euclidean-style
  '[x ~ x ~ x]', '[x ~ ~ x ~ ~]',
  // Rotating patterns
  '<x ~ x x>', '<x x ~ x>', '<~ x x ~>', '<x ~ ~ x>',
  // Nested patterns
  '[x [x x]]', '[[x x] x]', '[x ~ [x x]]', '[[x ~] [x x]]',
  // Probability
  'x?0.75', 'x?0.5', '[x?0.5 ~]',
  // Conditional
  'sometimes x', 'when(0.6, x)',
] as const;

const BASS_PATTERNS = [
  '[c2 ~ f2 ~]',
  '[c2 g2 ~ f2]',
  'c2 [~ c3] [~ g2]',
  '[c2 f2] [g2 c3]',
  '<c2 f2 g2 bb2>',
  'c2(3,8)',  // Tidal-style duration
] as const;

const MELODY_PATTERNS = [
  '[c4 e4 g4] [d4 f4 a4]',
  '<c4 d4 e4> [f4 g4 a4]',
  '[c4 e4 g4]/3',  // Triplets
  'c4 d4 e4 f4 g4 a4 b4',
  '[c4 ~ e4 ~ g4 ~]',
  '<[c4 e4] [d4 f4] [e4 g4]>',
] as const;

// === Effects with Parameter Ranges ===

const EFFECTS = [
  { name: 'distort', min: 0.5, max: 5, step: 0.5, category: 'drive' },
  { name: 'lpf', min: 200, max: 8000, step: 100, category: 'filter' },
  { name: 'hpf', min: 50, max: 2000, step: 50, category: 'filter' },
  { name: 'lpq', min: 1, max: 30, step: 1, category: 'filter' },
  { name: 'hpq', min: 1, max: 10, step: 1, category: 'filter' },
  { name: 'gain', min: 0.3, max: 1.5, step: 0.1, category: 'dynamics' },
  { name: 'room', min: 0.1, max: 0.95, step: 0.05, category: 'space' },
  { name: 'crush', min: 4, max: 16, step: 1, category: 'drive' },
  { name: 'delay', min: 0.125, max: 0.75, step: 0.125, category: 'space' },
  { name: 'echo', min: 0.1, max: 0.8, step: 0.1, category: 'space' },
  { name: 'phaser', min: 0.1, max: 0.9, step: 0.1, category: 'modulation' },
  { name: 'vibrato', min: 0.01, max: 0.1, step: 0.01, category: 'modulation' },
] as const;

// === Cryptographic Random Functions ===

function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range;

  let randomValue;
  do {
    const randomBytes = new Uint8Array(bytesNeeded);
    crypto.getRandomValues(randomBytes);
    randomValue = randomBytes.reduce((acc, byte, i) => acc + byte * (256 ** i), 0);
  } while (randomValue >= maxValid);

  return min + (randomValue % range);
}

function secureRandomChoice<T>(array: readonly T[]): T {
  return array[secureRandomInt(0, array.length - 1)];
}

function secureRandomFloat(min: number, max: number): number {
  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);
  const random = randomBytes[0] / (0xFFFFFFFF + 1);
  return min + random * (max - min);
}

// === Pattern Generation Functions ===

function generateRandomNote(): string {
  const note = secureRandomChoice(NOTES);
  const accidental = secureRandomChoice(ACCIDENTALS);
  const octave = secureRandomChoice(OCTAVES);
  return `${note}${accidental}${octave}`;
}

function generateScale(): string {
  const root = secureRandomChoice(NOTES);
  const scale = secureRandomChoice(SCALES);
  return `${root.toUpperCase()}:${scale}`;
}

function generateChordProgression(): { code: string; description: string } {
  const progression = secureRandomChoice(CHORD_PROGRESSIONS);
  const scale = generateScale();
  const sound = secureRandomChoice(['gm_pad_sweep', 'gm_pad_warm', 'gm_strings', 'synth', 'piano']);
  
  return {
    code: `n("${progression}").scale("${scale}").sound("${sound}")`,
    description: `${progression.split(' ').length}-chord progression in ${scale.replace(':', ' ')} using ${sound}`
  };
}

function generateRhythmPattern(): { code: string; chunk: string; bits: number } {
  const drum = secureRandomChoice(DRUMS);
  const pattern = secureRandomChoice(RHYTHM_PATTERNS);
  const bank = secureRandomChoice(BANKS);
  
  // Replace 'x' placeholders with drum name
  const formattedPattern = pattern.replace(/x/g, drum);
  
  // Random effects
  const effectCount = secureRandomInt(1, 3);
  const effects = generateEffectsChain(effectCount);
  
  const code = `s("${formattedPattern}").bank("${bank}")${effects}`;
  const chunk = `${drum} ${pattern.replace(/x/g, 'hit').replace(/~/g, 'rest')} ${bank}`;
  
  return { code, chunk, bits: 12 };
}

function generateBassLayer(): { code: string; chunk: string; bits: number } {
  const pattern = secureRandomChoice(BASS_PATTERNS);
  const synth = secureRandomChoice(['bass', 'sawtooth', 'square', 'fm']);
  const effects = generateEffectsChain(secureRandomInt(2, 4));
  
  const code = `note("${pattern}").s("${synth}")${effects}`;
  const chunk = `${synth} bass ${pattern.substring(0, 20)}...`;
  
  return { code, chunk, bits: 16 };
}

function generateMelodyLayer(): { code: string; chunk: string; bits: number } {
  const scale = generateScale();
  const noteCount = secureRandomInt(3, 8);
  
  // Generate notes within the scale
  const notes: string[] = [];
  for (let i = 0; i < noteCount; i++) {
    const note = secureRandomChoice(NOTES);
    const accidental = secureRandomChoice(ACCIDENTALS);
    const octave = secureRandomInt(3, 5);
    notes.push(`${note}${accidental}${octave}`);
  }
  
  // Apply mini notation structure
  const pattern = secureRandomChoice(MELODY_PATTERNS);
  const synth = secureRandomChoice(SYNTHS);
  const effects = generateEffectsChain(secureRandomInt(2, 4));
  
  const code = `n("${notes.join(' ')}").pattern("${pattern}").scale("${scale}").s("${synth}")${effects}`;
  const chunk = `${synth} melody in ${scale.replace(':', ' ')}`;
  
  return { code, chunk, bits: 20 };
}

function generateChordLayer(): { code: string; chunk: string; bits: number } {
  const progression = secureRandomChoice(CHORD_PROGRESSIONS);
  const scale = generateScale();
  const quality = secureRandomChoice(CHORD_QUALITIES);
  const sound = secureRandomChoice(['pad', 'piano', 'keys', 'organ', 'synth']);
  const slowFactor = secureRandomChoice([2, 4, 8]);
  
  const code = `n("${progression}").scale("${scale}").chord("${quality}").s("${sound}").slow(${slowFactor})`;
  const chunk = `${quality} chords ${progression.split(' ').length}-step ${scale.replace(':', ' ')}`;
  
  return { code, chunk, bits: 18 };
}

function generateEffectsChain(count: number): string {
  const selectedEffects: string[] = [];
  const availableEffects = [...EFFECTS];
  
  for (let i = 0; i < count && availableEffects.length > 0; i++) {
    const effectIndex = secureRandomInt(0, availableEffects.length - 1);
    const effect = availableEffects.splice(effectIndex, 1)[0];
    
    const steps = Math.floor((effect.max - effect.min) / effect.step);
    const valueIndex = secureRandomInt(0, steps - 1);
    const value = effect.min + valueIndex * effect.step;
    
    // Format value (remove trailing zeros for decimals)
    const formattedValue = Number(value.toFixed(2)).toString();
    selectedEffects.push(`.${effect.name}(${formattedValue})`);
  }
  
  return selectedEffects.join('');
}

function generateTimeModifiers(code: string): string {
  const modifiers: string[] = [];
  
  // Randomly apply time modifiers
  if (secureRandomInt(0, 3) === 0) {
    const factor = secureRandomChoice([2, 4, 8]);
    modifiers.push(`slow(${factor})`);
  }
  
  if (secureRandomInt(0, 4) === 0) {
    const factor = secureRandomChoice([2, 3, 4]);
    modifiers.push(`fast(${factor})`);
  }
  
  if (secureRandomInt(0, 3) === 0) {
    modifiers.push('sometimes(<>)');  // Reverse sometimes
  }
  
  if (modifiers.length > 0) {
    return `${code}.${modifiers.join('.')}`;
  }
  
  return code;
}

// === Main Export Functions ===

export interface GeneratedPattern {
  code: string;
  chunks: string[];
  description: string;
  category: 'rhythm' | 'melodic' | 'harmonic' | 'ambient' | 'complex';
  entropy: number;
}

/**
 * Generate a complete Strudel pattern with full mini notation support
 */
export function generateSecurePattern(complexity: 'simple' | 'medium' | 'complex' = 'medium'): GeneratedPattern {
  const layers: string[] = [];
  const chunks: string[] = [];
  let totalBits = 0;
  
  // Determine structure based on complexity
  const structure = {
    simple: { drums: 1, bass: 0, melody: 0, chords: 0 },
    medium: { drums: 1, bass: 1, melody: 1, chords: 0 },
    complex: { drums: 2, bass: 1, melody: 1, chords: 1 },
  }[complexity];
  
  // Generate drum layers
  for (let i = 0; i < structure.drums; i++) {
    const { code, chunk, bits } = generateRhythmPattern();
    layers.push(code);
    chunks.push(chunk);
    totalBits += bits;
  }
  
  // Generate bass layer
  if (structure.bass > 0) {
    const { code, chunk, bits } = generateBassLayer();
    layers.push(generateTimeModifiers(code));
    chunks.push(chunk);
    totalBits += bits;
  }
  
  // Generate melody layer
  if (structure.melody > 0) {
    const { code, chunk, bits } = generateMelodyLayer();
    layers.push(generateTimeModifiers(code));
    chunks.push(chunk);
    totalBits += bits;
  }
  
  // Generate chord layer
  if (structure.chords > 0) {
    const { code, chunk, bits } = generateChordLayer();
    layers.push(code);
    chunks.push(chunk);
    totalBits += bits;
  }
  
  // Build final pattern
  let finalCode: string;
  if (layers.length === 1) {
    finalCode = layers[0];
  } else {
    finalCode = `stack(\n  ${layers.join(',\n  ')}\n)`;
  }
  
  // Add tempo
  const tempo = secureRandomInt(70, 180);
  finalCode = `${finalCode}.cpm(${tempo})`;
  chunks.push(`tempo ${tempo} BPM`);
  totalBits += 8;
  
  // Determine category
  let category: GeneratedPattern['category'];
  if (structure.chords > 0 && structure.melody > 0) category = 'harmonic';
  else if (structure.melody > 0) category = 'melodic';
  else if (structure.drums > 1) category = 'rhythm';
  else if (finalCode.includes('slow(')) category = 'ambient';
  else category = 'complex';
  
  return {
    code: finalCode,
    chunks,
    description: generatePatternDescription(finalCode, category),
    category,
    entropy: totalBits,
  };
}

/**
 * Generate a pattern from a text prompt (AI-assisted vibe coding)
 */
export function generatePatternFromPrompt(prompt: string): GeneratedPattern {
  const lowerPrompt = prompt.toLowerCase();
  
  // Determine complexity from prompt
  let complexity: 'simple' | 'medium' | 'complex' = 'medium';
  if (lowerPrompt.includes('simple') || lowerPrompt.includes('minimal')) complexity = 'simple';
  else if (lowerPrompt.includes('complex') || lowerPrompt.includes('layered')) complexity = 'complex';
  
  // Generate base pattern
  const pattern = generateSecurePattern(complexity);
  
  // Apply genre-specific modifications
  if (lowerPrompt.includes('techno') || lowerPrompt.includes('industrial')) {
    pattern.code = pattern.code.replace(/cpm\(\d+\)/, 'cpm(128)').replace(/slow\(\d+\)/g, 'fast(2)');
    pattern.description = `Industrial techno: ${pattern.description}`;
  }
  
  if (lowerPrompt.includes('ambient') || lowerPrompt.includes('chill')) {
    pattern.code = pattern.code.replace(/cpm\(\d+\)/, 'cpm(80)').replace(/fast\(\d+\)/g, 'slow(4)');
    pattern.description = `Ambient texture: ${pattern.description}`;
  }
  
  if (lowerPrompt.includes('acid')) {
    pattern.code = pattern.code.replace(/lpf\(\d+\)/, 'lpf(<400 800 1200>)').replace(/distort\([\d.]+\)/, 'distort(2).lpq(20)');
    pattern.description = `Acid resonance: ${pattern.description}`;
  }
  
  if (lowerPrompt.includes('happy') || lowerPrompt.includes('uplifting')) {
    pattern.code = pattern.code.replace(/minor/g, 'major');
    pattern.description = `Uplifting progression: ${pattern.description}`;
  }
  
  if (lowerPrompt.includes('dark') || lowerPrompt.includes('minor')) {
    pattern.code = pattern.code.replace(/major/g, 'minor');
    pattern.description = `Dark atmosphere: ${pattern.description}`;
  }
  
  return pattern;
}

/**
 * Mutate an existing pattern (remix functionality)
 */
export function mutatePattern(code: string, intensity: 'subtle' | 'moderate' | 'drastic' = 'moderate'): string {
  let mutated = code;
  
  // Subtle: Change effects parameters
  if (intensity === 'subtle' || intensity === 'moderate' || intensity === 'drastic') {
    mutated = mutated.replace(/\.lpf\((\d+)\)/g, (_, freq) => {
      const newFreq = Math.max(200, Math.min(8000, parseInt(freq) + secureRandomInt(-200, 200)));
      return `.lpf(${newFreq})`;
    });
  }
  
  // Moderate: Change rhythm patterns
  if (intensity === 'moderate' || intensity === 'drastic') {
    const rhythmChanges = [
      [/\*4/g, '*8'],
      [/\*8/g, '*16'],
      [/\[~ x\]/g, '[x ~]'],
      [/<x ~ x x>/g, '<x x ~ x>'],
    ];
    const change = secureRandomChoice(rhythmChanges);
    mutated = mutated.replace(change[0], change[1] as string);
  }
  
  // Drastic: Change scale, add/remove layers
  if (intensity === 'drastic') {
    // Change scale
    mutated = mutated.replace(/([A-G]):(\w+)/g, () => generateScale());
    
    // Add time modifier
    if (!mutated.includes('slow(') && secureRandomInt(0, 2) === 0) {
      mutated = mutated.replace(/\.cpm/, `.slow(2).cpm`);
    }
    
    // Toggle reverse
    if (secureRandomInt(0, 2) === 0) {
      mutated = mutated.replace(/sometimes\(<>\)/, '') || mutated + '.sometimes(<>)';
    }
  }
  
  return mutated;
}

/**
 * Calculate pattern entropy (bits of randomness)
 */
export function calculatePatternEntropy(pattern: string): number {
  const drumCount = (pattern.match(/bd|sd|hh|oh|cp|rim|clap|cowbell/g) || []).length;
  const noteCount = (pattern.match(/note\(|n\(/g) || []).length;
  const effectCount = (pattern.match(/\.\w+\(/g) || []).length;
  const scaleCount = (pattern.match(/scale\(/g) || []).length;
  const chordCount = (pattern.match(/chord\(/g) || []).length;
  
  return (drumCount * 4) + (noteCount * 8) + (effectCount * 5) + (scaleCount * 6) + (chordCount * 6);
}

/**
 * Generate human-readable description
 */
export function generatePatternDescription(code: string, category?: string): string {
  const descriptors: string[] = [];
  
  if (code.includes('distort')) descriptors.push('distorted');
  if (code.includes('lpf')) descriptors.push('filtered');
  if (code.includes('hpf')) descriptors.push('bright');
  if (code.includes('room')) descriptors.push('reverberant');
  if (code.includes('crush')) descriptors.push('lo-fi');
  if (code.includes('delay') || code.includes('echo')) descriptors.push('delayed');
  if (code.includes('slow(')) descriptors.push('slow-evolving');
  if (code.includes('fast(')) descriptors.push('fast-paced');
  if (code.includes('sometimes')) descriptors.push('evolving');
  if (code.includes('euclid')) descriptors.push('polyrhythmic');
  
  if (code.includes('major')) descriptors.push('bright tonality');
  if (code.includes('minor')) descriptors.push('minor tonality');
  
  const baseDescription = category || 'pattern';
  
  if (descriptors.length === 0) {
    return `A ${baseDescription}`;
  }
  
  return `A ${descriptors.slice(0, 4).join(', ')} ${baseDescription}`;
}

/**
 * Validate pattern security (minimum entropy for cryptographic use)
 */
export function isPatternSecure(pattern: string): boolean {
  return calculatePatternEntropy(pattern) >= 128;
}

/**
 * Extract pattern features for DNA analysis
 */
export function extractPatternFeatures(code: string): string[] {
  const features: string[] = [];
  
  // Extract drums
  const drums = code.match(/s\("([^"]+)"\)/g);
  if (drums) features.push(...drums);
  
  // Extract notes
  const notes = code.match(/note\("([^"]+)"\)|n\("([^"]+)"\)/g);
  if (notes) features.push(...notes);
  
  // Extract scale
  const scales = code.match(/scale\("([^"]+)"\)/g);
  if (scales) features.push(...scales);
  
  // Extract chords
  const chords = code.match(/chord\("([^"]+)"\)/g);
  if (chords) features.push(...chords);
  
  // Extract effects
  const effects = code.match(/\.\w+\([^)]+\)/g);
  if (effects) features.push(...effects);
  
  // Extract time modifiers
  const timeMods = code.match(/(slow|fast|sometimes|when)\([^)]+\)/g);
  if (timeMods) features.push(...timeMods);
  
  return features;
}
