'use client';

import { repl, evalScope } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds, samples, aliasBank } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';

/**
 * Strudel Code Parser, Validator, and Player
 * Uses the official repl.evaluate() API for reliable playback.
 */

export interface ParsedPattern {
  code: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Singleton state
let audioInitialized = false;
let replInstance: { evaluate: (code: string, autostart?: boolean) => Promise<any>; stop: () => void; start: () => void; scheduler: any; state: any } | null = null;
let drawCb: ((haps: any[], time: number) => void) | null = null;
let animationFrameId: number | null = null;

/**
 * Initialize Strudel audio context and engine
 */
export async function initStrudelAudio() {
  if (audioInitialized && replInstance) return;

  try {
    // 1. Prepare Web Audio resume on interaction
    initAudioOnFirstClick();
    
    // 2. Register synth sounds + load drum machine samples using github: format
    await Promise.all([
      registerSynthSounds(),
      samples('github:tidalcycles/dirt-samples'),
      samples('github:felixroos/dough-samples/tidal-drum-machines'),
      samples('github:felixroos/dough-samples/piano'),
    ]);
    // Alias bank names (e.g. "RolandTR909" -> actual sample paths)
    await aliasBank(`https://raw.githubusercontent.com/todepond/samples/main/tidal-drum-machines-alias.json`);
    
    // 3. Setup evaluation scope — makes Strudel functions (s, note, stack, etc.) available
    await evalScope(
      import('@strudel/core'),
      import('@strudel/mini'),
      import('@strudel/tonal'),
      import('@strudel/webaudio')
    );

    // 4. Initialize the REPL — this is the correct API for code evaluation
    const ctx = getAudioContext();
    replInstance = repl({
      defaultOutput: webaudioOutput,
      getTime: () => ctx.currentTime,
      transpiler,
    });
    
    // 5. Ensure context is running
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    audioInitialized = true;
    console.log('🌀 Strudel Engine Ready');
    
    // 6. Start visualizer sync loop
    startVisualizerLoop();
  } catch (error) {
    console.error('Failed to initialize Strudel audio:', error);
  }
}

/**
 * Sync loop for visualizer updates
 */
function startVisualizerLoop() {
  if (animationFrameId) return;

  const loop = () => {
    if (drawCb && replInstance?.scheduler) {
      const time = getAudioContext().currentTime;
      const haps = replInstance.scheduler.getHaps ? replInstance.scheduler.getHaps(time - 0.1, time + 0.2) : [];
      drawCb(haps, time);
    }
    animationFrameId = requestAnimationFrame(loop);
  };
  
  animationFrameId = requestAnimationFrame(loop);
}

/**
 * Set callback for visualizer updates
 */
export function setDrawCallback(callback: ((haps: any[], time: number) => void) | null) {
  drawCb = callback;
}

/**
 * Play Strudel code pattern using the repl's evaluate() method
 */
export async function playStrudelCode(code: string): Promise<boolean> {
  try {
    if (!audioInitialized || !replInstance) {
      await initStrudelAudio();
    }

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (!replInstance) {
      throw new Error('Could not initialize Strudel REPL');
    }

    // Use the repl's evaluate() — it handles transpilation, eval scoping,
    // pattern collection ($: syntax), and scheduler wiring correctly.
    await replInstance.evaluate(code);

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
    if (replInstance) {
      replInstance.stop();
    }
  } catch (error) {
    console.error('Failed to stop Strudel:', error);
  }
}

/**
 * Check if Strudel is currently playing
 */
export function isStrudelPlaying(): boolean {
  return replInstance?.state?.started ?? false;
}

/**
 * Cleanup Strudel resources
 */
export function cleanupStrudel() {
  try {
    stopStrudel();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } catch (error) {
    console.error('Failed to cleanup Strudel:', error);
  }
}

/**
 * Parse and validate Strudel code
 */
export function parseStrudelCode(code: string): ParsedPattern {
  try {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!code || typeof code !== 'string') {
      errors.push('Code must be a non-empty string');
      return { code, isValid: false, errors, warnings };
    }
    
    const dangerousPatterns = [/eval\s*\(/i, /Function\s*\(/i, /localStorage/i, /document\.cookie/i];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        errors.push(`Potentially dangerous code pattern detected`);
      }
    }
    
    return {
      code,
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return { code, isValid: false, errors: ['Parse failed'], warnings: [] };
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
  s("bd(3,8)").bank("RolandTR808"),
  s("hh*8").gain(0.5),
  s("cp(2,4)").bank("RolandTR909").slow(2)
).cpm(110)`,
        category: 'rhythm',
        features: ['polyrhythm', 'nested patterns', 'euclidean-style'],
    },
    {
        name: 'Syncopated Funk',
        vibe: 'funky off-beat pattern with ghost notes',
        code: `stack(
  s("[bd ~ bd] [~ bd ~]").bank("RolandTR707"),
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
  .lpf("<400 800 1200 1600>")
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
        code: `note("<c3 e3 g3 b3> <g3 b3 d4 f4> <a3 c4 e4 g4> <f3 a3 c4 e4>")
  .s("gm_pad_sweep")
  .slow(4)
  .room(0.8)
  .gain(0.6)`,
        category: 'harmonic',
        features: ['chord progression', 'slow evolution'],
    },
    {
        name: 'Jazz Voicings',
        vibe: 'rich jazz chord voicings',
        code: `note("<[d3,f3,a3,c4] [g3,b3,d4,f4] [c3,e3,g3,b3]>")
  .s("piano")
  .slow(2)
  .room(0.5)
  .gain(0.7)`,
        category: 'harmonic',
        features: ['jazz harmony', 'piano', 'voicings'],
    },
    {
        name: 'Arpeggiated Synth',
        vibe: 'trance-style arpeggio with filter sweep',
        code: `note("c3 e3 g3 c4 e4 g4 e4 c4")
  .s("supersaw")
  .lpf("<200 400 800 1600>")
  .gain(0.5)
  .fast(2)`,
        category: 'melodic',
        features: ['arpeggio', 'filter sweep', 'trance'],
    },
    {
        name: 'Pentatonic Melody',
        vibe: 'flowing pentatonic phrase with delay',
        code: `note("c4 d4 e4 g4 a4 c5 a4 g4")
  .s("sine")
  .room(0.6)
  .delay(0.25)
  .gain(0.5)
  .slow(2)`,
        category: 'melodic',
        features: ['pentatonic', 'delay', 'flowing'],
    },
    {
        name: 'Call and Response',
        vibe: 'two-part melodic conversation',
        code: `stack(
  note("c4 e4 g4 ~").s("triangle").slow(2).room(0.4),
  note("~ ~ ~ g4 e4 c4 ~ ~").s("sine").slow(2).room(0.6).delay(0.3)
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
        code: `note("<[c3,e3,g3] [a2,c3,e3] [f2,a2,c3] [g2,b2,d3]>")
  .s("gm_pad_warm")
  .slow(8)
  .lpf("<300 500 800 600>")
  .room(0.85)
  .gain(0.5)`,
        category: 'ambient',
        features: ['evolving chords', 'filter movement', 'warm pad', 'rotation'],
    },
    {
        name: 'Granular Texture',
        vibe: 'experimental synthesis soundscape',
        code: `stack(
  note("c4").s("fm").slow(16).room(0.9).gain(0.3),
  note("e4").s("sine").slow(12).gain(0.3).room(0.8)
).cpm(50)`,
        category: 'ambient',
        features: ['FM synthesis', 'experimental'],
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
        vibe: 'downtempo with layers',
        code: `stack(
  s("bd ~ [bd ~] ~").bank("RolandTR808").gain(0.9),
  note("<[e3,g3,b3] [d3,f3,a3] [c3,e3,g3]>").s("gm_pad_sweep").slow(4).room(0.8).gain(0.4),
  note("c4 d4 e4 g4").s("sine").slow(2).delay(0.4).gain(0.3)
).cpm(95)`,
        category: 'complex',
        features: ['downtempo', 'layered'],
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
        code: `note("[c3,e3,g3] [f3,a3,c4] [g3,b3,d4] [e3,g3,b3]")
  .s("piano")
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
  s("~ [~ sd ~ sd]").bank("RolandTR909").gain(0.8),
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
  s("bd ~ [bd ~] ~").bank("RolandTR808").gain(0.8).crush(8),
  s("~ sd ~ ~").bank("RolandTR808").gain(0.6).crush(8),
  s("hh*8").gain(0.3).crush(8).lpf(4000),
  note("<[f3,a3,c4] [d3,f3,a3] [bb2,d3,f3] [c3,e3,g3]>").s("piano").slow(4).room(0.5).crush(10).gain(0.4)
).cpm(85)`,
        category: 'complex',
        features: ['lo-fi', 'bitcrush', 'chill', 'hip hop'],
    },
];
