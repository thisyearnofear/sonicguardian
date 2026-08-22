'use client';

/**
 * Thin Strudel playback via @strudel/web (no CodeMirror / Preact).
 * DNA hashing stays independent — this module is only for hear + edit UX.
 */

export type EngineStatus = 'idle' | 'initializing' | 'ready' | 'error';

type StrudelWeb = typeof import('@strudel/web');

class StrudelEngine {
  private static instance: StrudelEngine;
  private status: EngineStatus = 'idle';
  private replInstance: any = null;
  private strudel: StrudelWeb | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private initPromise: Promise<void> | null = null;
  private drawCb: ((haps: any[], time: number) => void) | null = null;
  private animationFrameId: number | null = null;
  private lastHaps: any[] = [];
  private currentCpm: number = 120;
  private playing = false;
  private playStartedAt = 0;

  private sanitizeCode(code: string): string {
    const cpmMatch = code.match(/\.cpm\((\d+)\)/);
    this.currentCpm = cpmMatch ? parseInt(cpmMatch[1], 10) : 120;

    // Map exotic sample banks to local Dirt-style names when missing
    return code
      .replace(/\.s\(["'](?:piano|fm|gm_pad|x)[^"']*["']\)/g, '.s("sine")')
      .replace(/s\(["'](?:piano|fm|gm_pad|x)[^"']*["']\)/g, (match) =>
        match.replace(/piano|fm|gm_pad|x/g, 'sine'));
  }

  private constructor() {}

  public static getInstance(): StrudelEngine {
    if (!StrudelEngine.instance) {
      StrudelEngine.instance = new StrudelEngine();
    }
    return StrudelEngine.instance;
  }

  public async init(): Promise<void> {
    if (this.status === 'ready') return;
    if (this.initPromise) return this.initPromise;

    this.status = 'initializing';
    this.initPromise = (async () => {
      try {
        const strudel = await import('@strudel/web');
        this.strudel = strudel;

        this.replInstance = await strudel.initStrudel({
          prebake: async () => {
            // Local map first; Dirt-Samples CDN as fallback base
            await strudel.samples('/samples/strudel.json', 'github:tidalcycles/Dirt-Samples');
          },
        });

        const ctx = strudel.getAudioContext();
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        // Tap master output for spectrum (best-effort; may be silent if graph bypasses)
        try {
          this.analyser.connect(ctx.destination);
        } catch {
          /* ignore */
        }

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        this.status = 'ready';
        this.startSyncLoop();
      } catch (error) {
        this.status = 'error';
        console.error('[Strudel] init failed:', error);
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
      if (this.playing && this.replInstance?.scheduler) {
        const now =
          this.strudel?.getAudioContext?.()?.currentTime ??
          this.replInstance.scheduler.now?.() ??
          0;
        const haps = this.replInstance.scheduler.getHaps
          ? this.replInstance.scheduler.getHaps(now - 0.05, now + 0.15)
          : [];
        this.lastHaps = haps;
        this.drawCb?.(haps, now);
      } else {
        this.lastHaps = [];
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
      if (!this.strudel) return false;

      const ctx = this.strudel.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      await this.strudel.evaluate(this.sanitizeCode(code), true);
      this.playing = true;
      this.playStartedAt = ctx.currentTime;
      return true;
    } catch (error) {
      console.error('[Strudel] play error:', error);
      this.playing = false;
      return false;
    }
  }

  public stop(): void {
    try {
      this.strudel?.hush();
    } catch {
      this.replInstance?.stop?.();
    }
    this.playing = false;
    this.lastHaps = [];
  }

  public isPlaying(): boolean {
    if (this.replInstance?.scheduler?.started != null) {
      return !!this.replInstance.scheduler.started;
    }
    return this.playing;
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

  public getCycleProgress(): number {
    if (!this.isPlaying() || !this.strudel) return 0;
    const time = this.strudel.getAudioContext().currentTime - this.playStartedAt;
    const bps = this.currentCpm / 60;
    return (time * bps) % 1.0;
  }

  public setDrawCallback(callback: ((haps: any[], time: number) => void) | null): void {
    this.drawCb = callback;
  }

  public getActiveHaps(time?: number): any[] {
    const t =
      time ??
      this.strudel?.getAudioContext?.()?.currentTime ??
      0;
    return this.lastHaps.filter((h) => (h.isActive ? h.isActive(t) : true));
  }

  public getActiveHapsCount(time?: number): number {
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

export const engine = StrudelEngine.getInstance();
export const initStrudelAudio = () => engine.init();
export const playStrudelCode = (code: string) => engine.play(code);
export const stopStrudel = () => engine.stop();
export const isStrudelPlaying = () => engine.isPlaying();
export const cleanupStrudel = () => engine.cleanup();
export const setDrawCallback = (cb: any) => engine.setDrawCallback(cb);
