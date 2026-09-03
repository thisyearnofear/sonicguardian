'use client';

/** Lazy-load Strudel engine so Turbopack can serve the main app without bundling @strudel/web. */

export async function playStrudelCode(code: string) {
  const { playStrudelCode: play } = await import('./strudel-engine');
  return play(code);
}

export async function stopStrudel() {
  const { stopStrudel: stop } = await import('./strudel-engine');
  stop();
}

export async function initStrudelAudio() {
  const { initStrudelAudio: init } = await import('./strudel-engine');
  return init();
}

export async function isStrudelPlaying() {
  const { isStrudelPlaying: playing } = await import('./strudel-engine');
  return playing();
}

export async function cleanupStrudel() {
  const { cleanupStrudel: cleanup } = await import('./strudel-engine');
  cleanup();
}

export async function setDrawCallback(
  cb: ((haps: unknown[], time: number) => void) | null,
) {
  const { setDrawCallback: setCb } = await import('./strudel-engine');
  setCb(cb);
}

export async function getStrudelEngine() {
  const { engine } = await import('./strudel-engine');
  return engine;
}

/** Read playback data without adding the Strudel engine to an initial client chunk. */
export async function getStrudelPlaybackState() {
  const { engine } = await import('./strudel-engine');
  return {
    cycleProgress: engine.getCycleProgress(),
    haps: engine.getActiveHaps(),
    isPlaying: engine.isPlaying(),
  };
}
