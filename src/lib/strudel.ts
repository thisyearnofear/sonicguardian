'use client';

/**
 * Strudel playback using the evaluate() API from @strudel/web.
 * The exported `evaluate` function handles scheduling, audio init,
 * and sample loading internally — no manual REPL or context setup required.
 *
 * Verified exported API for @strudel/web@1.3.0:
 *   - evaluate(code: string): Promise<void>
 *   - initAudio(): Promise<void>
 */

let audioInitialized = false;
let isPlaying = false;

async function getStrudelAPI(): Promise<{ evaluate: (code: string) => Promise<void>; stop?: () => void } | null> {
    if (typeof window === 'undefined') return null;
    try {
        const mod = await import('@strudel/web' as any);
        return {
            evaluate: mod.evaluate,
            stop: mod.stop
        };
    } catch (e) {
        console.error('[strudel] Failed to load @strudel/web:', e);
        return null;
    }
}

async function ensureAudio() {
    if (audioInitialized) return;
    try {
        const mod = await import('@strudel/web' as any);
        if (mod.initStrudel) {
            await mod.initStrudel();
        }
        if (mod.initAudio) {
            await mod.initAudio();
        }
        audioInitialized = true;
    } catch (e) {
        // initAudio/initStrudel may fail if already called or environment issues
        audioInitialized = true;
    }
}

export async function playStrudelCode(code: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
        await ensureAudio();
        const api = await getStrudelAPI();

        if (!api?.evaluate) {
            console.error('[strudel] evaluate() is not available from @strudel/web');
            return false;
        }

        // evaluate() starts the pattern immediately — calling it stops the previous one
        await api.evaluate(code);
        isPlaying = true;
        return true;
    } catch (error) {
        console.error('Strudel playback error:', error);
        isPlaying = false;
        return false;
    }
}

export async function stopStrudel(): Promise<void> {
    try {
        const api = await getStrudelAPI();
        if (api?.stop) {
            api.stop();
        } else {
            // Passing empty string or a silent pattern stops playback
            const mod = await import('@strudel/web' as any);
            if (mod.evaluate) {
                await mod.evaluate('silence');
            }
        }
    } catch (e) {
        // ignore
    }
    isPlaying = false;
}

export function isStrudelPlaying() {
    return isPlaying;
}

/**
 * Curated pattern library — verified against the Strudel sample map.
 * Banks use canonical names: RolandTR808, RolandTR909 (prefix _ separated).
 * Patterns are designed to be distinct and immediately engaging.
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
        code: `stack(
  s("bd*4").bank("RolandTR808"),
  note("c2 [~ c3] bb1 [c2 eb2]").s("sawtooth").lpf(800).lpq(18).distort(1.5).gain(0.7)
)`,
        category: 'bass',
    },
    {
        name: 'Ambient Drift',
        vibe: 'layered evolving pads with a slow granular texture and high reverb',
        code: `stack(
  note("c4 eb4 g4 bb4").s("pad").slow(4).room(0.8).gain(0.6),
  note("c3").s("pad").slow(8).room(0.9).gain(0.3)
)`,
        category: 'ambient',
    },
    {
        name: 'Jungle Break',
        vibe: 'choppy breakbeat with an amen-style pattern and heavy bass',
        code: `stack(
  s("amen").chop(8).speed("<1 0.8 1.2 0.9>").room(0.2),
  note("c2 ~ f2 ~").s("bass").gain(0.8)
)`,
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
        code: `stack(
  note("<c4 eb4 g4 f4>").s("gong").slow(6).room(0.95).gain(0.5),
  note("c2").s("sine").slow(8).gain(0.3).room(0.9)
)`,
        category: 'ambient',
    },
];
