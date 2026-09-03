'use client';

import { useEffect, useState } from 'react';
import { Tooltip } from './Tooltip';
import {
  getStrudelPlaybackState,
  playStrudelCode,
  stopStrudel,
} from '@/lib/strudel-lazy';
import { StrudelVisualizer } from './StrudelVisualizer';

interface StrudelEditorProps {
  initialCode: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
}

/**
 * Thin pattern editor: textarea + @strudel/web play/stop.
 * Avoids @strudel/codemirror (Preact/webpack breakage in Next.js).
 */
export function StrudelEditor({
  initialCode,
  onCodeChange,
  readOnly = false,
}: StrudelEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycleProgress, setCycleProgress] = useState(0);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!isPlaying) {
      setCycleProgress(0);
      return;
    }
    const id = window.setInterval(() => {
      void getStrudelPlaybackState().then((state) => {
        setCycleProgress(state.cycleProgress);
        if (!state.isPlaying) {
          setIsPlaying(false);
        }
      });
    }, 50);
    return () => clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      void stopStrudel();
    };
  }, []);

  const handleChange = (next: string) => {
    setCode(next);
    setError(null);
    onCodeChange?.(next);
  };

  const handlePlay = async () => {
    if (!code.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const ok = await playStrudelCode(code);
      if (!ok) {
        setError('Could not play pattern. Check syntax and try again.');
        setIsPlaying(false);
        return;
      }
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback failed');
      setIsPlaying(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = () => {
    void stopStrudel();
    setIsPlaying(false);
    setCycleProgress(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)] cursor-help">
              Sonic Pattern
            </span>
            <Tooltip
              text="Write simple music patterns: s('bd*4').cpm(120) for a kick loop. Browse 16 examples in the pattern explorer."
              position="bottom"
            >
              <span className="text-[9px] px-2 py-0.5 rounded border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)] transition-colors cursor-help">
                ?
              </span>
            </Tooltip>
          {isPlaying && (
            <span className="flex items-center gap-1.5 text-[8px] text-[color:var(--color-success)]">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full animate-pulse" />
              LIVE • CYCLE {Math.floor(cycleProgress * 100)}%
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              disabled={isBusy || !code.trim()}
              className="px-4 py-1.5 rounded-lg bg-[color:var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-white rounded-full" />
              {isBusy ? 'Loading…' : 'Play Pattern'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className="relative px-4 py-1.5 rounded-lg bg-[color:var(--color-error)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-white/20 pointer-events-none transition-all duration-75"
                style={{ width: `${cycleProgress * 100}%` }}
              />
              <span className="relative z-10 w-2 h-2 bg-white rounded-sm" />
              <span className="relative z-10">Stop</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-[color:var(--color-primary)] to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 ${isPlaying ? 'animate-pulse opacity-30' : ''}`}
        />
        <textarea
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          rows={10}
          className="relative z-10 w-full rounded-xl border border-[color:var(--color-border)] bg-black/90 p-4 font-mono text-xs leading-relaxed text-blue-300 outline-none focus:border-[color:var(--color-primary)]/50 resize-y min-h-[200px]"
          aria-label="Strudel pattern code"
        />
      </div>

      {error && (
        <p className="text-[10px] text-[color:var(--color-error)]">{error}</p>
      )}

      <StrudelVisualizer isActive={isPlaying} height={72} className="w-full" />

      <p className="text-[9px] text-[color:var(--color-muted)] italic">
        Edit the pattern, then play. Your DNA hash updates from the code text — audio is optional.
      </p>
    </div>
  );
}
