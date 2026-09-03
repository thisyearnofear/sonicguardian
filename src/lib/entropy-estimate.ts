/**
 * Effective Secret Entropy Estimator (DIRECTION.md M4)
 *
 * The security of a sonic secret is NOT the SHA-256 output length (always 256
 * bits) — it is the size of the *reachable pattern space* the secret was drawn
 * from. An attacker who can enumerate candidate patterns offline can hash each
 * one and recover the DNA hash (which is used as an ECDSA private key) by
 * testing signatures against the on-chain public key. The on-chain blinding
 * factor prevents commitment matching but does nothing against offline key
 * search.
 *
 * This module computes a conservative estimate of log2(reachable space) for a
 * pattern and exposes a registration gate: patterns below MIN_SECRET_BITS must
 * not be registrable as a sole recovery factor.
 *
 * The model is intentionally conservative: where the true space is unknown
 * (AI-generated patterns), we estimate from the discrete dimensions the
 * generators actually vary, using an upper bound on attacker cost. Update the
 * model as generators evolve — and prefer measured data wherever possible
 * (see docs/RECALL_STUDY.md).
 */

/** Registration gate: minimum user-contributed secret bits (DIRECTION.md M4). */
export const MIN_SECRET_BITS = 128;

/** Below this the pattern is considered trivially brute-forceable. */
export const BRUTEFORCEABLE_BITS = 80;

export type SecretMode = 'random' | 'library' | 'vibe' | 'custom';

export interface EntropyBreakdownItem {
  /** Human-readable dimension name, e.g. "drum sequence". */
  dimension: string;
  /** log2 of the number of reachable values on this dimension. */
  bits: number;
  /** How this number was derived. */
  basis: 'measured' | 'modelled' | 'declared';
  note?: string;
}

export interface EntropyEstimate {
  bits: number;
  breakdown: EntropyBreakdownItem[];
  verdict: 'sufficient' | 'weak' | 'brute-forceable';
  /** UX-ready explanation of the verdict. */
  message: string;
}

// ---------------------------------------------------------------------------
// Known generator spaces
// ---------------------------------------------------------------------------

/**
 * Number of curated library patterns exposed in the mint wizard.
 * NOTE: the full library is public in this repo, so every choice is
 * enumerable by an attacker. A curated pattern is a *name*, not a secret.
 */
export const LIBRARY_PATTERN_COUNT = 40;

/**
 * Distinct templates the deterministic fallback generator can emit
 * (getTemplateVibe in entropy-encoder.ts): techno / ambient / acid /
 * generic. Public code = public space.
 */
export const TEMPLATE_VARIANT_COUNT = 4;

/**
 * Bits consumed by the chunk encoder path ('random' mode): 32 bytes of
 * CSPRNG entropy are generated, but the encoding tables in
 * entropy-encoder.ts surface at most ~120 bits into audible dimensions.
 */
export const RANDOM_MODE_CONSUMED_BITS = 120;

// ---------------------------------------------------------------------------
// Modelled estimator for raw Strudel code (vibe / custom modes)
// ---------------------------------------------------------------------------

interface PatternFeatures {
  layers: number;
  distinctSynths: number;
  distinctTokens: number;
  steps: number;
  hasTempo: boolean;
}

