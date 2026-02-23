'use client';

// Dynamic imports because Strudel uses browser APIs
let strudel: any = null;

export async function getStrudel() {
    if (typeof window === 'undefined') return null;
    if (strudel) return strudel;

    // @ts-ignore
    strudel = await import('@strudel/web');
    return strudel;
}

let activeStream: any = null;

export async function playStrudelCode(code: string) {
    const S = await getStrudel();
    if (!S) return;

    if (activeStream) {
        activeStream.stop();
    }

    try {
        // We use the transpiler to handle the syntax sugar (like 's' being implicit in some cases)
        // but here we expect the agent to return valid JS using strudel functions

        // Create an evaluation context with all strudel functions
        const context = { ...S };
        const keys = Object.keys(context);
        const values = Object.values(context);

        // Evaluate the code within the context
        const fn = new Function(...keys, `return ${code}`);
        const pattern = fn(...values);

        if (pattern && typeof pattern.play === 'function') {
            activeStream = pattern.play();
        }
    } catch (error) {
        console.error('Strudel playback error:', error);
    }
}

export function stopStrudel() {
    if (activeStream) {
        activeStream.stop();
        activeStream = null;
    }
}

export function isStrudelPlaying() {
    return !!activeStream;
}
