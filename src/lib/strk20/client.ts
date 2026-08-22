import { WalletAccountV6, walletV6, num, type RpcProvider } from 'starknet';
import type { STRK20_ACTION } from '@starknet-io/types-js';
import type { WalletWithStarknetFeatures } from '@starknet-io/get-starknet-wallet-standard/features';
import { createStore } from '@starknet-io/get-starknet-discovery';
import { STRK_TOKEN_MAINNET, STRK20_MIN_WALLET_API } from './constants';

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function discoverWallets(): Promise<WalletWithStarknetFeatures[]> {
  const store = createStore({ eip1193Adapters: [] });
  return store.getWallets().slice();
}

export async function probeStrk20Support(
  wallet: WalletWithStarknetFeatures,
): Promise<boolean> {
  try {
    const versions = await walletV6.supportedWalletApi(wallet);
    return versions.some((v) => compareVersions(v, STRK20_MIN_WALLET_API) >= 0);
  } catch {
    return false;
  }
}

export async function connectWalletAccount(
  provider: RpcProvider,
  wallet: WalletWithStarknetFeatures,
): Promise<WalletAccountV6> {
  return WalletAccountV6.connect(provider, wallet);
}

export async function shieldStrk(
  account: WalletAccountV6,
  amountWei: bigint,
  token: string = STRK_TOKEN_MAINNET,
): Promise<string> {
  const actions: STRK20_ACTION[] = [
    { type: 'deposit', token, amount: num.toHex(amountWei) },
  ];
  const { transaction_hash } = await account.strk20InvokeTransaction(actions);
  return transaction_hash;
}

export async function privateTransferStrk(
  account: WalletAccountV6,
  amountWei: bigint,
  recipient: string,
  token: string = STRK_TOKEN_MAINNET,
): Promise<string> {
  const actions: STRK20_ACTION[] = [
    { type: 'transfer', token, amount: num.toHex(amountWei), recipient },
  ];
  const { transaction_hash } = await account.strk20InvokeTransaction(actions);
  return transaction_hash;
}

export async function getShieldedBalances(account: WalletAccountV6) {
  return account.strk20Balances([STRK_TOKEN_MAINNET]);
}

export async function waitForStrk20Tx(
  provider: RpcProvider,
  txHash: string,
): Promise<void> {
  await provider.waitForTransaction(txHash, {
    retries: 400,
    retryInterval: 3000,
  });
}
