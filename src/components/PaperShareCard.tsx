'use client';

import { useState } from 'react';

interface PaperShareCardProps {
  share: string;
  onClose: () => void;
}

/**
 * One-time display of the PAPER share (x=3) of the 2-of-3 recovery split.
 * This share is intentionally NOT persisted by the app — the user must copy
 * it (or download the file) and store it offline. Losing it still leaves
 * pattern+device recovery; keeping it adds a third independent factor.
 */
export function PaperShareCard({ share, onClose }: PaperShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. insecure context) — user can select manually
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        'Sonic Guardian recovery paper share (SGS1, Shamir 2-of-3, index 3)\n',
        `Created: ${new Date().toISOString()}\n\n`,
        share,
        '\n\nStore this offline. Any two of {pattern, device share, paper share} reconstruct your acoustic secret.\n',
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sonic-guardian-paper-share.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="alert"
      data-testid="paper-share-card"
      className="max-w-2xl mx-auto mt-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 space-y-3"
    >
      <p className="text-sm font-semibold">
        📄 Your paper recovery share — shown only once
      </p>
      <p className="text-xs text-[color:var(--color-muted)]">
        Your acoustic secret is now split 2-of-3: your <strong>memorized pattern</strong> (share 1,
        never stored), this <strong>paper share</strong> (3), and a device share (2, saved in this
        browser). Any two reconstruct your secret. Store this paper share somewhere offline —
        writing it down is fine.
      </p>
      <code className="block text-xs break-all rounded bg-black/20 p-2 font-mono select-all">
        {share}
      </code>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded border border-[color:var(--color-border)] hover:bg-black/10"
        >
          {copied ? '✓ Copied' : 'Copy share'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="text-xs px-3 py-1.5 rounded border border-[color:var(--color-border)] hover:bg-black/10"
        >
          Download as .txt
        </button>
        <button
          type="button"
          onClick={onClose}
          data-testid="paper-share-dismiss"
          className="text-xs px-3 py-1.5 rounded border border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        >
          I&apos;ve saved it — dismiss
        </button>
      </div>
    </div>
  );
}
