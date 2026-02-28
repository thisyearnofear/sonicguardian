'use client';

import { evaluate } from '@strudel/core';
import { webaudioInit } from '@strudel/webaudio';
import { transpile } from '@strudel/transpiler';

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
    await webaudioInit();
    audioInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Strudel audio:', error);
  }
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
    
    const transpiled = transpile(code);
    const pattern = evaluate(transpiled);
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
 * Set callback for visualizer updates
 */
export function setDrawCallback(callback: ((haps: any[], time: number) => void) | null) {
  drawCb = callback;
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

/**
 * Curated pattern library using synths instead of samples
 * Synths don't require sample loading and work immediately
 */
export const STRUDEL_PATTERN_LIBRARY = [
    {
        name: 'Techno Pulse',
        vibe: 'a driving industrial kick with a fast dark synth loop',
        code: `stack(
  note("c1*4").s("triangle").gain(1.2),
  note("~ c2 ~ c2").s("square").gain(0.8),
  note("c4*8").s("sine").gain(0.3)
)`,
        category: 'rhythm',
    },
    {
        name: 'Acid Resonance',
        vibe: 'a squelchy bassline with high resonance and distortion',
        code: `note("c2 [~ c3] bb1 [c2 eb2]").s("sawtooth").lpf(800).lpq(18).distort(1.5).gain(0.7)`,
        category: 'bass',
    },
    {
        name: 'Ambient Drift',
        vibe: 'layered evolving pads with slow granular texture',
        code: `stack(
  note("c4 eb4 g4 bb4").s("triangle").slow(4).room(0.8).gain(0.6),
  note("c3").s("sine").slow(8).room(0.9).gain(0.3)
)`,
        category: 'ambient',
    },
    {
        name: 'Bass Groove',
        vibe: 'deep bass with rhythmic pulse',
        code: `note("c2 ~ f2 ~, c3*4").s("sawtooth").lpf(400).gain(0.8)`,
        category: 'bass',
    },
    {
        name: 'Minimal Pulse',
        vibe: 'minimal techno with sparse elements',
        code: `stack(
  note("c1*2").s("triangle").gain(1.0),
  note("~ c3 ~ ~").s("square").gain(0.6)
)`,
        category: 'rhythm',
    },
    {
        name: 'Deep Space',
        vibe: 'slow evolving cosmic drone',
        code: `stack(
  note("<c4 eb4 g4 f4>").s("sine").slow(6).room(0.95).gain(0.5),
  note("c2").s("triangle").slow(8).gain(0.3).room(0.9)
)`,
        category: 'ambient',
    },
];
