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

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative w-full h-[220px] sm:h-[280px] animate-float overflow-hidden rounded-2xl border border-[color:var(--color-border)]"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[color:var(--color-primary)] rounded-full blur-[100px] opacity-30" />
      </div>
    </div>
  );
}
