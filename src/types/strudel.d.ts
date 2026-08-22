// Ambient type declarations for Strudel packages (no @types available)
declare module '@strudel/web' {
  export function initStrudel(options?: {
    prebake?: () => void | Promise<void>;
    miniAllStrings?: boolean;
    [key: string]: unknown;
  }): Promise<unknown>;
  export function evaluate(code: string, autoplay?: boolean): Promise<unknown>;
  export function hush(): void;
  export function getAudioContext(): AudioContext;
  export function samples(...args: unknown[]): Promise<unknown>;
}
declare module '@strudel/webaudio';
declare module '@strudel/core';
declare module '@strudel/mini';
declare module '@strudel/transpiler';
