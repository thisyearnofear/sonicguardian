'use client';

/**
 * Strudel playback with proper initialization
 * Following the pattern from strudel-codeberg/examples/minimal-repl
 */

let audioInitialized = false;
let isPlaying = false;
let evaluateFunction: any = null;
let audioContext: any = null;
let currentPattern: any = null;
let drawCallback: ((haps: any[], time: number) => void) | null = null;

async function initStrudel() {
    if (audioInitialized && evaluateFunction) return evaluateFunction;
    
    try {
        // Import required modules
        const { repl, evalScope } = await import('@strudel/core');
        const { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds } = await import('@strudel/webaudio');
        const { transpiler } = await import('@strudel/transpiler');
        
        // Get audio context and initialize
        audioContext = getAudioContext();
        initAudioOnFirstClick();
        registerSynthSounds();
        
        // Register modules with evalScope BEFORE creating repl
        await evalScope(
            import('@strudel/core'),
            import('@strudel/mini'),
            import('@strudel/webaudio'),
            import('@strudel/tonal')
        );
        
        // Create repl with proper configuration
        const { evaluate } = repl({
            defaultOutput: webaudioOutput,
            getTime: () => audioContext.currentTime,
            transpiler,
        });
        
        evaluateFunction = evaluate;
        audioInitialized = true;
        console.log('[strudel] Initialized successfully');
        return evaluate;
    } catch (e) {
        console.error('[strudel] Initialization failed:', e);
        throw e;
    }
}

export async function playStrudelCode(code: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
        const evaluate = await initStrudel();
        
        if (!evaluate) {
            console.error('[strudel] Evaluate function not available');
            return false;
        }

        // Resume audio context (required for user interaction)
        if (audioContext) {
            await audioContext.resume();
        }

        // Evaluate the code and get the pattern
        const pattern = await evaluate(code);
        currentPattern = pattern;
        
        // If there's a draw callback, set up visual feedback
        if (drawCallback && pattern) {
            setupVisualFeedback(pattern);
        }
        
        isPlaying = true;
        console.log('[strudel] Playing:', code.substring(0, 50) + '...');
        return true;
    } catch (error) {
        console.error('[strudel] Playback error:', error);
        isPlaying = false;
        return false;
    }
}

function setupVisualFeedback(pattern: any) {
    if (!drawCallback) return;
    
    // Use pattern.draw() to get haps (events) for visual feedback
    // This follows the same pattern as Strudel's Drawer class
    const lookbehind = 2; // seconds to look back
    const lookahead = 0.1; // seconds to look ahead
    let lastFrame: number | null = null;
    let visibleHaps: any[] = [];
    
    const animate = () => {
        if (!isPlaying || !audioContext) return;
        
        const phase = audioContext.currentTime;
        
        if (lastFrame === null) {
            lastFrame = phase;
        }
        
        // Query haps from last frame till now (max 100ms back)
        const begin = Math.max(lastFrame ?? phase, phase - 0.1);
        const haps = pattern.queryArc(begin, phase + lookahead);
        
        lastFrame = phase;
        
        // Filter out old haps and add new ones
        visibleHaps = visibleHaps
            .filter((h: any) => h.whole && h.endClipped >= phase - lookbehind)
            .concat(haps.filter((h: any) => h.hasOnset()));
        
        // Call the draw callback with current haps
        if (drawCallback) {
            drawCallback(visibleHaps, phase);
        }
        
        if (isPlaying) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

export async function stopStrudel(): Promise<void> {
    try {
        if (evaluateFunction) {
            // Evaluate empty pattern to stop
            await evaluateFunction('silence');
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

export function setDrawCallback(callback: ((haps: any[], time: number) => void) | null) {
    drawCallback = callback;
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
