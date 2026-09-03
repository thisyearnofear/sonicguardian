/**
 * Recovery split orchestration (M3).
 *
 * Splits the acoustic secret 2-of-3 so that the memorized musical pattern is
 * one Shamir factor, not the only factor:
 *
 *   Share #1 (x=1) — PATTERN share: deterministically derived from the DNA
 *     hash of the pattern (HKDF-style, domain-separated). Never stored;
 *     recomputed from the pattern at recovery time.
 *   Share #2 (x=2) — DEVICE share: stored in the session (localStorage).
 *   Share #3 (x=3) — PAPER share: shown once at mint for offline backup.
 *
 * Any two of {pattern, device, paper} reconstruct the secret. The DNA hash
 * alone, the device alone, or the paper alone each reveal nothing.
 *
 * This module is intentionally free of DOM/localStorage imports so it can be
 * unit-tested in Node; persistence is delegated to callers.
 */

import {
  serializeShare,
  parseShare,
  splitSecretFromAnchor,
  combineSharesAndVerify,
} from './shamir.ts';
import type { Share } from './shamir.ts';

const PATTERN_SHARE_X = 1;
const DEVICE_SHARE_X = 2;
const PAPER_SHARE_X = 3;

const PATTERN_SHARE_DOMAIN = 'sonic-guardian:pattern-share:v1';

export function sha256Hex(bytes: Uint8Array): Promise<string> {
  return crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(''),
  );
}

/** Domain-separated derivation of the pattern share bytes from the DNA hash. */
export async function derivePatternShare(dnaHash: string, length: number): Promise<Share> {
  const encoder = new TextEncoder();
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', encoder.encode(PATTERN_SHARE_DOMAIN + ':' + dnaHash)),
  );
  if (length > digest.length) {
    throw new Error(`Pattern share derivation supports up to ${digest.length} bytes`);
  }
  return { x: PATTERN_SHARE_X, data: digest.slice(0, length) };
}

/** felt252 decimal string -> 32 bytes (big-endian). */
export function feltToBytes(felt: string): Uint8Array {
  let hex = BigInt(felt).toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const out = new Uint8Array(32);
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  out.set(bytes, 32 - bytes.length);
  return out;
}

/** 32 bytes (big-endian) -> felt252 decimal string. */
export function bytesToFelt(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return BigInt('0x' + hex).toString();
}

export interface RecoverySplit {
  /** Serialized share recomputable from the pattern (x=1). */
  patternShare: string;
  /** Serialized share to persist on the device (x=2). */
  deviceShare: string;
  /** Serialized share to export as paper backup (x=3). */
  paperShare: string;
  /** SHA-256 of the secret — used to authenticate reconstruction. */
  secretDigest: string;
}

/**
 * Create the 2-of-3 recovery split for an acoustic secret.
 * The pattern share is recomputed (not random) so it can be re-derived
 * from the memorized pattern alone at recovery time.
 */
export async function createRecoverySplit(
  secret: Uint8Array,
  dnaHash: string,
): Promise<RecoverySplit> {
  const anchor = await derivePatternShare(dnaHash, secret.length);
  const [device, paper] = splitSecretFromAnchor(secret, anchor, [DEVICE_SHARE_X, PAPER_SHARE_X]);
  return {
    patternShare: serializeShare(anchor),
    deviceShare: serializeShare(device),
    paperShare: serializeShare(paper),
    secretDigest: await sha256Hex(secret),
  };
}

/**
 * Reconstruct the secret from any two serialized shares (pattern, device,
 * paper). Returns null instead of throwing when shares don't match the
 * expected secret digest (wrong pattern, corrupted/forged share).
 */
export async function recoverFromShares(
  serializedShares: string[],
  expectedDigest: string,
): Promise<Uint8Array | null> {
  try {
    const shares: Share[] = serializedShares.map(parseShare);
    if (shares.length < 2) return null;
    return await combineSharesAndVerify(shares, expectedDigest);
  } catch {
    return null;
  }
}

export const RECOVERY_SHARE_INDEXES = {
  pattern: PATTERN_SHARE_X,
  device: DEVICE_SHARE_X,
  paper: PAPER_SHARE_X,
} as const;
