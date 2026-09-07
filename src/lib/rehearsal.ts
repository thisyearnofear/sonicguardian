/**
 * Tab-only rehearsal draft. This is NOT the R2 session: pattern material
 * never goes in localStorage. sessionStorage dies with the tab so a judge
 * (or the person who just created) can recover without retyping.
 */

export const REHEARSAL_KEY = 'sonic_rehearsal_tab';

export interface RehearsalDraft {
  phrases: string;
  btcAddress: string;
  /** Exact pattern code for same-tab recover — not shown in the form. */
  code: string;
  at: number;
}

export function saveRehearsal(draft: Omit<RehearsalDraft, 'at'>): void {
  if (typeof window === 'undefined') return;
  const payload: RehearsalDraft = { ...draft, at: Date.now() };
  sessionStorage.setItem(REHEARSAL_KEY, JSON.stringify(payload));
}

export function readRehearsal(): RehearsalDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(REHEARSAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RehearsalDraft;
    if (!parsed?.phrases || !parsed?.code) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRehearsal(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REHEARSAL_KEY);
}
