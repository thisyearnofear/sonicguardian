import type { MusicalChunk } from './entropy-encoder';
import { STRUDEL_PATTERN_LIBRARY } from './strudel-patterns';

export const SG2_PREFIX = 'SG2:';

function encodeUtf8Base64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeUtf8Base64(value: string): string {
  return decodeURIComponent(escape(atob(value.replace(/\s/g, ''))));
}

/** Short spoken lines for the listen / remember step. Effects stay off this list. */
export function humanizeChunks(chunks: MusicalChunk[]): string[] {
  const lines: string[] = [];
  for (const chunk of chunks) {
    if (chunk.category === 'drum') {
      const match = chunk.text.match(/^(\w+) rhythm (.+)$/i);
      if (match) {
        const [, synth, rhythm] = match;
        lines.push(`${capitalize(rhythm)} on ${synth}`);
      }
    } else if (chunk.category === 'melody') {
      const match = chunk.text.match(/^(\w+) melody (.+)$/i);
      if (match) {
        const [, synth, notes] = match;
        lines.push(`Melody ${notes.replace(/\s+/g, ' · ')} on ${synth}`);
      }
    } else if (chunk.category === 'structure') {
      const match = chunk.text.match(/tempo\s+(\d+)/i);
      if (match) lines.push(`Tempo ${match[1]}`);
    }
  }
  return lines.slice(0, 6);
}

export function humanizeNamedPattern(name: string, vibe?: string): string[] {
  const lines = [name];
  if (vibe?.trim()) lines.push(capitalize(vibe.trim()));
  return lines.slice(0, 4);
}

function capitalize(value: string): string {
  return value.replace(/^\w/, (c) => c.toUpperCase());
}

/** What the user copies: spoken lines plus a machine token that rebuilds the exact code. */
export function packRecoverySecret(lines: string[], code: string): string {
  const spoken = lines.length ? lines.join(' · ') : 'sonic secret';
  return `${spoken}\n${SG2_PREFIX}${encodeUtf8Base64(code)}`;
}

export function extractPackedCode(input: string): string | null {
  const match = input.match(/SG2:([A-Za-z0-9+/=\s]+)/);
  if (!match) return null;
  try {
    const code = decodeUtf8Base64(match[1]);
    return code.trim() ? code : null;
  } catch {
    return null;
  }
}

export function looksLikeStrudel(input: string): boolean {
  return /^(stack|note|s|n)\s*\(/m.test(input.trim());
}

export function matchLibraryPattern(input: string): string | null {
  const needle = input.trim().toLowerCase();
  if (!needle) return null;
  const hit = STRUDEL_PATTERN_LIBRARY.find(
    (p) =>
      needle === p.name.toLowerCase() ||
      needle.includes(p.name.toLowerCase()) ||
      (p.vibe && needle === p.vibe.toLowerCase()),
  );
  return hit?.code ?? null;
}

export function spokenLinesFromPacked(packed: string): string {
  return packed
    .split('\n')
    .filter((line) => !line.trim().startsWith(SG2_PREFIX))
    .join(' ')
    .trim();
}

export function spokenInputMatchesPacked(input: string, packed: string): boolean {
  const a = spokenLinesFromPacked(input).toLowerCase();
  const b = spokenLinesFromPacked(packed).toLowerCase();
  if (!a || !b) return false;
  return a === b || b.includes(a) || a.includes(b);
}

/**
 * Resolve pasted recovery input to the exact pattern code when we can.
 * Falls back to `null` so the caller can use the legacy vibe → template path.
 */
export function resolveRecoveryCode(input: string, fallbackCode?: string | null): string | null {
  const packed = extractPackedCode(input);
  if (packed) return packed;
  if (looksLikeStrudel(input)) return input.trim();
  const library = matchLibraryPattern(input);
  if (library) return library;
  return fallbackCode?.trim() || null;
}
