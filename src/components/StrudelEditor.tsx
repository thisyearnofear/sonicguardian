'use client';

import { useEffect, useRef, useState } from 'react';
import { Tooltip } from './Tooltip';
import { engine } from '@/lib/strudel';

interface StrudelEditorProps {
  initialCode: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
}

export function StrudelEditor({ initialCode, onCodeChange, readOnly = false }: StrudelEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [cycleProgress, setCycleProgress] = useState(0);

  useEffect(() => {
    let progressInterval: number;
    if (isPlaying) {
      progressInterval = window.setInterval(() => {
        setCycleProgress(engine.getCycleProgress());
      }, 50);
    } else {
      setCycleProgress(0);
    }
    return () => clearInterval(progressInterval);
  }, [isPlaying]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const initEditor = async () => {
      try {
        // Ensure core engine is ready
        await engine.init();

        const { StrudelMirror } = await import('@strudel/codemirror');
        const { getAudioContext, webaudioOutput } = await import('@strudel/webaudio');
        const { transpiler } = await import('@strudel/transpiler');

        const editor = new StrudelMirror({
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
          transpiler,
          root: containerRef.current!,
          initialCode: initialCode,
          readOnly,
          drawTime: [-0.1, 0.4],
          // Visual feedback callback - minimal state updates here as engine handles it
          onDraw: () => {},
          onToggle: (started: boolean) => {
            setIsPlaying(started);
          },
        });

        editorRef.current = editor;
        setIsInitialized(true);

        // Code change polling
        if (onCodeChange && !readOnly) {
          const checkInterval = setInterval(() => {
            if (editor.code !== initialCode) {
              onCodeChange(editor.code);
            }
          }, 1000);
          return () => clearInterval(checkInterval);
        }
      } catch (error) {
        console.error('[StrudelEditor] Initialization failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load Strudel engine';
        
        // Detect minification errors
        const isMinificationError = /is not a function|Cannot read propert|undefined is not a function/.test(errorMessage);
        const helpfulMessage = isMinificationError 
          ? 'Strudel editor failed to load. Please try: 1) Hard refresh (Ctrl+Shift+R), 2) Clear browser cache, 3) Try in a different browser.'
          : errorMessage;
        
        setInitError(helpfulMessage);
      }
    };

    initEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.stop?.();
        editorRef.current = null;
      }
    };
  }, []);

  // Sync prop changes to editor
  useEffect(() => {
    if (editorRef.current && initialCode && editorRef.current.code !== initialCode) {
      const view = editorRef.current.editor;
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: initialCode }
        });
      }
    }
  }, [initialCode]);

  const handlePlay = async () => {
    if (!editorRef.current) return;
    try {
      await editorRef.current.evaluate();
    } catch (error) {
      console.error('[StrudelEditor] Play error:', error);
    }
  };

  const handleStop = () => {
    if (editorRef.current) {
      editorRef.current.stop();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tooltip text="Strudel is a live coding environment for music. Write code to create generative patterns that can be used as your Sonic Guardian." position="bottom">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)] cursor-help">
              Strudel Live Code
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
              onClick={handlePlay}
              disabled={!isInitialized}
              className="px-4 py-1.5 rounded-lg bg-[color:var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-white rounded-full" />
              Play Pattern
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="relative px-4 py-1.5 rounded-lg bg-[color:var(--color-error)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-white/20 pointer-events-none transition-all duration-75"
                style={{ width: `${cycleProgress * 100}%` }}
              />
              <span className="relative z-10 w-2 h-2 bg-white rounded-sm" />
              <span className="relative z-10">Stop Engine</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-[color:var(--color-primary)] to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 ${isPlaying ? 'animate-pulse opacity-30' : ''}`} />
        
        <div 
          ref={containerRef}
          className="strudel-editor-container rounded-xl overflow-hidden border border-[color:var(--color-border)] bg-black/90 relative z-10"
          style={{ minHeight: '200px' }}
        />

        {!isInitialized && !initError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-20">
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading Strudel Engine...
            </div>
          </div>
        )}
        {initError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-20">
            <div className="flex flex-col items-center gap-2 text-center p-4">
              <span className="text-[color:var(--color-error)] text-sm">⚠️ {initError}</span>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 rounded-lg bg-[color:var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[9px] text-[color:var(--color-muted)] italic">
        Press Ctrl+Enter (or Cmd+Enter) in the editor to play. Code highlights show active events.
      </p>
    </div>
  );
}
