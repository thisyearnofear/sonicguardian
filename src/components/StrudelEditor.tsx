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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeHaps, setActiveHaps] = useState(0);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const initEditor = async () => {
      try {
        // Ensure core engine is ready
        await engine.init();

        const { StrudelMirror } = await import('@strudel/codemirror');
        const { getAudioContext, webaudioOutput } = await import('@strudel/webaudio');
        const { transpiler } = await import('@strudel/transpiler');

        // Setup canvas for visual feedback
        const canvas = canvasRef.current;
        let ctx: CanvasRenderingContext2D | null = null;
        
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        }

        const editor = new StrudelMirror({
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
          transpiler,
          root: containerRef.current!,
          initialCode: initialCode,
          readOnly,
          drawTime: [-0.1, 0.4],
          // Visual feedback callback
          onDraw: (haps: any[], time: number) => {
            const activeCount = haps.filter((h: any) => h.isActive?.(time)).length;
            setActiveHaps(activeCount);

            if (canvas && ctx) {
              const rect = canvas.getBoundingClientRect();
              const w = rect.width;
              const h = rect.height;
              
              ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
              ctx.fillRect(0, 0, w, h);
              
              haps.filter(h => h.isActive?.(time)).forEach((hap: any) => {
                const note = hap.value?.note || hap.value?.n || 60;
                const freq = typeof note === 'number' ? note : 60;
                const y = h - ((freq % 48) / 48) * h;
                const hue = (freq * 5) % 360;
                if (ctx) {
                  ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
                  ctx.fillRect(0, y - 2, w, 4);
                }
              });
            }
          },
          onToggle: (started: boolean) => {
            setIsPlaying(started);
            if (!started) {
              setActiveHaps(0);
              if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
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
              LIVE • {activeHaps} event{activeHaps !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={!isInitialized}
              className="px-3 py-1.5 rounded-lg bg-[color:var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶ Play
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-3 py-1.5 rounded-lg bg-[color:var(--color-error)] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              ■ Stop
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 opacity-60"
          style={{ mixBlendMode: 'screen', height: '200px' }}
        />
        
        <div 
          ref={containerRef}
          className="strudel-editor-container rounded-xl overflow-hidden border border-[color:var(--color-border)] bg-black/90 relative"
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
