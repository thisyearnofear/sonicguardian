'use client';

import { repl, evalScope } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds, samples } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';

/**
 * Strudel Engine Singleton
 * Core source of truth for all musical pattern execution and audio state.
 * Follows DRY and CONSOLIDATION principles.
 */

export type EngineStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface ParsedPattern {
  code: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class StrudelEngine {
  private static instance: StrudelEngine;
  private status: EngineStatus = 'idle';
  private replInstance: any = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private initPromise: Promise<void> | null = null;
  private drawCb: ((haps: any[], time: number) => void) | null = null;
  private animationFrameId: number | null = null;
  private lastHaps: any[] = [];
  private currentCpm: number = 120;

  // Valid sample names (based on actual sample files)
  private validSamples = ['bd', 'sd', 'hh', 'hc', 'ho', 'cp', '808', '909'];

  // Filter code to only use valid sample names
  private sanitizeCode(code: string): string {
    // Extract CPM if present to track cycle progress accurately
    const cpmMatch = code.match(/\.cpm\((\d+)\)/);
    if (cpmMatch) {
      this.currentCpm = parseInt(cpmMatch[1]);
    } else {
      this.currentCpm = 120; // Default Strudel CPM
    }

    // Replace invalid sample references with valid ones
    return code
      .replace(/\.s\(["'](?:piano|fm|gm_pad|x)[^"']*["']\)/g, '.s("bd")')
      .replace(/s\(["'](?:piano|fm|gm_pad|x)[^"']*["']\)/g, (match) => 
        match.replace(/piano|fm|gm_pad|x/g, 'bd'));
  }

  private constructor() {}

  public static getInstance(): StrudelEngine {
    if (!StrudelEngine.instance) {
      StrudelEngine.instance = new StrudelEngine();
    }
    return StrudelEngine.instance;
  }

  /**
   * Initializes the Strudel audio engine and evaluation scope.
   * Uses a promise lock to prevent race conditions during concurrent calls.
   */
  public async init(): Promise<void> {
    if (this.status === 'ready') return;
    if (this.initPromise) return this.initPromise;

    this.status = 'initializing';
    this.initPromise = (async () => {
      try {
        console.log('🌀 Initializing Strudel Engine...');
        
        // 1. Audio Interaction Premise
        initAudioOnFirstClick();
        
        // 2. Load Core Modules & Sounds
        await Promise.all([
          registerSynthSounds(),
          // Prioritize local samples, fallback to CDN
          samples('/samples/strudel.json', 'github:tidalcycles/Dirt-Samples'),
          evalScope(
            import('@strudel/core'),
            import('@strudel/mini'),
            import('@strudel/tonal'),
            import('@strudel/webaudio')
          )
        ]);

        // 3. Instantiate REPL & Setup Analyser
        const ctx = getAudioContext();
        
        // Setup Analyser for real-time visualization
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        // Connect to destination to ensure we can monitor output
        // Note: webaudioOutput usually connects directly, but we can wrap it
        this.analyser.connect(ctx.destination);

        this.replInstance = repl({
          defaultOutput: (params: any) => {
            const out = webaudioOutput(params);
            // Connect the Strudel output to our analyser
            if (out && typeof out.connect === 'function' && this.analyser) {
              out.connect(this.analyser);
            }
            return out;
          },
          getTime: () => ctx.currentTime,
          transpiler,
        });

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        this.status = 'ready';
        this.startSyncLoop();
        console.log('✅ Strudel Engine Ready');
      } catch (error) {
        this.status = 'error';
        console.error('❌ Strudel Engine Initialization Failed:', error);
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private startSyncLoop() {
    if (this.animationFrameId) return;

    const loop = () => {
      if (this.replInstance?.scheduler) {
        const time = getAudioContext().currentTime;
        // Accurate scheduling window for visualizer
        const haps = this.replInstance.scheduler.getHaps ? 
          this.replInstance.scheduler.getHaps(time - 0.05, time + 0.15) : [];
        
        if (this.drawCb) {
          this.drawCb(haps, time);
        }
        this.lastHaps = haps;
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public async play(code: string): Promise<boolean> {
    try {
      if (this.status !== 'ready') {
        await this.init();
      }

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const sanitizedCode = this.sanitizeCode(code);
      await this.replInstance.evaluate(sanitizedCode);
      return true;
    } catch (error) {
      console.error('Strudel Playback Error:', error);
      return false;
    }
  }

  public stop(): void {
    if (this.replInstance) {
      this.replInstance.stop();
    }
  }

  public isPlaying(): boolean {
    return this.replInstance?.state?.started ?? false;
  }

  public getStatus(): EngineStatus {
    return this.status;
  }

  public getAnalyserData(): Uint8Array | null {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return null;
  }

  /**
   * Returns current cycle progress (0.0 to 1.0)
   */
  public getCycleProgress(): number {
    if (!this.isPlaying()) return 0;
    const time = getAudioContext().currentTime;
    const bps = this.currentCpm / 60;
    const beats = time * bps;
    return beats % 1.0;
  }

  public setDrawCallback(callback: ((haps: any[], time: number) => void) | null): void {
    this.drawCb = callback;
  }

  public getActiveHaps(time: number = getAudioContext().currentTime): any[] {
    return this.lastHaps.filter(h => h.isActive?.(time));
  }

  public getActiveHapsCount(time: number = getAudioContext().currentTime): number {
    return this.getActiveHaps(time).length;
  }

  public cleanup(): void {
    this.stop();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.drawCb = null;
  }
}

// Export functional wrappers for backward compatibility and ease of use
export const engine = StrudelEngine.getInstance();
export const initStrudelAudio = () => engine.init();
export const playStrudelCode = (code: string) => engine.play(code);
export const stopStrudel = () => engine.stop();
export const isStrudelPlaying = () => engine.isPlaying();
export const cleanupStrudel = () => engine.cleanup();
export const setDrawCallback = (cb: any) => engine.setDrawCallback(cb);

/**
 * Centralized Parser & Validator
 */
export function parseStrudelCode(code: string): ParsedPattern {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!code?.trim()) {
    return { code, isValid: false, errors: ['Pattern cannot be empty'], warnings };
  }

  // Security Audit
  const dangerousPatterns = [/eval\s*\(/i, /Function\s*\(/i, /localStorage/i, /document\.cookie/i];
  dangerousPatterns.forEach(p => {
    if (p.test(code)) errors.push('Dangerous code pattern detected');
  });

  // Basic Syntax Validation (Enhanced)
  // Check for common Strudel entry points or stack structures
  const validStart = /^(stack|s\(|note\(|n\(|slow\(|fast\(|cat\(|seq\(|\/\/|\/\*)/.test(code.trim());
  if (!validStart) {
    warnings.push('Pattern might be missing a valid Strudel entry point (e.g., s() or stack())');
  }

  return { code, isValid: errors.length === 0, errors, warnings };
}


export const STRUDEL_PATTERN_LIBRARY = [
    // === RHYTHM & PERCUSSION ===
    {
        name: 'Four on the Floor',
        vibe: 'classic house kick pattern with hi-hats',
        code: `stack(
  s("bd*4").gain(1.2),
  s("~ hh ~ hh").gain(0.6),
  s("sd*2 ~ sd").gain(0.9)
).cpm(124)`,
        category: 'rhythm',
        features: ['basic rhythms', 'drum banks', 'stacking'],
    },
    {
        name: 'Euclidean Groove',
        vibe: 'complex polyrhythmic pattern using Euclidean distribution',
        code: `stack(
  s("bd(3,8)"),
  s("hh*8").gain(0.5),
  s("cp(2,4)").slow(2)
).cpm(110)`,
        category: 'rhythm',
        features: ['polyrhythm', 'nested patterns', 'euclidean-style'],
    },
    {
        name: 'Syncopated Funk',
        vibe: 'funky off-beat pattern with ghost notes',
        code: `stack(
  s("[bd ~ bd] [~ bd ~]"),
  s("hh[~ x][x ~][x x]").gain(0.4),
  s("[~ sd ~ sd]").distort(0.5)
).cpm(100)`,
        category: 'rhythm',
        features: ['syncopation', 'ghost notes', 'layered percussion'],
    },
    {
        name: 'Rotating Percussion',
        vibe: 'cyclic pattern that rotates through variations',
        code: `stack(
  s("<bd*4 bd[~ bd] bd*2 [bd ~ bd bd]>"),
  s("ho*2 ~").gain(0.7).room(0.3)
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
  s("bd*4").gain(1.2),
  s("~ sd ~ sd").distort(0.3),
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
  s("bd ~ [bd ~] ~").gain(0.9),
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
  s("bd*3").slow(3),
  s("sd*4").slow(4),
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
  s("bd [~ bd] [bd ~] bd").gain(1.0),
  s("~ [~ sd ~ sd]").gain(0.8),
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
  s("bd ~ [bd ~] ~").gain(0.8).crush(8),
  s("~ sd ~ ~").gain(0.6).crush(8),
  s("hh*8").gain(0.3).crush(8).lpf(4000),
  note("<[f3,a3,c4] [d3,f3,a3] [bb2,d3,f3] [c3,e3,g3]>").s("piano").slow(4).room(0.5).crush(10).gain(0.4)
).cpm(85)`,
        category: 'complex',
        features: ['lo-fi', 'bitcrush', 'chill', 'hip hop'],
    },
];