function extractFeatures(code: string): PatternFeatures {
  const layers = (code.match(/\.s\(|\.note\(|\bnote\(|\bs\(/g) ?? []).length;
  const synths = new Set<string>();
  const tokens = new Set<string>();
  let steps = 1;
  for (const m of code.matchAll(/\.s\("([^"]+)"\)/g)) synths.add(m[1]);
  for (const m of code.matchAll(/"([^"]*)"/g)) {
    const parts = m[1].split(/\s+/).filter(Boolean);
    if (parts.length > steps) steps = parts.length;
    for (const t of parts) {
      if (t && !/^[~<>[\]x.-]+$/.test(t)) tokens.add(t);
    }
  }
  return {
    layers: Math.max(layers, 1),
    distinctSynths: synths.size,
    distinctTokens: tokens.size,
    steps,
    hasTempo: /\.cpm\(\d+\)/.test(code),
  };
}

/**
 * Modelled reachable space of the *generators* that could have produced this
 * code. Deliberately generous to the defender (upper bound on attacker cost):
 * we assume every synth, every note in 2 octaves, every rhythm placement and
 * every tempo was reachable — reality is narrower, so real entropy is equal
 * or lower.
 */
export function estimatePatternEntropy(code: string): EntropyEstimate {
  const f = extractFeatures(code);
  const breakdown: EntropyBreakdownItem[] = [];

  // Sound choice: up to 16 reachable sounds (4 bits) per layer
  breakdown.push({
    dimension: 'sound choices',
    bits: Math.min(f.distinctSynths || 1, 4) * 4 * f.layers,
    basis: 'modelled',
    note: `${f.layers} layer(s), 16 reachable sounds each`,
  });

  // Note / token choice: 2 octaves × 12 semitones ≈ 4.6 bits per distinct token
  breakdown.push({
    dimension: 'note/token choices',
    bits: f.distinctTokens * 4.6,
    basis: 'modelled',
    note: `${f.distinctTokens} distinct token(s) at 4.6 bits (24 reachable notes) each`,
  });

  // Rhythm arrangement: on/off per step per layer
  breakdown.push({
    dimension: 'rhythm placement',
    bits: f.steps * f.layers,
    basis: 'modelled',
    note: `${f.steps} steps × ${f.layers} layer(s)`,
  });

  // Tempo: 80–180 BPM, 1 BPM resolution
  if (f.hasTempo) {
    breakdown.push({
      dimension: 'tempo',
      bits: Math.log2(101),
      basis: 'modelled',
      note: '80–180 BPM range',
    });
  }

  return finalize(breakdown);
}

// ---------------------------------------------------------------------------
// Declared / known-space estimators
// ---------------------------------------------------------------------------

/** 'random' mode: CSPRNG entropy routed through the chunk encoder. */
export function estimateRandomModeEntropy(): EntropyEstimate {
  return finalize([
    {
      dimension: 'CSPRNG entropy consumed by chunk encoding',
      bits: RANDOM_MODE_CONSUMED_BITS,
      basis: 'declared',
      note: `32 bytes of CSPRNG entropy generated; ~${RANDOM_MODE_CONSUMED_BITS} bits surface in audible chunk dimensions (see entropy-encoder.ts tables)`,
    },
  ]);
}

/** 'library' mode: the library ships in this repo, so the space = its size. */
export function estimateLibraryModeEntropy(): EntropyEstimate {
  return finalize([
    {
      dimension: 'public library choice',
      bits: Math.log2(LIBRARY_PATTERN_COUNT),
      basis: 'modelled',
      note: `${LIBRARY_PATTERN_COUNT} public entries — fully enumerable by an attacker`,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

export function assessSecretEntropy(
  mode: SecretMode,
  code?: string,
): EntropyEstimate {
  switch (mode) {
    case 'random':
      return estimateRandomModeEntropy();
    case 'library':
      return estimateLibraryModeEntropy();
    case 'vibe':
    case 'custom':
      return code
        ? estimatePatternEntropy(code)
        : {
            bits: 0,
            breakdown: [],
            verdict: 'brute-forceable',
            message: 'No pattern provided to estimate.',
          };
  }
}

function finalize(breakdown: EntropyBreakdownItem[]): EntropyEstimate {
  const raw = breakdown.reduce((sum, b) => sum + b.bits, 0);
  // Modelled dimensions are correlated (a generator that picks few notes also
  // picks few rhythms), so apply an honest 0.9 correlation discount when any
  // modelled component is present. Declared (CSPRNG) sums stand as-is.
  const modelled = breakdown.some((b) => b.basis === 'modelled');
  const effective = Math.floor((modelled ? raw * 0.9 : raw) * 10) / 10;

  if (effective < BRUTEFORCEABLE_BITS) {
    return {
      bits: effective,
      breakdown,
      verdict: 'brute-forceable',
      message:
        `This secret's pattern space is ~2^${effective} — offline brute force is feasible, ` +
        `and the DNA hash acts directly as a signing key. It cannot be registered as a sole recovery factor. ` +
        `Curated patterns and simple vibes are for demos only — use a random pattern for a real secret.`,
    };
  }
  if (effective < MIN_SECRET_BITS) {
    return {
      bits: effective,
      breakdown,
      verdict: 'weak',
      message:
        `This secret carries ~${effective} effective bits (minimum: ${MIN_SECRET_BITS}). ` +
        `Acceptable only as one share in a multi-factor split — not as the sole secret.`,
    };
  }
  return {
    bits: effective,
    breakdown,
    verdict: 'sufficient',
    message: `~${effective} effective bits — meets the ${MIN_SECRET_BITS}-bit minimum.`,
  };
}
