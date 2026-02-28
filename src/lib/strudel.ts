'use client';

import { evaluate } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';

/**
 * Strudel Code Parser, Validator, and Player
 * Parses Strudel patterns, validates them, and plays audio
 */

export interface ParsedPattern {
  code: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PatternValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// State for Strudel playback
let audioInitialized = false;
let currentPattern: any = null;
let drawCb: ((haps: any[], time: number) => void) | null = null;

/**
 * Initialize Strudel audio context
 */
async function initStrudelAudio() {
  if (audioInitialized) return;

  try {
    initAudioOnFirstClick();
    audioInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Strudel audio:', error);
  }
}

/**
 * Set callback for visualizer updates
 */
export function setDrawCallback(callback: ((haps: any[], time: number) => void) | null) {
  drawCb = callback;
}

/**
 * Play Strudel code pattern
 */
export async function playStrudelCode(code: string): Promise<boolean> {
  try {
    await initStrudelAudio();

    if (currentPattern) {
      currentPattern.stop();
    }

    const transpiled = transpiler(code);
    const pattern = evaluate(transpiled, webaudioOutput);
    
    pattern.start();
    currentPattern = pattern;

    return true;
  } catch (error) {
    console.error('Failed to play Strudel code:', error);
    return false;
  }
}

/**
 * Stop Strudel playback
 */
export function stopStrudel() {
  try {
    if (currentPattern) {
      currentPattern.stop();
      currentPattern = null;
    }
  } catch (error) {
    console.error('Failed to stop Strudel:', error);
  }
}

/**
 * Check if Strudel is currently playing
 */
export function isStrudelPlaying(): boolean {
  return currentPattern !== null;
}

/**
 * Parse and validate Strudel code
 */
export function parseStrudelCode(code: string): ParsedPattern {
  try {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic syntax validation
    if (!code || typeof code !== 'string') {
      errors.push('Code must be a non-empty string');
      return { code, isValid: false, errors, warnings };
    }
    
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /import\s*\(/i,
      /require\s*\(/i,
      /fetch\s*\(/i,
      /XMLHttpRequest/i,
      /WebSocket/i,
      /crypto\.subtle/i,
      /localStorage/i,
      /sessionStorage/i,
      /document\.cookie/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        errors.push(`Potentially dangerous code pattern detected: ${pattern.source}`);
      }
    }
    
    // Check for allowed Strudel functions
    const allowedFunctions = [
      'note', 's', 'gain', 'lpf', 'hpf', 'distort', 'room', 'stack', 'slow', 'fast', 'cpm'
    ];
    
    const functionRegex = /\b(\w+)\s*\(/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const funcName = match[1];
      if (!allowedFunctions.includes(funcName)) {
        warnings.push(`Unknown function: ${funcName}`);
      }
    }
    
    // Check for valid note patterns
    const notePattern = /note\s*\(\s*["']([^"']+)["']\s*\)/g;
    while ((match = notePattern.exec(code)) !== null) {
      const notes = match[1];
      if (!isValidNotePattern(notes)) {
        errors.push(`Invalid note pattern: ${notes}`);
      }
    }
    
    return {
      code,
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    console.error('Failed to parse Strudel code:', error);
    return {
      code,
      isValid: false,
      errors: ['Failed to parse code'],
      warnings: []
    };
  }
}

/**
 * Validate note patterns
 */
function isValidNotePattern(notes: string): boolean {
  try {
    // Simple validation for note patterns
    const noteRegex = /^[a-gA-G][#b]?\d*\s*([*~\[\]<>x\s]|\/\d+)*$/;
    return noteRegex.test(notes.trim());
  } catch (error) {
    console.error('Failed to validate note pattern:', error);
    return false;
  }
}

/**
 * Sanitize Strudel code
 */
export function sanitizeStrudelCode(code: string): string {
  try {
    // Remove potentially dangerous patterns
    let sanitized = code
      .replace(/eval\s*\(/gi, '/* eval removed */')
      .replace(/Function\s*\(/gi, '/* Function removed */')
      .replace(/import\s*\(/gi, '/* import removed */')
      .replace(/require\s*\(/gi, '/* require removed */')
      .replace(/fetch\s*\(/gi, '/* fetch removed */')
      .replace(/XMLHttpRequest/gi, '/* XMLHttpRequest removed */')
      .replace(/WebSocket/gi, '/* WebSocket removed */')
      .replace(/crypto\.subtle/gi, '/* crypto.subtle removed */')
      .replace(/localStorage/gi, '/* localStorage removed */')
      .replace(/sessionStorage/gi, '/* sessionStorage removed */')
      .replace(/document\.cookie/gi, '/* document.cookie removed */');
    
    return sanitized;
  } catch (error) {
    console.error('Failed to sanitize Strudel code:', error);
    return code;
  }
}

/**
 * Extract notes from Strudel code
 */
export function extractNotes(code: string): string[] {
  try {
    const notes: string[] = [];
    const notePattern = /note\s*\(\s*["']([^"']+)["']\s*\)/g;
    let match;
    
    while ((match = notePattern.exec(code)) !== null) {
      const noteString = match[1];
      const individualNotes = noteString.split(/\s+/).filter(n => n.trim());
      notes.push(...individualNotes);
    }
    
    return notes;
  } catch (error) {
    console.error('Failed to extract notes:', error);
    return [];
  }
}

/**
 * Validate pattern complexity
 */
export function validatePatternComplexity(code: string): { isValid: boolean; complexity: number; warnings: string[] } {
  try {
    const warnings: string[] = [];
    let complexity = 0;
    
    // Count function calls
    const functionCalls = (code.match(/\w+\s*\(/g) || []).length;
    complexity += functionCalls;
    
    // Count nested structures
    const nestedStacks = (code.match(/stack\s*\(/g) || []).length;
    complexity += nestedStacks * 2;
    
    // Count timing modifiers
    const timingModifiers = (code.match(/[\*\~\/\[\]\<>]/g) || []).length;
    complexity += timingModifiers;
    
    if (complexity > 50) {
      warnings.push('Pattern may be too complex for real-time generation');
    }
    
    if (nestedStacks > 3) {
      warnings.push('Deep nesting detected - may cause performance issues');
    }
    
    return {
      isValid: complexity <= 100,
      complexity,
      warnings
    };
  } catch (error) {
    console.error('Failed to validate pattern complexity:', error);
    return {
      isValid: false,
      complexity: 0,
      warnings: ['Failed to validate complexity']
    };
  }
}

export function cleanupStrudel() {
    try {
        stopStrudel();
        audioInitialized = false;
        currentPattern = null;
        drawCb = null;
    } catch (error) {
        console.error('Failed to cleanup Strudel:', error);
    }
}
export const STRUDEL_PATTERN_LIBRARY = [
    // === RHYTHM & PERCUSSION ===
    {
        name: 'Four on the Floor',
        vibe: 'classic house kick pattern with hi-hats',
        code: `stack(
  s("bd*4").bank("RolandTR909").gain(1.2),
  s("~ hh ~ hh").bank("RolandTR909").gain(0.6),
  s("sd*2 ~ sd").bank("RolandTR909").gain(0.9)
).cpm(124)`,
        category: 'rhythm',
        features: ['basic rhythms', 'drum banks', 'stacking'],
    },
    {
        name: 'Euclidean Groove',
        vibe: 'complex polyrhythmic pattern using Euclidean distribution',
        code: `stack(
  s("bd[~ ~][~ ~]").bank("RolandTR808"),
  s("hh*8").gain(0.5),
  s("cp[~ ~ ~]").bank("RolandTR909").slow(2)
).cpm(110)`,
        category: 'rhythm',
        features: ['polyrhythm', 'nested patterns', 'euclidean-style'],
    },
    {
        name: 'Syncopated Funk',
        vibe: 'funky off-beat pattern with ghost notes',
        code: `stack(
  s("[bd ~ bd] [~ bd ~]").bank("RolandTR709"),
  s("hh[~ x][x ~][x x]").gain(0.4),
  s("[~ sd ~ sd]").bank("RolandTR909").distort(0.5)
).cpm(100)`,
        category: 'rhythm',
        features: ['syncopation', 'ghost notes', 'layered percussion'],
    },
    {
        name: 'Rotating Percussion',
        vibe: 'cyclic pattern that rotates through variations',
        code: `stack(
  s("<bd*4 bd[~ bd] bd*2 [bd ~ bd bd]>").bank("RolandTR808"),
  s("oh*2 ~").gain(0.7).room(0.3)
).cpm(128)`,
        category: 'rhythm',
        features: ['rotation', 'pattern cycling', 'variation'],
    },
    
    // === BASS & LOW END ===
    {
        name: 'Acid Bassline',
        vibe: 'squelchy 303-style acid pattern with filter modulation',
        code: `note("c2 [~ c3] bb1 [c2 eb2]").s("sawtooth")
  .lpf(<400 800 1200 1600>)
  .lpq(20)
  .distort(2)
  .gain(0.8)`,
        category: 'bass',
        features: ['filter automation', 'acid sound', 'rotation'],
    },
    {
        name: 'Deep Sub Bass',
        vibe: 'minimal sub bass with space',
        code: `note("c1 ~ ~ ~, f1 ~ ~ ~").s("sine")
  .lpf(120)
  .gain(1.0)
  .room(0.2)`,
        category: 'bass',
        features: ['sub bass', 'minimal', 'space'],
    },
    {
        name: 'Rolling Bassline',
        vibe: 'driving drum and bass style rolling pattern',
        code: `note("[c2 g2] [f2 c3] [g2 bb2] [f2 g2]").s("square")
  .lpf(600)
  .distort(0.8)
  .fast(2)`,
        category: 'bass',
        features: ['rolling pattern', 'fast tempo', 'drum and bass'],
    },
    
    // === MELODIC & HARMONIC ===
    {
        name: 'Chord Progression I-V-vi-IV',
        vibe: 'emotional pop progression with pad sounds',
        code: `n("I V vi IV").scale("C:major").chord("major7")
  .sound("gm_pad_sweep")
  .slow(4)
  .room(0.8)
  .gain(0.6)`,
        category: 'harmonic',
        features: ['chord progression', 'scales', 'seventh chords', 'slow evolution'],
    },
    {
        name: 'Jazz Turnaround',
        vibe: 'sophisticated ii-V-I progression',
        code: `n("ii V I").scale("D:minor").chord("minor7")
  .sound("piano")
  .slow(2)
  .echo(0.3)
  .room(0.5)`,
        category: 'harmonic',
        features: ['jazz harmony', 'ii-V-I', 'piano', 'echo'],
    },
    {
        name: 'Arpeggiated Synth',
        vibe: 'trance-style arpeggio with filter sweep',
        code: `n("c3 e3 g3 c4 e4 g4").pattern("<c3 g3 e3 c4>")
  .s("supersaw")
  .lpf(<200 400 800 1600>)
  .gain(0.5)
  .fast(4)`,
        category: 'melodic',
        features: ['arpeggio', 'pattern transformation', 'filter sweep', 'trance'],
    },
    {
        name: 'Pentatonic Melody',
        vibe: 'flowing pentatonic phrase with triplets',
        code: `n("c4 d4 e4 g4 a4 c5").pattern("[c4 e4 g4]/3 [d4 a4 c5]/3")
  .s("sine")
  .room(0.6)
  .delay(0.25)
  .gain(0.5)`,
        category: 'melodic',
        features: ['pentatonic', 'triplets', 'delay', 'flowing'],
    },
    {
        name: 'Call and Response',
        vibe: 'two-part melodic conversation',
        code: `stack(
  n("c4 e4 g4").s("triangle").slow(2).room(0.4),
  n("g4 e4 c4").s("sine").slow(2).room(0.6).delay(0.3)
).cpm(90)`,
        category: 'melodic',
        features: ['call and response', 'counterpoint', 'stacking'],
    },
    
    // === AMBIENT & TEXTURAL ===
    {
        name: 'Cosmic Drone',
        vibe: 'slow-evolving ambient soundscape',
        code: `stack(
  note("c2").s("sine").slow(8).room(0.95).gain(0.4),
  note("g2").s("triangle").slow(8).room(0.9).gain(0.3),
  note("c3").s("sawtooth").slow(4).lpf(400).room(0.85).gain(0.2)
).cpm(60)`,
        category: 'ambient',
        features: ['drone', 'slow evolution', 'layered textures', 'deep reverb'],
    },
    {
        name: 'Evolving Pad',
        vibe: 'morphing chordal texture with movement',
        code: `n("<I vi IV V>").scale("A:minor").chord("minor")
  .sound("gm_pad_warm")
  .slow(8)
  .lpf(<300 500 800 600>)
  .room(0.85)
  .gain(0.5)`,
        category: 'ambient',
        features: ['evolving chords', 'filter movement', 'warm pad', 'rotation'],
    },
    {
        name: 'Granular Texture',
        vibe: 'experimental granular synthesis soundscape',
        code: `stack(
  note("c4").s("fm").slow(16).vibrato(0.05).room(0.9),
  note("e4").s("sine").slow(12).phaser(0.6).gain(0.3)
).cpm(50)`,
        category: 'ambient',
        features: ['granular', 'FM synthesis', 'modulation', 'experimental'],
    },
    
    // === COMPLEX & LAYERED ===
    {
        name: 'Full Techno Arrangement',
        vibe: 'complete 4-layer techno track',
        code: `stack(
  s("bd*4").bank("RolandTR909").gain(1.2),
  s("~ sd ~ sd").bank("RolandTR909").distort(0.3),
  s("hh*16").gain(0.35).lpf(8000),
  note("c2 ~ f2 ~").s("sawtooth").lpf(400).distort(1.5).gain(0.7)
).cpm(132)`,
        category: 'complex',
        features: ['full arrangement', '4 layers', 'techno', 'complete track'],
    },
    {
        name: 'Ambient Technique',
        vibe: 'downtempo with probabilistic elements',
        code: `stack(
  s("bd[~ ~][~ bd]").bank("RolandTR808").gain(0.9),
  n("I vi IV V").scale("E:dorian").sound("gm_strings").slow(4).room(0.8),
  n("c4 d4 e4 g4").pattern("c4?0.5 d4?0.5 e4?0.5 g4?0.5").s("sine").slow(2).delay(0.4)
).cpm(95)`,
        category: 'complex',
        features: ['probabilistic', 'downtempo', 'strings', 'conditional'],
    },
    {
        name: 'Polyrhythmic Study',
        vibe: 'complex interlocking rhythmic patterns',
        code: `stack(
  s("bd*3").bank("RolandTR909").slow(3),
  s("sd*4").bank("RolandTR909").slow(4),
  s("hh*5").gain(0.4).slow(5),
  note("c2").s("sine").slow(6).room(0.7)
).cpm(100)`,
        category: 'complex',
        features: ['polyrhythm', '3 against 4 against 5', 'phase shifting', 'minimal'],
    },
    
    // === GENRE SHOWCASE ===
    {
        name: 'House Piano',
        vibe: 'classic house music piano riff',
        code: `n("[c3 e3 g3] [f3 a3 c4] [g3 b3 d4] [e3 g3 b3]").pattern("<c3 g3 e3 c4>")
  .sound("piano")
  .room(0.4)
  .gain(0.7)
  .fast(2)`,
        category: 'melodic',
        features: ['house piano', 'chord stabs', 'classic house'],
    },
    {
        name: 'DnB Breakbeat',
        vibe: 'fast breakbeat with amen-style pattern',
        code: `stack(
  s("bd [~ bd] [bd ~] bd").bank("RolandTR909").gain(1.0),
  s("sd [~ sd ~ sd]").bank("RolandTR909").gain(0.8),
  s("hh*16").gain(0.3).lpf(10000),
  note("c1 ~ ~ ~").s("sine").lpf(80).gain(0.9)
).cpm(174)`,
        category: 'complex',
        features: ['breakbeat', 'drum and bass', 'fast tempo', 'amen-style'],
    },
    {
        name: 'Lo-Fi Hip Hop',
        vibe: 'chill lo-fi beat with vinyl warmth',
        code: `stack(
  s("bd ~ [bd ~]").bank("RolandTR808").gain(0.8).crush(8),
  s("~ sd ~ ~").bank("RolandTR808").gain(0.6).crush(8),
  s("hh*8").gain(0.3).crush(8).lpf(4000),
  n("I vi IV V").scale("F:major").sound("piano").slow(4).room(0.5).crush(10)
).cpm(85)`,
        category: 'complex',
        features: ['lo-fi', 'bitcrush', 'chill', 'hip hop'],
    },
];
