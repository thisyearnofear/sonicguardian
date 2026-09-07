'use client';

import { useEffect, useMemo, useState } from 'react';
import { playStrudelCode, stopStrudel } from '@/lib/strudel-lazy';
import { STRUDEL_PATTERN_LIBRARY } from '@/lib/strudel-patterns';

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
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);

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

  const play = async (clip: Clip) => {
    setError(null);
    setPlayingId(clip.id);
    try {
      await playStrudelCode(clip.code);
    } catch {
      setError('Playback failed in this browser. You can still continue after picking your clip.');
    }
  };

  const submit = (clip: Clip) => {
    setChoice(clip.id);
    if (clip.correct) {
      setWrong(false);
      void stopStrudel();
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
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            className={`flex items-center gap-2 rounded-xl border p-2 ${
              choice === clip.id && wrong && !clip.correct
                ? 'border-[color:var(--color-error)]/50'
                : 'border-[color:var(--color-border)]'
            }`}
          >
            <button
              type="button"
              onClick={() => void play(clip)}
              className="min-h-11 px-3 rounded-lg border border-[color:var(--color-border)] text-sm font-semibold"
            >
              {playingId === clip.id ? 'Playing…' : `Play ${index + 1}`}
            </button>
            <button
              type="button"
              onClick={() => submit(clip)}
              className="flex-1 min-h-11 rounded-lg bg-[color:var(--color-foreground)]/5 text-sm font-semibold"
            >
              This is mine
            </button>
          </div>
        ))}
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
