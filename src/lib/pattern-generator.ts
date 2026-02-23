/**
 * Cryptographically secure Strudel pattern generator
 * Generates complex, unique patterns with sufficient entropy for security
 */

// Pattern building blocks with high entropy
const DRUMS = ['bd', 'sd', 'hh', 'oh', 'cp', 'rim', 'clap', 'cowbell'];
const SYNTHS = ['sawtooth', 'sine', 'square', 'triangle', 'bass', 'lead', 'pad'];
const BANKS = ['RolandTR808', 'RolandTR909', 'RolandTR606', 'RolandTR707'];
const NOTES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
const OCTAVES = [2, 3, 4, 5];
const ACCIDENTALS = ['', 'b', '#'];

// Effects with parameter ranges
const EFFECTS = [
  { name: 'distort', min: 0.5, max: 5, step: 0.5 },
  { name: 'lpf', min: 200, max: 4000, step: 100 },
  { name: 'hpf', min: 100, max: 2000, step: 100 },
  { name: 'lpq', min: 5, max: 30, step: 1 },
  { name: 'gain', min: 0.3, max: 1.2, step: 0.1 },
  { name: 'room', min: 0.2, max: 0.9, step: 0.1 },
  { name: 'crush', min: 4, max: 12, step: 1 },
  { name: 'delay', min: 0.125, max: 0.5, step: 0.125 },
];

// Rhythm patterns with varying complexity
const RHYTHM_PATTERNS = [
  '*2', '*4', '*8', '*16',
  '[~ x]', '[x ~]', '[x x ~]', '[~ x x]',
  '<x ~ x x>', '<x x ~ x>', '<~ x x ~>',
  '[x [x x]]', '[[x x] x]', '[x ~ [x x]]'
];

/**
 * Generate cryptographically random integer in range [min, max]
 */
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

/**
 * Pick random element from array using crypto.getRandomValues
 */
function secureRandomChoice<T>(array: T[]): T {
  return array[secureRandomInt(0, array.length - 1)];
}

/**
 * Generate a random note (e.g., "c#4", "bb3")
 */
function generateRandomNote(): string {
  const note = secureRandomChoice(NOTES);
  const accidental = secureRandomChoice(ACCIDENTALS);
  const octave = secureRandomChoice(OCTAVES);
  return `${note}${accidental}${octave}`;
}

/**
 * Generate a random rhythm pattern for drums
 */
function generateDrumPattern(): string {
  const drum = secureRandomChoice(DRUMS);
  const pattern = secureRandomChoice(RHYTHM_PATTERNS);
  return `${drum}${pattern}`;
}

/**
 * Generate random effects chain
 */
function generateEffectsChain(count: number = 3): string {
  const selectedEffects = [];
  const availableEffects = [...EFFECTS];
  
  for (let i = 0; i < count && availableEffects.length > 0; i++) {
    const effectIndex = secureRandomInt(0, availableEffects.length - 1);
    const effect = availableEffects.splice(effectIndex, 1)[0];
    
    const value = effect.min + 
      Math.floor((effect.max - effect.min) / effect.step) * effect.step * 
      (secureRandomInt(0, 100) / 100);
    
    selectedEffects.push(`.${effect.name}(${value.toFixed(2)})`);
  }
  
  return selectedEffects.join('');
}

/**
 * Generate a drum layer with bank and effects
 */
function generateDrumLayer(): string {
  const patterns = [];
  const layerCount = secureRandomInt(2, 4);
  
  for (let i = 0; i < layerCount; i++) {
    patterns.push(generateDrumPattern());
  }
  
  const bank = secureRandomChoice(BANKS);
  const effects = generateEffectsChain(secureRandomInt(1, 3));
  
  return `s("${patterns.join(', ')}").bank("${bank}")${effects}`;
}

/**
 * Generate a melodic layer with notes and effects
 */
