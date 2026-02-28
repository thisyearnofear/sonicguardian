'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StrudelVisualizerProps {
  isActive: boolean;
  height?: number;
  className?: string;
  getActiveHaps?: () => any[];
}

/**
 * Reusable canvas-based visualizer for Strudel patterns
 * Shows active haps (events) as horizontal bars with color coding
 */
export function StrudelVisualizer({ 
  isActive, 
  height = 120,
  className = '',
  getActiveHaps 
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

    // Fade out effect - clear with semi-transparent background
    const clearCanvas = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, rect.width, height);
    };

    // Draw a single hap (event) as a horizontal bar
    const drawHap = (hap: any, time: number) => {
      const value = hap.value;
      const note = value?.note || value?.n || 60;
      
      // Convert note to frequency if it's a string
      let freq = typeof note === 'number' ? note : 60;
      if (typeof note === 'string') {
        freq = noteToFrequency(note);
      }

      // Map frequency to vertical position (lower notes at bottom)
      const minFreq = 65;  // C2
      const maxFreq = 1046; // C6
      const normalizedFreq = Math.log(freq / minFreq) / Math.log(maxFreq / minFreq);
      const y = height - (normalizedFreq * height);
      
      const barHeight = 6;
      const barWidth = rect.width;

      // Color based on frequency (hue spectrum)
      const hue = (Math.log(freq) * 50) % 360;
      const saturation = isActive ? 70 : 30;
      const lightness = isActive ? 60 : 40;
      
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${isActive ? 0.9 : 0.4})`;
      ctx.fillRect(0, y - barHeight / 2, barWidth, barHeight);

      // Add glow effect for active haps
      if (isActive) {
        ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.fillRect(0, y - barHeight / 2, barWidth * 0.3, barHeight);
        ctx.shadowBlur = 0;
      }
    };

    // Animation loop
    const animate = () => {
      clearCanvas();

      if (isActive && getActiveHaps) {
        const haps = getActiveHaps();
        setHapCount(haps.length);
        
        haps.forEach((hap: any) => {
          if (hap.isActive?.(performance.now() / 1000)) {
            drawHap(hap, performance.now() / 1000);
          }
        });
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
  }, [isActive, height, getActiveHaps]);

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
