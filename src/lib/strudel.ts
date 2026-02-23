'use client';

/**
 * Strudel playback via the REPL evaluation approach.
 * @strudel/web's `evaluate` function handles all initialization internally.
 * Patterns use the canonical Strudel sample naming convention (e.g. RolandTR808, RolandTR909).
 */

let strudelModule: any = null;
let repl: any = null;
let isInitialized = false;

/**
 * A curated library of verified, working Strudel patterns
 * drawn from the official Strudel sample map and tested examples.
 * Uses canonical bank names: RolandTR808, RolandTR909, etc.
 */
export const STRUDEL_PATTERN_LIBRARY = [
    {
        name: 'Techno Pulse',
        vibe: 'a driving 909-style industrial kick with a fast dark synth loop',
        code: `stack(
  s("bd*2, [~ bd] ~").bank("RolandTR909"),
  s("~ sd ~ sd").bank("RolandTR909"),
  s("hh*8").bank("RolandTR909").gain(0.4)
)`,
        category: 'rhythm',
    },
    {
        name: 'Acid Resonance',
        vibe: 'a squelchy 303 bassline with high resonance and fast distortion',
        code: `s("bd*4").bank("RolandTR808")
  .stack(note("c2 [~ c3] bb1 [c2 eb2]").s("sawtooth").lpf(800).lpq(20).distort(2).gain(0.7))`,
        category: 'bass',
    },
    {
        name: 'Ambient Drift',
        vibe: 'layered evolving pads with a slow granular texture and high reverb',
        code: `note("c4 eb4 g4 bb4").s("pad").slow(4).room(0.8).gain(0.6)
  .stack(note("c3").s("pad").slow(8).room(0.9).gain(0.3))`,
        category: 'ambient',
    },
    {
        name: 'Jungle Break',
        vibe: 'choppy breakbeat with an amen-style pattern and heavy bass',
        code: `s("amen").chop(8).speed("<1 0.8 1.2 0.9>").room(0.2)
  .stack(note("c2 ~ f2 ~").s("bass").gain(0.8))`,
        category: 'rhythm',
    },
    {
        name: 'Lo-Fi Drums',
        vibe: 'a laid back lo-fi hip hop beat at half speed with vinyl warmth',
        code: `s("bd [~ bd] sd ~, hh*4").bank("RolandTR808").slow(1.5).crush(7).room(0.3)`,
        category: 'rhythm',
    },
    {
        name: 'Deep Space',
        vibe: 'a slow evolving cosmic drone with reverberant bell tones',
        code: `note("<c4 eb4 g4 f4>").s("gong").slow(6).room(0.95).gain(0.5)
  .stack(note("c2").s("sine").slow(8).gain(0.3).room(0.9))`,
        category: 'ambient',
    },
];

async function getRepl() {
    if (typeof window === 'undefined') return null;
    if (repl) return repl;

    try {
        strudelModule = await import('@strudel/web');
        repl = strudelModule.createRepl?.({
            autodraw: false,
            beforeEval: () => { },
            afterEval: () => { },
        });
        isInitialized = true;
    } catch (e) {
        console.error('Failed to init Strudel REPL:', e);
        return null;
    }

    return repl;
}

let isPlaying = false;

export async function playStrudelCode(code: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
        // Ensure WebAudio context is started (must be from user gesture)
        if (strudelModule?.initAudio) {
            await strudelModule.initAudio();
        }

        const r = await getRepl();

        if (r?.evaluate) {
            await r.evaluate(code);
            isPlaying = true;
            return true;
        }

        // Fallback: direct module-level evaluate
        if (!strudelModule) {
            strudelModule = await import('@strudel/web');
        }

        if (strudelModule?.evaluate) {
            await strudelModule.evaluate(code);
            isPlaying = true;
            return true;
        }

        console.warn('No Strudel evaluation method available');
        return false;
    } catch (error) {
        console.error('Strudel playback error:', error);
        isPlaying = false;
        return false;
    }
}

export async function stopStrudel() {
    try {
        const r = await getRepl();
        if (r?.stop) {
            r.stop();
        } else if (strudelModule?.stop) {
            strudelModule.stop();
        }
    } catch (e) {
        // ignore
    }
    isPlaying = false;
}

export function isStrudelPlaying() {
    return isPlaying;
}
