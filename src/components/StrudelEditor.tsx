'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [activeHaps, setActiveHaps] = useState(0);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const initEditor = async () => {
      try {
        const { StrudelMirror } = await import('@strudel/codemirror');
        const { evalScope } = await import('@strudel/core');
        const { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds } = await import('@strudel/webaudio');
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

        const drawTime = [-0.5, 1]; // time window: 0.5s past, 1s future

        const editor = new StrudelMirror({
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
          transpiler,
          root: containerRef.current!,
          initialCode: initialCode,
          readOnly,
          drawTime,
          // Visual feedback callback - receives haps (events) in real-time
          onDraw: (haps: any[], time: number) => {
            // Count active haps (currently playing events)
            const active = haps.filter((h: any) => h.isActive?.(time));
            setActiveHaps(active.length);

            // Draw simple visualization on canvas
            if (canvas && ctx) {
              const rect = canvas.getBoundingClientRect();
              const w = rect.width;
              const h = rect.height;
              
              // Clear with fade effect
              ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
              ctx.fillRect(0, 0, w, h);
              
              // Draw active events as bars
              active.forEach((hap: any) => {
                if (!ctx) return;
                const value = hap.value;
                const note = value?.note || value?.n || 60;
                const freq = typeof note === 'number' ? note : 60;
                
                // Map frequency to vertical position
                const y = h - ((freq % 48) / 48) * h;
                const barHeight = 4;
                
                // Color based on event properties
                const hue = (freq * 5) % 360;
                if (ctx) {
                  ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
                  ctx.fillRect(0, y - barHeight/2, w, barHeight);
                }
              });
            }
          },
          onToggle: (started: boolean) => {
            setIsPlaying(started);
            if (!started) {
              setActiveHaps(0);
              // Clear canvas
              if (canvas && ctx) {
                const rect = canvas.getBoundingClientRect();
                ctx.clearRect(0, 0, rect.width, rect.height);
              }
            }
          },
          prebake: async () => {
            initAudioOnFirstClick();
            const loadModules = evalScope(
              import('@strudel/core'),
              import('@strudel/mini'),
              import('@strudel/tonal'),
              import('@strudel/webaudio'),
            );
            await Promise.all([loadModules, registerSynthSounds()]);
          },
        });

        editorRef.current = editor;
        setIsInitialized(true);

        // Listen for code changes if callback provided
        if (onCodeChange && !readOnly) {
          // Poll for code changes (StrudelMirror updates its .code property)
          const checkInterval = setInterval(() => {
            if (editor.code !== initialCode) {
              onCodeChange(editor.code);
            }
          }, 1000);
          
          return () => clearInterval(checkInterval);
        }
      } catch (error) {
        console.error('[StrudelEditor] Initialization failed:', error);
      }
    };

    initEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.stop?.();
        document.removeEventListener('start-repl', editorRef.current.onStartRepl);
        document.removeEventListener('repl-evaluate', editorRef.current.onEvaluateRequest);
        document.removeEventListener('repl-stop', editorRef.current.onStopRequest);
        document.removeEventListener('repl-toggle-comment', editorRef.current.onToggleComment);
        editorRef.current = null;
      }
    };
  }, []);

  // Update code when initialCode prop changes
  useEffect(() => {
    if (editorRef.current && initialCode && editorRef.current.code !== initialCode) {
      // Update the editor's code
      const view = editorRef.current.editor;
      if (view) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: initialCode
          }
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
    if (!editorRef.current) return;
    
    try {
      editorRef.current.stop();
    } catch (error) {
      console.error('[StrudelEditor] Stop error:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-primary)]">
            Strudel Live Code
          </span>
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
        {/* Visual feedback canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 opacity-60"
          style={{ mixBlendMode: 'screen', height: '200px' }}
        />
        
        {/* Strudel editor */}
        <div 
          ref={containerRef}
          className="strudel-editor-container rounded-xl overflow-hidden border border-[color:var(--color-border)] bg-black/90 relative"
          style={{ minHeight: '200px' }}
        />

        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-20">
            <div className="flex items-center gap-2 text-white text-sm">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading Strudel...
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
