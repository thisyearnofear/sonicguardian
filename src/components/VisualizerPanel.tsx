'use client';

import { useEffect, useRef, useState } from 'react';
import type { SonicVisualizer } from '@/lib/visualizer';
import { getStrudelPlaybackState } from '@/lib/strudel-lazy';

interface VisualizerPanelProps {
  theme: 'light' | 'dark';
  dnaSequence?: string;
}

/** Lazy-loads Three.js visualizer only when mounted. Bars follow live playback. */
export function VisualizerPanel({ theme, dnaSequence }: VisualizerPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SonicVisualizer | null>(null);
  const [live, setLive] = useState({ playing: false, energy: 0, progress: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    void import('@/lib/visualizer').then(({ SonicVisualizer: VisualizerClass }) => {
      if (cancelled || !containerRef.current) return;
      visualizerRef.current?.dispose();
      visualizerRef.current = new VisualizerClass({
        container: containerRef.current,
        theme,
      });
      if (dnaSequence) {
        visualizerRef.current.updateDNASequence(dnaSequence);
        visualizerRef.current.highlightParticles(Array.from({ length: 8 }, (_, i) => i));
      }
    });

    return () => {
      cancelled = true;
      visualizerRef.current?.dispose();
      visualizerRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (!dnaSequence || !visualizerRef.current) return;
    visualizerRef.current.updateDNASequence(dnaSequence);
    visualizerRef.current.highlightParticles(Array.from({ length: 8 }, (_, i) => i));
  }, [dnaSequence]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const state = await getStrudelPlaybackState();
        if (cancelled) return;
        setLive({
          playing: state.isPlaying,
          energy: Math.min(1, state.haps.length / 6),
          progress: state.cycleProgress,
        });
      } catch {
        if (!cancelled) setLive({ playing: false, energy: 0, progress: 0 });
      }
    };
    const id = window.setInterval(() => void tick(), 90);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const bars = (dnaSequence || 'sonic-guardian').split('').slice(0, 24);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className={`relative w-full h-[180px] sm:h-[220px] overflow-hidden rounded-2xl border bg-[color:var(--color-foreground)]/[0.03] transition-colors ${
          live.playing
            ? 'border-[color:var(--color-primary)]/50'
            : 'border-[color:var(--color-border)]'
        }`}
      >
        <div
          className="absolute inset-0 flex items-end justify-center gap-1 px-4 pb-6 z-10 pointer-events-none"
          aria-hidden
        >
          {bars.map((ch, i) => {
            const base = 28 + (ch.charCodeAt(0) % 56);
            const wave = live.playing
              ? 0.55 + live.energy * 0.7 + Math.abs(Math.sin(live.progress * Math.PI * 2 + i * 0.45)) * 0.45
              : 1;
            const h = Math.min(96, base * wave);
            return (
              <span
                key={`${ch}-${i}`}
                className="w-2 sm:w-2.5 rounded-full bg-[color:var(--color-primary)] origin-bottom"
                style={{
                  height: `${h}%`,
                  opacity: live.playing ? 0.55 + live.energy * 0.4 : 0.45 + (i % 5) * 0.1,
                  animation: live.playing ? 'none' : `pulse-soft 2.8s ease-in-out ${i * 80}ms infinite`,
                  transition: 'height 90ms linear, opacity 160ms ease',
                }}
              />
            );
          })}
        </div>
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[color:var(--color-primary)] rounded-full blur-[100px] ${
            live.playing ? 'opacity-40' : 'opacity-20'
          }`}
        />
      </div>
    </div>
  );
}
