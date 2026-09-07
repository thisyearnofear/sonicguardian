'use client';

import { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/storage';

/**
 * R5 disclosure (THREAT_MODEL_REVIEW.md): cross-device recovery promotes the
 * PAPER share to this device's stored share — the copy the user believes is
 * offline-only now lives in this browser (encrypted at rest, share-crypto.ts).
 * This notice is the user-facing disclosure AND the persistent indicator:
 * it renders whenever the promoted share exists in the session, with an
 * affordance to clear the device copy and return the share to paper-only
 * custody. Renders nothing when no promoted share exists.
 */
export function PromotedShareNotice() {
  const [promotedAt, setPromotedAt] = useState<number | null>(null);

  useEffect(() => {
    setPromotedAt(sessionManager.getCurrentSession()?.paperSharePromotedAt ?? null);
  }, []);

  if (!promotedAt) return null;

  const clearDeviceCopy = () => {
    sessionManager.clearSession();
    setPromotedAt(null);
  };

  return (
    <div
      className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2"
      data-testid="promoted-share-notice"
    >
      <p className="text-xs leading-relaxed text-[color:var(--color-foreground)]">
        <strong>Your paper backup is now saved on this device.</strong>{' '}
        <span className="text-[color:var(--color-muted)]">
          It was stored here (encrypted) after recovery on{' '}
          {new Date(promotedAt).toLocaleDateString()} so this phone can recover without
          the paper next time. It is <strong>no longer paper-only</strong> — anyone
          with this device holds one of your keys.
        </span>
      </p>
      <p className="text-xs text-[color:var(--color-muted)] leading-relaxed">
        Clearing this device&apos;s session returns the share to paper-only custody.
      </p>
      <button
        type="button"
        onClick={clearDeviceCopy}
        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        data-testid="clear-promoted-share"
      >
        Clear this device&apos;s copy
      </button>
    </div>
  );
}
