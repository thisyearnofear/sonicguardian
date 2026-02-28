'use client';

import React, { useState, useEffect } from 'react';
import { playStrudelCode, stopStrudel, setDrawCallback, STRUDEL_PATTERN_LIBRARY } from '../lib/strudel';
import { StrudelVisualizer } from './StrudelVisualizer';
import { generateSecurePattern, mutatePattern } from '../lib/pattern-generator';

interface PatternExplorerProps {
  onPatternSelect?: (code: string) => void;
}

interface FeatureDemo {
  name: string;
  description: string;
  code: string;
  category: 'rhythm' | 'harmony' | 'transformation' | 'effect';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const FEATUREDEMOS: FeatureDemo[] = [
  // === RHYTHM FEATURES ===
  {
    name: 'Basic Rhythms',
    description: 'Simple repeating patterns using * notation',
    code: `s("bd*4").bank("RolandTR909").gain(0.9)`,
    category: 'rhythm',
    difficulty: 'beginner',
  },
  {
    name: 'Syncopation',
    description: 'Off-beat patterns with rests (~)',
    code: `s("bd[~ ~][~ bd]").bank("RolandTR808")`,
    category: 'rhythm',
    difficulty: 'beginner',
  },
  {
    name: 'Nested Patterns',
    description: 'Patterns within patterns for complex rhythms',
    code: `s("bd[~ sd][sd ~]").bank("RolandTR909")`,
    category: 'rhythm',
    difficulty: 'intermediate',
  },
  {
    name: 'Polyrhythms',
    description: 'Multiple rhythms playing at different speeds',
    code: `stack(
  s("bd*3").slow(3),
  s("sd*4").slow(4),
  s("hh*5").slow(5)
).cpm(100)`,
    category: 'rhythm',
    difficulty: 'advanced',
  },
  {
    name: 'Euclidean Rhythms',
    description: 'Mathematically distributed beats',
    code: `s("bd[~ ~][~ ~]").bank("RolandTR808")`,
    category: 'rhythm',
    difficulty: 'intermediate',
  },
  
  // === HARMONY FEATURES ===
  {
    name: 'Scale Patterns',
    description: 'Notes from a musical scale',
    code: `n("c4 d4 e4 f4 g4").scale("C:major").s("sine")`,
    category: 'harmony',
    difficulty: 'beginner',
  },
  {
    name: 'Chord Progressions',
    description: 'I-V-vi-IV pop progression',
    code: `n("I V vi IV").scale("C:major").chord("major7").sound("gm_pad_sweep").slow(4)`,
    category: 'harmony',
    difficulty: 'intermediate',
  },
  {
    name: 'Jazz Harmony',
    description: 'ii-V-I turnaround in D minor',
    code: `n("ii V I").scale("D:minor").chord("minor7").sound("piano").slow(2)`,
    category: 'harmony',
    difficulty: 'advanced',
  },
  {
    name: 'Arpeggios',
    description: 'Broken chords in patterns',
    code: `n("c3 e3 g3 c4").pattern("<c3 g3 e3 c4>").s("supersaw").fast(4)`,
    category: 'harmony',
    difficulty: 'intermediate',
  },
  
  // === TRANSFORMATION FEATURES ===
  {
    name: 'Time Stretching',
    description: 'Slow down patterns with slow()',
    code: `n("c4 e4 g4").s("triangle").slow(4).room(0.8)`,
    category: 'transformation',
    difficulty: 'beginner',
  },
  {
    name: 'Speed Up',
    description: 'Accelerate patterns with fast()',
    code: `s("hh*8").gain(0.4).fast(2)`,
    category: 'transformation',
    difficulty: 'beginner',
  },
  {
    name: 'Pattern Rotation',
    description: 'Rotate through variations with <> ',
    code: `s("<bd*4 bd[~ bd] bd*2>").bank("RolandTR808")`,
    category: 'transformation',
    difficulty: 'intermediate',
  },
  {
    name: 'Probabilistic Events',
    description: 'Random chance with ? operator',
    code: `n("c4?0.5 d4?0.5 e4?0.5 g4?0.5").s("sine").slow(2)`,
    category: 'transformation',
    difficulty: 'advanced',
  },
  {
    name: 'Conditional Patterns',
    description: 'sometimes() applies changes randomly',
    code: `s("bd*4").bank("909").sometimes("<>").gain(0.9)`,
    category: 'transformation',
    difficulty: 'advanced',
  },
  
  // === EFFECT FEATURES ===
  {
    name: 'Filter Automation',
    description: 'Moving low-pass filter with <> ',
    code: `note("c2 [~ c3]").s("sawtooth").lpf(<400 800 1200>).lpq(20)`,
    category: 'effect',
    difficulty: 'intermediate',
  },
  {
    name: 'Distortion',
    description: 'Add grit with distort()',
    code: `s("bd*4").bank("909").distort(2.5).gain(0.9)`,
    category: 'effect',
    difficulty: 'beginner',
  },
  {
    name: 'Reverb',
    description: 'Space and depth with room()',
    code: `n("c4 e4 g4").s("pad").slow(4).room(0.85).gain(0.5)`,
    category: 'effect',
    difficulty: 'beginner',
  },
  {
    name: 'Bitcrush',
    description: 'Lo-fi texture with crush()',
    code: `stack(
  s("bd ~").crush(8),
  n("I vi").sound("piano").crush(10)
).cpm(85)`,
    category: 'effect',
    difficulty: 'intermediate',
  },
];

const CATEGORYFILTERS = [
  { id: 'all', label: 'All', icon: '🎵' },
  { id: 'rhythm', label: 'Rhythm', icon: '🥁' },
  { id: 'harmony', label: 'Harmony', icon: '🎹' },
  { id: 'transformation', label: 'Transform', icon: '⚡' },
  { id: 'effect', label: 'Effects', icon: '🎛️' },
];

const DIFFICULTYCOLORS = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function PatternExplorer({ onPatternSelect }: PatternExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeDemo, setActiveDemo] = useState<FeatureDemo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeHaps, setActiveHaps] = useState<any[]>([]);
  const [showCode, setShowCode] = useState<string | null>(null);

  // Setup visualizer callback
  useEffect(() => {
    setDrawCallback((haps: any[]) => {
      setActiveHaps(haps.filter((h: any) => h.isActive?.(performance.now() / 1000)));
    });
    return () => setDrawCallback(null);
  }, []);

  const handlePlayDemo = async (demo: FeatureDemo) => {
    if (isPlaying && activeDemo === demo) {
      stopStrudel();
      setIsPlaying(false);
      setActiveDemo(null);
    } else {
      stopStrudel();
      setActiveDemo(demo);
      const success = await playStrudelCode(demo.code);
      setIsPlaying(success);
      if (onPatternSelect) onPatternSelect(demo.code);
    }
  };

  const handleRemix = async () => {
    if (!activeDemo) return;
    const remixed = mutatePattern(activeDemo.code, 'moderate');
    stopStrudel();
    setActiveDemo({ ...activeDemo, code: remixed, name: `${activeDemo.name} (Remix)` });
    const success = await playStrudelCode(remixed);
    setIsPlaying(success);
  };

  const filteredDemos = selectedCategory === 'all'
    ? FEATUREDEMOS
    : FEATUREDEMOS.filter(d => d.category === selectedCategory);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-gradient">
          🎼 Strudel Pattern Explorer
        </h2>
        <p className="text-sm text-[color:var(--color-muted)] max-w-2xl mx-auto">
          Interactive showcase of Strudel's live coding capabilities. 
          Click any pattern to hear it, see real-time visualization, and explore the code.
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-3">
        {CATEGORYFILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedCategory(filter.id)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 ${
              selectedCategory === filter.id
                ? 'bg-[color:var(--color-primary)] text-white shadow-lg shadow-[color:var(--color-primary)]/30'
                : 'glass text-[color:var(--color-muted)] hover:bg-[color:var(--color-primary)]/10'
            }`}
          >
            <span>{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Active Player */}
      {activeDemo && (
        <div className="glass rounded-3xl p-6 border border-[color:var(--color-primary)]/30 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[color:var(--color-success)] animate-pulse' : 'bg-[color:var(--color-muted)]'}`} />
                <span className="text-sm font-bold text-[color:var(--color-primary)]">
                  {activeDemo.name}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${DIFFICULTYCOLORS[activeDemo.difficulty]}`}>
                {activeDemo.difficulty}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePlayDemo(activeDemo)}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                  isPlaying
                    ? 'bg-[color:var(--color-error)] text-white'
                    : 'bg-[color:var(--color-primary)] text-white'
                }`}
              >
                {isPlaying ? '⏹ Stop' : '▶ Play'}
              </button>
              <button
                onClick={handleRemix}
                className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all"
              >
                🎲 Remix
              </button>
            </div>
          </div>

          {/* Visualizer */}
          <StrudelVisualizer 
            isActive={isPlaying} 
            getActiveHaps={() => activeHaps}
            height={100}
            className="rounded-xl"
          />

          {/* Code Display */}
          <div className="relative">
            <button
              onClick={() => setShowCode(showCode === activeDemo.code ? null : activeDemo.code)}
              className="absolute top-2 right-2 px-3 py-1 rounded bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all"
            >
              {showCode === activeDemo.code ? '🙈 Hide' : '👁️ Show'} Code
            </button>
            {showCode === activeDemo.code && (
              <pre className="bg-black/80 rounded-xl p-4 overflow-x-auto text-xs font-mono text-[color:var(--color-foreground)] border border-white/10">
                <code>{activeDemo.code}</code>
              </pre>
            )}
          </div>

          <p className="text-xs text-[color:var(--color-muted)] italic">
            💡 {activeDemo.description}
          </p>
        </div>
      )}

      {/* Demo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDemos.map((demo, index) => (
          <div
            key={index}
            className={`glass rounded-2xl p-5 border transition-all hover:scale-[1.02] cursor-pointer ${
              activeDemo?.code === demo.code
                ? 'border-[color:var(--color-primary)] shadow-lg shadow-[color:var(--color-primary)]/20'
                : 'border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/50'
            }`}
            onClick={() => handlePlayDemo(demo)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold text-[color:var(--color-foreground)]">
                {demo.name}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${DIFFICULTYCOLORS[demo.difficulty]}`}>
                {demo.difficulty}
              </span>
            </div>

            <p className="text-xs text-[color:var(--color-muted)] mb-4 line-clamp-2">
              {demo.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[color:var(--color-muted)] uppercase tracking-wider font-bold">
                {demo.category}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayDemo(demo);
                }}
                className="px-3 py-1.5 rounded-lg bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] font-bold text-[10px] uppercase tracking-wider hover:bg-[color:var(--color-primary)]/30 transition-all flex items-center gap-1"
              >
                {activeDemo?.code === demo.code && isPlaying ? '⏹ Stop' : '▶ Play'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Library Section */}
      <div className="space-y-6 pt-8 border-t border-[color:var(--color-border)]">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-gradient">📚 Complete Pattern Library</h3>
          <p className="text-xs text-[color:var(--color-muted)]">
            Full compositions showcasing multiple features combined
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STRUDEL_PATTERN_LIBRARY.slice(0, 8).map((pattern, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-5 border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-bold text-[color:var(--color-foreground)]">
                    {pattern.name}
                  </h4>
                  <p className="text-xs text-[color:var(--color-muted)] mt-1">
                    {pattern.vibe}
                  </p>
                </div>
                <span className="px-2 py-1 rounded bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] text-[9px] font-bold uppercase tracking-wider">
                  {pattern.category}
                </span>
              </div>

              {pattern.features && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {pattern.features.slice(0, 3).map((feature, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white/5 text-[color:var(--color-muted)] text-[8px] font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={async () => {
                  stopStrudel();
                  setActiveDemo({
                    name: pattern.name,
                    description: pattern.vibe,
                    code: pattern.code,
                    category: pattern.category as any,
                    difficulty: 'intermediate',
                  });
                  const success = await playStrudelCode(pattern.code);
                  setIsPlaying(success);
                  if (onPatternSelect) onPatternSelect(pattern.code);
                }}
                className="w-full py-2.5 rounded-xl bg-[color:var(--color-foreground)] text-[color:var(--background)] font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-all"
              >
                ▶ Play Pattern
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Footer */}
      <div className="glass rounded-3xl p-8 border border-[color:var(--color-border)] space-y-6">
        <h3 className="text-xl font-bold text-gradient">🎓 About Strudel</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[color:var(--color-primary)]">What is Strudel?</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Strudel is a web-based live coding environment for music, porting the TidalCycles 
              pattern language to JavaScript. It uses <strong>mini notation</strong> - a concise 
              syntax for expressing complex rhythmic and melodic patterns.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[color:var(--color-primary)]">Mini Notation</h4>
            <ul className="text-xs text-[color:var(--color-muted)] space-y-1">
              <li>• <code className="bg-white/10 px-1 rounded">*4</code> - Repeat 4 times</li>
              <li>• <code className="bg-white/10 px-1 rounded">[~ x]</code> - Rest then hit</li>
              <li>• <code className="bg-white/10 px-1 rounded">&lt;x y&gt;</code> - Rotate between x and y</li>
              <li>• <code className="bg-white/10 px-1 rounded">x?0.5</code> - 50% chance to play</li>
              <li>• <code className="bg-white/10 px-1 rounded">/3</code> - Triplets</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[color:var(--color-primary)]">Why Musical DNA?</h4>
            <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
              Sonic Guardian uses Strudel patterns as cryptographic seeds. The same pattern 
              always generates the same DNA hash, making it perfect for zero-knowledge 
              verification while being memorable and emotionally resonant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
