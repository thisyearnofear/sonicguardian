import { signWithSecret, signWithAcousticKey, hashStringToFelt, hexToFelt } from './crypto.ts';
import { hash } from 'starknet';

/**
 * Length of the on-chain freshness window for authorization messages (R7,
 * THREAT_MODEL_REVIEW.md). The contract recomputes the window end from
 * `block.timestamp` and rejects anything signed for an earlier window
 * ('SIG_EXPIRED'), so an intercepted (message_hash, signature) pair is
 * replayable at most until the end of the current window — never indefinitely.
 * Exported for tests.
 */
export const AUTHORIZATION_WINDOW_SECONDS = 15 * 60;

/**
 * Deadline used for the current authorization window: the END of the window
 * containing `nowMs` (unix seconds). Deterministic and recomputable on-chain —
 * the contract derives the identical value from `get_block_timestamp()`, so no
 * deadline needs to travel in calldata and the contract interface is
 * unchanged. The window bucket also means a user signing twice inside one
 * window produces the same message hash; that is the replay bound, by design.
 */
export function currentAuthorizationDeadline(nowMs: number = Date.now()): number {
  const nowSec = Math.floor(nowMs / 1000);
  return (Math.floor(nowSec / AUTHORIZATION_WINDOW_SECONDS) + 1) * AUTHORIZATION_WINDOW_SECONDS;
}

/**
 * The message committed to by an authorization signature:
 * `Poseidon(btcFelt, deadline)` — a pure function of the guardian identity
 * and the window deadline. Poseidon (not SHA-256) so the CONTRACT can
 * recompute the expected hash from (btc_address, block.timestamp) with
 * corelib's `poseidon_hash_many`; a SHA-256 message hash would be
 * unenforceable on-chain. Returns the '0x'-prefixed hex felt — the format
 * starknet's ECDSA sign (scure) requires for the message hash, and valid
 * calldata encoding.
 */
export function buildAcousticMessageHash(btcFelt: string, deadline: number): string {
  return hash.computePoseidonHashOnElements([BigInt(btcFelt), BigInt(deadline)]);
}

export interface AcousticAuthorizationPayload {
  btcFelt: string;
  messageHash: string;
  signatureR: string;
  signatureS: string;
  /**
   * Unix seconds after which the contract rejects this authorization
   * ('SIG_EXPIRED'): the end of the current AUTHORIZATION_WINDOW_SECONDS
   * window (R7). Informational client-side — the contract derives the same
   * value from block.timestamp.
   */
  deadline: number;
}

/**
 * True while the signed message is still acceptable on-chain. Callers check
 * this right before sending so a wallet prompt or RPC retry that straddles a
 * window boundary fails fast client-side instead of reverting on-chain.
 */
export function isAuthorizationFresh(payload: AcousticAuthorizationPayload): boolean {
  return Date.now() / 1000 <= payload.deadline;
}

/**
 * Build a fresh, window-deadline-bound acoustic authorization payload.
 *
 * Decoupled path: sign with the reconstructed random acoustic secret.
 * Legacy fallback (pre-decoupling guardians): pattern-derived key.
 */
export async function buildAcousticAuthorization(
  btcAddress: string,
  dnaHash: string,
  acousticSecret?: string,
): Promise<AcousticAuthorizationPayload> {
  const btcFelt = await hashStringToFelt(btcAddress);

  // R7 (THREAT_MODEL_REVIEW.md): bound replayability. The signature commits
  // to the current window deadline; the contract recomputes the identical
  // hash from block.timestamp and reverts with 'SIG_EXPIRED' once the window
  // has passed.
  const deadline = currentAuthorizationDeadline();
  const messageHash = buildAcousticMessageHash(btcFelt, deadline);

  // Decoupled path: sign with the reconstructed random acoustic secret.
  // Legacy fallback (pre-decoupling guardians): pattern-derived key.
  const signature = acousticSecret
    ? signWithSecret(acousticSecret, messageHash)
    : await signWithAcousticKey(dnaHash, messageHash);

  let r: bigint | string;
  let s: bigint | string;
  if (Array.isArray(signature)) {
    [r, s] = signature;
  } else if ('r' in signature && 's' in signature) {
    r = (signature as { r: bigint; s: bigint }).r;
    s = (signature as { r: bigint; s: bigint }).s;
  } else {
    throw new Error('Unsupported signature format');
  }

  return {
    btcFelt,
    messageHash,
    signatureR: hexToFelt(r.toString(16)),
    signatureS: hexToFelt(s.toString(16)),
    deadline,
  };
}
