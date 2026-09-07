'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { playStrudelCode, stopStrudel } from '@/lib/strudel-lazy';
import { STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel-patterns';
import { generateAudio } from '@/lib/audio';

interface HearAndQuizProps {
  code: string;
  passed: boolean;
  onPassed: () => void;
}

type Clip = { id: string; label: string; code: string; correct: boolean };

function pickDecoys(realCode: string): Clip[] {
  const others = STRUDEL_PATTERN_LIBRARY.filter((p) => p.code.trim() !== realCode.trim());
  const decoys: Clip[] = [];
  const used = new Set<number>();
  while (decoys.length < 2 && used.size < others.length) {
    const i = Math.floor(Math.random() * others.length);
    if (used.has(i)) continue;
    used.add(i);
    decoys.push({
      id: `decoy-${others[i].name}`,
      label: others[i].name,
      code: others[i].code,
      correct: false,
    });
  }
  return decoys;
}

export function HearAndQuiz({ code, passed, onPassed }: HearAndQuizProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const playGen = useRef(0);

  const clips = useMemo<Clip[]>(() => {
    const real: Clip = { id: 'yours', label: 'Yours', code, correct: true };
    const mixed = [real, ...pickDecoys(code)];
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
    }
    return mixed;
  }, [code]);

  useEffect(() => {
    return () => {
      void stopStrudel();
    };
  }, []);

  const halt = async () => {
    playGen.current += 1;
    await stopStrudel();
    setPlayingId(null);
    setSwitching(false);
  };

  const play = async (clip: Clip) => {
    if (playingId === clip.id) {
      await halt();
      return;
    }
    const gen = ++playGen.current;
    setError(null);
    setSwitching(true);
    setPlayingId(clip.id);
    try {
      const ok = await playStrudelCode(clip.code);
      if (gen !== playGen.current) return;
      if (!ok) {
        setError('Playback failed in this browser. You can still continue after picking your clip.');
        setPlayingId(null);
      }
    } catch {
      if (gen !== playGen.current) return;
      setError('Playback failed in this browser. You can still continue after picking your clip.');
      setPlayingId(null);
    } finally {
      if (gen === playGen.current) setSwitching(false);
    }
  };

  const submit = (clip: Clip) => {
    setChoice(clip.id);
    if (clip.correct) {
      setWrong(false);
      void halt();
      try {
        const ctx = new AudioContext();
        generateAudio(ctx, 'success');
      } catch {
        // audio confirm is optional
      }
      onPassed();
    } else {
      setWrong(true);
    }
  };

  if (passed) {
    return (
      <p className="text-sm text-[color:var(--color-success)] font-semibold">
        You picked your clip. Next: write down the paper key.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="hear-and-quiz">
      <p className="text-sm font-semibold">Hear it, then pick yours</p>
      <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
        Play your secret first. Then play the others and choose the one you will remember.
      </p>
      <div className="grid gap-2">
        {clips.map((clip, index) => {
          const active = playingId === clip.id;
          const missed = choice === clip.id && wrong && !clip.correct;
          return (
            <div
              key={clip.id}
              className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                missed
                  ? 'border-[color:var(--color-error)]/50'
                  : active
                    ? 'border-[color:var(--color-primary)]/55 bg-[color:var(--color-primary)]/8'
                    : 'border-[color:var(--color-border)]'
              }`}
            >
              <button
                type="button"
                onClick={() => void play(clip)}
                disabled={switching && !active}
                className="min-h-11 px-3 rounded-lg border border-[color:var(--color-border)] text-sm font-semibold disabled:opacity-50"
              >
                {active ? (switching ? 'Starting…' : 'Stop') : `Play ${index + 1}`}
              </button>
              <span className="flex items-end gap-0.5 h-6 w-7 shrink-0" aria-hidden>
                {[0, 1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`w-1 rounded-full bg-[color:var(--color-primary)] ${
                      active && !switching ? 'animate-pulse' : 'opacity-25'
                    }`}
                    style={{
                      height: active && !switching ? `${40 + ((n * 17 + index * 11) % 50)}%` : '30%',
                      animationDelay: `${n * 90}ms`,
                    }}
                  />
                ))}
              </span>
              <button
                type="button"
                onClick={() => submit(clip)}
                className="flex-1 min-h-11 rounded-lg bg-[color:var(--color-foreground)]/5 text-sm font-semibold"
              >
                This is mine
              </button>
            </div>
          );
        })}
      </div>
      {wrong && (
        <p className="text-sm text-[color:var(--color-error)]">
          That wasn’t yours. Listen again.
        </p>
      )}
      {error && <p className="text-sm text-[color:var(--color-warning)]">{error}</p>}
    </div>
  );
}
