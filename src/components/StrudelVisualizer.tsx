'use client';

import React, { useEffect, useRef, useState } from 'react';
import { engine } from '@/lib/strudel';

interface StrudelVisualizerProps {
  isActive: boolean;
  height?: number;
  className?: string;
}

/**
 * Enhanced visualizer for Strudel patterns.
 * Combines real-time audio frequency data with scheduled musical events.
 */
export function StrudelVisualizer({ 
  isActive, 
  height = 120,
  className = ''
}: StrudelVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [hapCount, setHapCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Fade out effect
    const clearCanvas = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, rect.width, height);
    };

    const drawSpectrum = (data: Uint8Array) => {
      const barWidth = (rect.width / data.length) * 2.5;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * height * 0.8;
        
        // Dynamic color based on frequency
        const hue = (i / data.length) * 360;
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.3)`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    const drawCycleProgress = (progress: number) => {
      const y = height - 2;
      const barWidth = rect.width * progress;
      
      // Background track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, y, rect.width, 2);
      
      // Progress bar
      ctx.fillStyle = 'var(--color-primary, #6366f1)';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'var(--color-primary, #6366f1)';
      ctx.fillRect(0, y, barWidth, 2);
      ctx.shadowBlur = 0;
    };

    const drawHap = (hap: any) => {
      const value = hap.value;
      const note = value?.note || value?.n || 60;
      
      let freq = typeof note === 'number' ? note : 60;
      if (typeof note === 'string') {
        freq = noteToFrequency(note);
      }

      const minFreq = 65;
      const maxFreq = 1046;
      const normalizedFreq = Math.log(freq / minFreq) / Math.log(maxFreq / minFreq);
      const y = height - (normalizedFreq * height * 0.7) - 20;
      
      const barHeight = 4;
      const barWidth = rect.width;

      const hue = (Math.log(freq) * 50) % 360;
      const opacity = isActive ? 0.8 : 0.2;
      
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
      ctx.fillRect(0, y - barHeight / 2, barWidth, barHeight);

      if (isActive) {
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.6)`;
        ctx.shadowBlur = 8;
        ctx.fillRect(0, y - barHeight / 2, barWidth * 0.4, barHeight);
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      clearCanvas();

      if (isActive) {
        // 1. Draw Real-time Spectrum
        const spectrumData = engine.getAnalyserData();
        if (spectrumData) {
          drawSpectrum(spectrumData);
        }

        // 2. Draw Cycle Progress
        const progress = engine.getCycleProgress();
        drawCycleProgress(progress);

        // 3. Draw Active Haps
        const haps = engine.getActiveHaps();
        setHapCount(haps.length);
        haps.forEach(drawHap);
      } else {
        setHapCount(0);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, height]);

  // Helper: Convert musical note to frequency
  function noteToFrequency(note: string): number {
    const noteMap: Record<string, number> = {
      'c': 0, 'c#': 1, 'db': 1, 'd': 2, 'd#': 3, 'eb': 3,
      'e': 4, 'f': 5, 'f#': 6, 'gb': 6, 'g': 7, 'g#': 8,
      'ab': 8, 'a': 9, 'a#': 10, 'bb': 10, 'b': 11
    };

    const match = note.toLowerCase().match(/([a-g][#b]?)(\d+)/);
    if (!match) return 440;

    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr);
    const semitone = noteMap[noteName] ?? 0;
    
    // A4 = 440Hz, calculate from there
    const semitonesFromA4 = (octave - 4) * 12 + (semitone - 9);
    return 440 * Math.pow(2, semitonesFromA4 / 12);
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ 
          background: 'rgba(0, 0, 0, 0.3)',
          mixBlendMode: 'screen'
        }}
      />
      
      {/* Active event counter overlay */}
      {isActive && hapCount > 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] font-mono text-white/80">
          {hapCount} active
        </div>
      )}
    </div>
  );
}

/**
 * Simplified visualizer for cards/previews without canvas
 * Uses CSS animations to show rhythmic activity
 */
export function SimpleVibeVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-1 h-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1 bg-[color:var(--color-primary)] rounded-full transition-all duration-300 ${isActive ? 'animate-bounce' : 'h-2 opacity-30'}`}
          style={{
            height: isActive ? `${40 + Math.random() * 60}%` : '8px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.4 + Math.random() * 0.3}s`
          }}
        />
      ))}
    </div>
  );
}
