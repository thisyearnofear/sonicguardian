'use client';

/**
 * Strudel playback with proper sample loading
 * Uses @strudel/web for audio synthesis
 */

let audioInitialized = false;
let isPlaying = false;
let strudelRepl: any = null;

async function initStrudel() {
    if (audioInitialized && strudelRepl) return strudelRepl;
    
    try {
        const { repl } = await import('@strudel/web');
        
        // Initialize the REPL with proper settings
        strudelRepl = repl({
            defaultSynth: 'triangle',
            prebake: true, // Preload samples
            editPattern: (pat: any) => pat,
        });
        
        // Wait for audio context to be ready
        await strudelRepl.start();
        
        audioInitialized = true;
        console.log('[strudel] Initialized successfully');
        return strudelRepl;
    } catch (e) {
        console.error('[strudel] Initialization failed:', e);
        throw e;
    }
}

export async function playStrudelCode(code: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
        const repl = await initStrudel();
        
        if (!repl) {
            console.error('[strudel] REPL not available');
            return false;
        }

        // Evaluate the code
        await repl.evaluate(code);
        isPlaying = true;
        console.log('[strudel] Playing:', code.substring(0, 50) + '...');
        return true;
    } catch (error) {
        console.error('[strudel] Playback error:', error);
        isPlaying = false;
        return false;
    }
}

export async function stopStrudel(): Promise<void> {
    try {
        if (strudelRepl) {
            await strudelRepl.stop();
            console.log('[strudel] Stopped');
        }
    } catch (e) {
        console.error('[strudel] Stop error:', e);
    }
    isPlaying = false;
}

export function isStrudelPlaying() {
    return isPlaying;
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
