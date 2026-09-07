'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface PaperShareCardProps {
  share: string;
  onClose: () => void;
}

/**
 * Blocking one-time display of the PAPER share (x=3) of the 2-of-3 split.
 * The share is not persisted — dismiss only after the user acknowledges
 * they wrote it down.
 */
export function PaperShareCard({ share, onClose }: PaperShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const headingId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can select the share manually
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        'Sonic Guardian paper backup (any two of: the music, this device, this paper)\n',
        `Created: ${new Date().toISOString()}\n\n`,
        share,
        '\n\nStore this offline. Do not photograph it in cloud backup.\n',
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sonic-guardian-paper-backup.txt';
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const canDismiss = acknowledged && (copied || downloaded);

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        data-testid="paper-share-card"
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--background)] p-5 sm:p-6 space-y-4 shadow-2xl"
      >
        <p
          id={headingId}
          className="text-lg font-bold tracking-tight"
        >
          Write this down — shown once
        </p>
        <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
          This is the paper key. Together with the music you remember, it can recover
          you on a new phone. The app will not show it again.
        </p>
        <code className="block text-sm break-all rounded-xl bg-[color:var(--color-foreground)]/6 border border-[color:var(--color-border)] p-3 font-mono select-all leading-relaxed">
          {share}
        </code>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex-1 min-h-11 px-3 rounded-xl border border-[color:var(--color-border)] text-sm font-semibold hover:border-[color:var(--color-primary)]/40"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 min-h-11 px-3 rounded-xl border border-[color:var(--color-border)] text-sm font-semibold hover:border-[color:var(--color-primary)]/40"
          >
            {downloaded ? 'Downloaded' : 'Download .txt'}
          </button>
        </div>
        <label className="flex items-start gap-3 text-sm leading-snug cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[color:var(--color-primary)]"
          />
          <span>I wrote this down and stored it offline — not in a screenshot or cloud notes.</span>
        </label>
        {!canDismiss && acknowledged && (
          <p className="text-xs text-[color:var(--color-muted)]">
            Copy or download first so you have a copy outside this screen.
          </p>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          disabled={!canDismiss}
          data-testid="paper-share-dismiss"
          className="btn-primary py-3.5 disabled:opacity-40"
        >
          I have the paper copy
        </button>
      </div>
    </div>
  );
}
