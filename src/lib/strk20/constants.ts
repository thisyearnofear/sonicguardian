import { RpcProvider } from 'starknet';

/** Live STRK20 privacy pool on Starknet mainnet (verified Aug 2026). */
export const STRK20_MAINNET_POOL =
  '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a';

/** Native STRK ERC-20 on Starknet mainnet. */
export const STRK_TOKEN_MAINNET =
  '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

/** Minimum Wallet API version for STRK20 actions. */
export const STRK20_MIN_WALLET_API = '0.10.3';

/** Default private registration bond: 0.1 STRK (18 decimals). */
export const REGISTRATION_FEE_WEI = BigInt('100000000000000000');

/** Demo private transfer amount: 0.01 STRK. */
export const DEMO_TRANSFER_WEI = BigInt('10000000000000000');

export const STRK20_TX_STORAGE_KEY = 'sonicguardian_strk20_txs';

export function getStrk20Provider(isMainnet: boolean): RpcProvider {
  const url = isMainnet
    ? process.env.NEXT_PUBLIC_STARKNET_MAINNET_RPC || 'https://rpc.starknet.lava.build'
    : process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC ||
      'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
  return new RpcProvider({ nodeUrl: url });
}

export function loadRecordedTxHashes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STRK20_TX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === 'string') : [];
  } catch {
    return [];
  }
}

export function recordTxHash(hash: string): string[] {
  const existing = loadRecordedTxHashes();
  if (existing.includes(hash)) return existing;
  const next = [...existing, hash];
  localStorage.setItem(STRK20_TX_STORAGE_KEY, JSON.stringify(next));
  return next;
}
