/**
 * Shamir Secret Sharing over GF(2^8) (DIRECTION.md M3)
 *
 * Recovery architecture: the sonic pattern derives ONE share; a device or
 * encrypted backup holds ANOTHER. 2-of-N reconstruction means:
 *   - pattern loss alone  → recoverable from device shares
 *   - device loss alone   → recoverable from the memorized pattern
 *   - neither alone       → sufficient (also caps the damage of a leaked share)
 *
 * Implementation notes:
 * - Arithmetic in GF(2^8) with the AES polynomial 0x11B, matching the
 *   ssss/dice-key conventions and WebCrypto-adjacent tooling.
 * - The secret is the polynomial evaluated at x=0 (Shamir's original scheme).
 * - Share index x is stored in byte 0 of each share (1..255; x=0 is the
 *   secret itself and is never emitted).
 * - Secret length ≤ 255 bytes (fits the felt252/hash use cases easily).
 *
 * SECURITY CAVEATS (documented, deliberate):
 * 1. Shares are unauthenticated: a corrupted/forged share is detected only by
 *    reconstruction failing. Pair with a checksum of the reconstructed secret
 *    at the application layer (combineSharesAndVerify).
 * 2. This module provides confidentiality splitting only. It does not decide
 *    what the shares protect — see DIRECTION.md for the recovery-factor design.
 */

export const SHARE_HEADER = 'SGS1'; // Sonic Guardian Shamir v1

const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
(function initTables() {
  // Build log/antilog tables with primitive generator 3 (AES convention).
  // NOTE: 2 is NOT primitive in GF(2^8) (order 51) — using it would silently
  // corrupt multiplication for elements not on 2's cycle.
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    // multiply x by 3: (2*x) ^ x, with modular reduction by 0x11B
    const x2 = (x << 1) ^ (x & 0x80 ? 0x11b : 0);
    x = (x2 ^ x) & 0xff;
  }
  EXP_TABLE[255] = EXP_TABLE[0]; // wrap
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function gfInv(a: number): number {
  if (a === 0) throw new Error('Cannot invert 0 in GF(2^8)');
  return EXP_TABLE[255 - LOG_TABLE[a]];
}

export interface Share {
  /** Share index x (1..255). */
  x: number;
  /** Share payload, one byte per secret byte. */
  data: Uint8Array;
}

/** Serialize a share to a portable string: SGS1:<x>:<base64>. */
export function serializeShare(share: Share): string {
  return `${SHARE_HEADER}:${share.x}:${uint8ToBase64(share.data)}`;
}

export function parseShare(serialized: string): Share {
  const parts = serialized.split(':');
  if (parts.length !== 3 || parts[0] !== SHARE_HEADER) {
    throw new Error(`Invalid share format (expected ${SHARE_HEADER}:<x>:<base64>)`);
  }
  const x = parseInt(parts[1], 10);
  if (!Number.isInteger(x) || x < 1 || x > 255) {
    throw new Error('Share index out of range (1..255)');
  }
  return { x, data: base64ToUint8(parts[2]) };
}

/**
 * Split a secret into `shares` shares with `threshold` needed to reconstruct.
 * rng must return a random byte (0..255) per call — defaults to CSPRNG.
 */
export function splitSecret(
  secret: Uint8Array,
  threshold: number,
  shares: number,
  rng: () => number = () => crypto.getRandomValues(new Uint8Array(1))[0],
): Share[] {
  if (secret.length === 0) throw new Error('Secret must not be empty');
  if (secret.length > 255) throw new Error('Secret longer than 255 bytes');
  if (threshold < 1 || threshold > shares) throw new Error('Threshold must be 1..shares');
  if (shares > 255) throw new Error('At most 255 shares');
  if (threshold === 1) {
    throw new Error('1-of-N is not secret sharing — reject (single share = the secret)');
  }

  const result: Share[] = [];
  for (let s = 1; s <= shares; s++) {
    result.push({ x: s, data: new Uint8Array(secret.length) });
  }

  for (let i = 0; i < secret.length; i++) {
    // coeffs[0] is the secret; higher coefficients random
    const coeffs: number[] = [secret[i]];
    for (let k = 1; k < threshold; k++) coeffs.push(rng() & 0xff);
    for (const share of result) {
      share.data[i] = evalPoly(coeffs, share.x);
    }
  }
  return result;
}

function evalPoly(coeffs: number[], x: number): number {
  // Horner's method in GF(2^8)
  let y = 0;
  for (let k = coeffs.length - 1; k >= 0; k--) {
    y = gfMul(y, x) ^ coeffs[k];
  }
  return y;
}

/**
 * Reconstruct the secret from the provided shares (need ≥ threshold).
 * Throws on duplicate indices or length mismatch.
 */
export function combineShares(shares: Share[]): Uint8Array {
  if (shares.length < 2) throw new Error('Need at least 2 shares');
  const xs = new Set(shares.map((s) => s.x));
  if (xs.size !== shares.length) throw new Error('Duplicate share indices');
  const len = shares[0].data.length;
  if (shares.some((s) => s.data.length !== len)) {
    throw new Error('Share length mismatch — shares are not from the same secret');
  }

  const secret = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    let acc = 0;
    for (let j = 0; j < shares.length; j++) {
      // Lagrange basis at x=0
      let basis = 1;
      for (let m = 0; m < shares.length; m++) {
        if (m === j) continue;
        basis = gfMul(basis, gfMul(shares[m].x, gfInv(shares[m].x ^ shares[j].x)));
      }
      acc ^= gfMul(shares[j].data[i], basis);
    }
    secret[i] = acc;
  }
  return secret;
}

/**
 * Combine and verify against a known SHA-256 digest (hex) of the secret.
 * Addresses caveat 1: detects corrupted/forged shares instead of silently
 * returning garbage. Returns null on verification failure.
 */
export async function combineSharesAndVerify(
  shares: Share[],
  expectedSha256Hex: string,
): Promise<Uint8Array | null> {
  try {
    const secret = combineShares(shares);
    const buf = secret.buffer.slice(
      secret.byteOffset,
      secret.byteOffset + secret.byteLength,
    ) as ArrayBuffer;
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex === expectedSha256Hex ? secret : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// base64 helpers (browser + Node safe)
// ---------------------------------------------------------------------------

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(bytes).toString('base64');
}

export function base64ToUint8(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}
