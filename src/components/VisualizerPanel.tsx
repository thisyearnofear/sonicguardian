'use client';

import { useEffect, useRef } from 'react';
import type { SonicVisualizer } from '@/lib/visualizer';

interface VisualizerPanelProps {
  theme: 'light' | 'dark';
  dnaSequence?: string;
}

/** Lazy-loads Three.js visualizer only when mounted. */
export function VisualizerPanel({ theme, dnaSequence }: VisualizerPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<SonicVisualizer | null>(null);

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

  const bars = (dnaSequence || 'sonic-guardian').split('').slice(0, 24);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative w-full h-[180px] sm:h-[220px] overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.03]"
      >
        <div
          className="absolute inset-0 flex items-end justify-center gap-1 px-4 pb-6"
          aria-hidden
        >
          {bars.map((ch, i) => {
            const h = 28 + (ch.charCodeAt(0) % 56);
            return (
              <span
                key={`${ch}-${i}`}
                className="w-2 sm:w-2.5 rounded-full bg-[color:var(--color-primary)] origin-bottom"
                style={{
                  height: `${h}%`,
                  opacity: 0.45 + (i % 5) * 0.1,
                  animation: `pulse-soft 2.8s ease-in-out ${i * 80}ms infinite`,
                }}
              />
            );
          })}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[color:var(--color-primary)] rounded-full blur-[100px] opacity-20" />
      </div>
    </div>
  );
}
