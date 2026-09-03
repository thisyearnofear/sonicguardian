'use client';

import React, { useState } from 'react';
import { STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel-patterns';
import { playStrudelCode, stopStrudel } from '@/lib/strudel-lazy';
import { PatternExplorer } from './PatternExplorer';

interface StrudelLabsProps {
  onPatternSelect?: (code: string, name: string) => void;
}

export function StrudelLabs({ onPatternSelect }: StrudelLabsProps) {
  const [open, setOpen] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const patterns = showAll ? STRUDEL_PATTERN_LIBRARY : STRUDEL_PATTERN_LIBRARY.slice(0, 6);

  const handlePreview = async (code: string, id: string) => {
    if (previewId === id) {
      stopStrudel();
      setPreviewId(null);
      return;
    }
    stopStrudel();
    const ok = await playStrudelCode(code);
    setPreviewId(ok ? id : null);
  };

  if (!open) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[10px] px-4 py-2 rounded-lg border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:border-[color:var(--color-primary)]/40 hover:text-[color:var(--color-primary)] font-bold uppercase tracking-widest transition-all"
        >
          🧪 Strudel Labs — pattern library & audio preview
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto mt-8 p-6 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)]/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[color:var(--color-muted)]">Strudel Labs</h3>
            <p className="text-[9px] text-[color:var(--color-muted)] mt-1">Optional — explore patterns & audio. Not required for minting.</p>
          </div>
          <button type="button" onClick={() => { setOpen(false); stopStrudel(); setPreviewId(null); }} className="text-[9px] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]">
            Collapse
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {patterns.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setSelectedId(p.name)}
              className={`p-3 rounded-lg border text-left text-[10px] ${selectedId === p.name ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10' : 'border-[color:var(--color-border)]'}`}
            >
              <span className="font-bold block truncate">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" onClick={() => setShowAll(!showAll)} className="text-[9px] font-bold uppercase text-[color:var(--color-primary)]">
            {showAll ? 'Show less' : `All ${STRUDEL_PATTERN_LIBRARY.length} patterns`}
          </button>
          <button type="button" onClick={() => setShowExplorer(true)} className="text-[9px] font-bold uppercase text-[color:var(--color-muted)] hover:text-[color:var(--color-primary)]">
            Pattern explorer →
          </button>
        </div>

        {selectedId && (
          <div className="p-4 rounded-xl bg-black/40 border border-[color:var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[color:var(--color-primary)]">{selectedId}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePreview(STRUDEL_PATTERN_LIBRARY.find(p => p.name === selectedId)!.code, selectedId)}
                  className="text-[9px] px-2 py-1 rounded border border-[color:var(--color-border)] uppercase font-bold"
                >
                  {previewId === selectedId ? 'Stop' : '▶ Preview'}
                </button>
                {onPatternSelect && (
                  <button
                    type="button"
                    onClick={() => onPatternSelect(STRUDEL_PATTERN_LIBRARY.find(p => p.name === selectedId)!.code, selectedId)}
                    className="text-[9px] px-2 py-1 rounded bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] uppercase font-bold"
                  >
                    Use for mint
                  </button>
                )}
              </div>
            </div>
            <pre className="text-[10px] font-mono text-blue-400/80 overflow-x-auto max-h-32">{STRUDEL_PATTERN_LIBRARY.find(p => p.name === selectedId)?.code}</pre>
          </div>
        )}
      </div>

      {showExplorer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-[color:var(--background)] border border-[color:var(--color-border)] p-6">
            <button type="button" onClick={() => setShowExplorer(false)} className="absolute top-4 right-4 text-[color:var(--color-muted)]">✕</button>
            <PatternExplorer onPatternSelect={(code) => { onPatternSelect?.(code, 'explorer'); setShowExplorer(false); }} />
          </div>
        </div>
      )}
    </>
  );
}
