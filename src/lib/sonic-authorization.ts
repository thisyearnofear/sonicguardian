import { signWithAcousticKey, hashStringToFelt, hexToFelt } from '@/lib/crypto';

export interface AcousticAuthorizationPayload {
  btcFelt: string;
  messageHash: string;
  signatureR: string;
  signatureS: string;
}

export async function buildAcousticAuthorization(
  btcAddress: string,
  dnaHash: string,
  messageSeed?: string,
): Promise<AcousticAuthorizationPayload> {
  const btcFelt = await hashStringToFelt(btcAddress);
  const messageHash = messageSeed
    ? await hashStringToFelt(messageSeed)
    : await hashStringToFelt(`${btcAddress}:sonic-recovery:${Date.now()}`);

  const signature = signWithAcousticKey(dnaHash, messageHash);

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
  };
}