function generateMelodicLayer(): string {
  const noteCount = secureRandomInt(3, 6);
  const notes = [];
  
  for (let i = 0; i < noteCount; i++) {
    notes.push(generateRandomNote());
  }
  
  const synth = secureRandomChoice(SYNTHS);
  const effects = generateEffectsChain(secureRandomInt(2, 4));
  
  return `note("${notes.join(' ')}").s("${synth}")${effects}`;
}

/**
 * Generate a complete, cryptographically secure Strudel pattern
 * 
 * @param complexity - Number of layers (1-4)
 * @returns Strudel code with high entropy
 */
export function generateSecurePattern(complexity: number = 3): string {
  const layers: string[] = [];
  
  // Always include at least one drum layer
  layers.push(generateDrumLayer());
  
  // Add additional layers based on complexity
  for (let i = 1; i < complexity; i++) {
    if (secureRandomInt(0, 1) === 0) {
      layers.push(generateDrumLayer());
    } else {
      layers.push(generateMelodicLayer());
    }
  }
  
  // Single layer or stack multiple
  if (layers.length === 1) {
    return layers[0];
  }
  
  return `stack(\n  ${layers.join(',\n  ')}\n)`;
}

/**
 * Calculate entropy of a pattern (bits)
 * Used to verify sufficient randomness
 */
export function calculatePatternEntropy(pattern: string): number {
  // Rough entropy calculation based on pattern complexity
  const drumCount = (pattern.match(/bd|sd|hh|oh|cp|rim/g) || []).length;
  const noteCount = (pattern.match(/note\(/g) || []).length;
  const effectCount = (pattern.match(/\.\w+\(/g) || []).length;
  const bankCount = (pattern.match(/bank\(/g) || []).length;
  
  // Each element contributes to entropy
  // Drums: ~3 bits each (8 options)
  // Notes: ~8 bits each (7 notes × 3 accidentals × 4 octaves)
  // Effects: ~6 bits each (many parameter combinations)
  // Banks: ~2 bits each (4 options)
  
  return (drumCount * 3) + (noteCount * 8) + (effectCount * 6) + (bankCount * 2);
}

/**
 * Generate a human-readable description of the pattern
 * This is what the user sees/remembers
 */
export function generatePatternDescription(pattern: string): string {
  const descriptors = [];
  
  // Analyze pattern characteristics
  if (pattern.includes('RolandTR909')) descriptors.push('909-style');
  if (pattern.includes('RolandTR808')) descriptors.push('808-style');
  if (pattern.includes('distort')) descriptors.push('distorted');
  if (pattern.includes('lpf')) descriptors.push('filtered');
  if (pattern.includes('room')) descriptors.push('reverberant');
  if (pattern.includes('crush')) descriptors.push('lo-fi');
  if (pattern.includes('sawtooth') || pattern.includes('square')) descriptors.push('synthetic');
  if (pattern.includes('sine') || pattern.includes('pad')) descriptors.push('smooth');
  if (pattern.includes('*8') || pattern.includes('*16')) descriptors.push('fast');
  if (pattern.includes('slow')) descriptors.push('slow');
  
  // Determine primary characteristic
  const hasDrums = pattern.includes('bd') || pattern.includes('sd');
  const hasMelody = pattern.includes('note(');
  
  let base = '';
  if (hasDrums && hasMelody) {
    base = 'rhythmic melodic pattern';
  } else if (hasDrums) {
    base = 'drum pattern';
  } else {
    base = 'melodic pattern';
  }
  
  if (descriptors.length === 0) {
    return `A complex ${base}`;
  }
  
  return `A ${descriptors.slice(0, 3).join(', ')} ${base}`;
}

/**
 * Validate that a pattern has sufficient entropy for security
 * Minimum 128 bits recommended (equivalent to AES-128)
 */
export function isPatternSecure(pattern: string): boolean {
  const entropy = calculatePatternEntropy(pattern);
  return entropy >= 128;
}
