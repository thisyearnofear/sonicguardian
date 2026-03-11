'use client';

import React, { useState, useEffect } from 'react';
import { engine, STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel';
import { StrudelVisualizer } from './StrudelVisualizer';

interface FeatureDemo {
  name: string;
  vibe: string;
  code: string;
  category: 'rhythm' | 'bass' | 'melodic' | 'harmonic' | 'ambient' | 'complex';
  features: string[];
}

interface PatternExplorerProps {
  onPatternSelect?: (code: string, name: string) => void;
}

export function PatternExplorer({ onPatternSelect }: PatternExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeDemo, setActiveDemo] = useState<FeatureDemo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCode, setShowCode] = useState<string | null>(null);
  const [currentLibraryPage, setCurrentLibraryPage] = useState(0);

  // Filter patterns by category
  const filteredPatterns = React.useMemo(() => {
    if (selectedCategory === 'all') return STRUDEL_PATTERN_LIBRARY;
    return STRUDEL_PATTERN_LIBRARY.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const handlePlayDemo = async (demo: FeatureDemo) => {
    if (activeDemo?.name === demo.name && isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      engine.stop();
    }

    setActiveDemo(demo);
    setIsPlaying(true);
    const ok = await engine.play(demo.code);
    if (!ok) setIsPlaying(false);
  };

  const handleSelect = (demo: FeatureDemo) => {
    if (onPatternSelect) {
      onPatternSelect(demo.code, demo.name);
    }
  };

  const categories = ['all', 'rhythm', 'bass', 'melodic', 'harmonic', 'ambient', 'complex'];

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-3xl overflow-hidden border border-white/5">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Pattern <span className="text-[color:var(--color-primary)]">Explorer</span></h2>
            <p className="text-[10px] text-[color:var(--color-muted)] font-bold uppercase tracking-widest mt-1">Discover the building blocks of Sonic Identity</p>
          </div>
          <div className="flex items-center gap-2">
            {isPlaying && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/20">
                <span className="w-1.5 h-1.5 bg-[color:var(--color-primary)] rounded-full animate-pulse" />
                <span className="text-[8px] font-bold text-[color:var(--color-primary)] uppercase">Engine Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                selectedCategory === cat 
                ? 'bg-[color:var(--color-primary)] text-white shadow-lg shadow-[color:var(--color-primary)]/20' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Active Demo Area */}
        {activeDemo ? (
          <div className="glass p-6 rounded-2xl border border-[color:var(--color-primary)]/30 bg-gradient-to-br from-[color:var(--color-primary)]/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl italic pointer-events-none select-none uppercase">
              {activeDemo.category}
            </div>

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-[color:var(--color-primary)] text-[8px] font-black uppercase text-white">Active</span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{activeDemo.name}</h3>
                </div>
                <p className="text-xs text-white/60 italic leading-relaxed">"{activeDemo.vibe}"</p>
                <div className="flex flex-wrap gap-2">
                  {activeDemo.features.map(f => (
                    <span key={f} className="text-[8px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded border border-white/10"># {f}</span>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handlePlayDemo(activeDemo)}
                    className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                      isPlaying 
                      ? 'bg-[color:var(--color-error)] text-white hover:opacity-90' 
                      : 'bg-white text-black hover:scale-[1.02]'
                    }`}
                  >
                    {isPlaying ? (
                      <><span className="w-2 h-2 bg-white rounded-sm" /> Stop Engine</>
                    ) : (
                      <><span className="w-2 h-2 bg-black rounded-full" /> Play Demo</>
                    )}
                  </button>
                  <button
                    onClick={() => handleSelect(activeDemo)}
                    className="px-6 py-3 rounded-xl bg-[color:var(--color-primary)] text-white font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-lg shadow-[color:var(--color-primary)]/20"
                  >
                    Use this Pattern
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Live Visualizer</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-[color:var(--color-primary)] uppercase tracking-widest">
                      {engine.getActiveHapsCount()} Events
                    </span>
                  </div>
                </div>
                
                {/* Visualizer */}
                <StrudelVisualizer
                  isActive={isPlaying}
                  height={100}
                  className="rounded-xl"
                />

                <div className="p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-[10px] text-blue-400/80 max-h-32 overflow-y-auto relative group/code">
                  <button 
                    onClick={() => navigator.clipboard.writeText(activeDemo.code)}
                    className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity p-1.5 bg-white/10 rounded hover:bg-white/20"
                  >
                    📋
                  </button>
                  {activeDemo.code}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-white/[0.02]">
            <div className="text-3xl mb-4 opacity-20">🎼</div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Select a pattern below to explore its sonic structure</p>
          </div>
        )}

        {/* Pattern Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatterns.map(pattern => (
            <div 
              key={pattern.name}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                activeDemo?.name === pattern.name 
                ? 'bg-[color:var(--color-primary)]/10 border-[color:var(--color-primary)]/40 shadow-xl' 
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
              onClick={() => setActiveDemo(pattern as any)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-xs">
                  {pattern.category === 'rhythm' && '🥁'}
                  {pattern.category === 'bass' && '🎸'}
                  {pattern.category === 'melodic' && '🎹'}
                  {pattern.category === 'harmonic' && '🎻'}
                  {pattern.category === 'ambient' && '🌌'}
                  {pattern.category === 'complex' && '🚀'}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayDemo(pattern as any);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    activeDemo?.name === pattern.name && isPlaying
                    ? 'bg-[color:var(--color-error)] text-white scale-110 shadow-lg'
                    : 'bg-white text-black hover:scale-110'
                  }`}
                >
                  {activeDemo?.name === pattern.name && isPlaying ? '■' : '▶'}
                </button>
              </div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-tight mb-1 group-hover:text-[color:var(--color-primary)] transition-colors">{pattern.name}</h4>
              <p className="text-[9px] text-white/40 line-clamp-2 italic leading-relaxed">"{pattern.vibe}"</p>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[8px] font-black text-[color:var(--color-primary)]/60 uppercase tracking-widest">{pattern.category}</span>
                <div className="flex gap-1">
                  {pattern.features.slice(0, 2).map(f => (
                    <div key={f} className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Stats */}
      <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
        <span>Strudel Pattern Library v1.2</span>
        <div className="flex gap-4">
          <span>{STRUDEL_PATTERN_LIBRARY.length} Patterns</span>
          <span>{categories.length - 1} Categories</span>
        </div>
      </div>
    </div>
  );
}
