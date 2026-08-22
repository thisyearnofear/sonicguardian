'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useNetwork } from '@starknet-react/core';
import { mainnet } from '@starknet-react/chains';
import type { WalletAccountV6 } from 'starknet';
import type { WalletWithStarknetFeatures } from '@starknet-io/get-starknet-wallet-standard/features';
import {
  DEMO_TRANSFER_WEI,
  REGISTRATION_FEE_WEI,
  getStrk20Provider,
  loadRecordedTxHashes,
  recordTxHash,
} from '@/lib/strk20/constants';
import {
  connectWalletAccount,
  discoverWallets,
  getShieldedBalances,
  privateTransferStrk,
  probeStrk20Support,
  shieldStrk,
  waitForStrk20Tx,
} from '@/lib/strk20/client';

export type Strk20Status = 'idle' | 'connecting' | 'ready' | 'pending' | 'error';

export function useStrk20() {
  const { address, status: accountStatus } = useAccount();
  const { chain } = useNetwork();
  const isMainnet = chain?.id === mainnet.id;

  const [walletAccount, setWalletAccount] = useState<WalletAccountV6 | undefined>();
  const [wallets, setWallets] = useState<WalletWithStarknetFeatures[]>([]);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Strk20Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [shieldedBalance, setShieldedBalance] = useState<string | null>(null);
  const [txHashes, setTxHashes] = useState<string[]>([]);

  useEffect(() => {
    setTxHashes(loadRecordedTxHashes());
  }, []);

  useEffect(() => {
    let cancelled = false;
    discoverWallets().then((found) => {
      if (!cancelled) setWallets(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connectPrivacyWallet = useCallback(
    async (wallet: WalletWithStarknetFeatures) => {
      setStatus('connecting');
      setError(null);
      try {
        const provider = getStrk20Provider(isMainnet);
        const account = await connectWalletAccount(provider, wallet);
        const hasSupport = await probeStrk20Support(wallet);
        setSupported(hasSupport);
        setWalletAccount(account);
        setStatus(hasSupport ? 'ready' : 'error');
        if (!hasSupport) {
          setError('This wallet does not support STRK20 yet. Try Ready (formerly Argent) on mainnet.');
        }
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Wallet connection failed');
      }
    },
    [isMainnet],
  );

  const refreshBalances = useCallback(async () => {
    if (!walletAccount || !supported) return;
    try {
      const balances = await getShieldedBalances(walletAccount);
      const strk = balances.find((b) => b.balance !== '0x0' && b.balance !== '0');
      setShieldedBalance(strk?.balance ?? null);
    } catch {
      setShieldedBalance(null);
    }
  }, [walletAccount, supported]);

  useEffect(() => {
    if (walletAccount && supported) {
      refreshBalances();
    }
  }, [walletAccount, supported, refreshBalances]);

  const runAction = useCallback(
    async (label: string, action: () => Promise<string>) => {
      if (!walletAccount) {
        setError('Connect a privacy-enabled wallet first.');
        return null;
      }
      if (!isMainnet) {
        setError('STRK20 pool actions require Starknet mainnet.');
        return null;
      }
      setStatus('pending');
      setError(null);
      try {
        const hash = await action();
        const provider = getStrk20Provider(true);
        await waitForStrk20Tx(provider, hash);
        const recorded = recordTxHash(hash);
        setTxHashes(recorded);
        setStatus('ready');
        await refreshBalances();
        return hash;
      } catch (e) {
        setStatus('error');
        const msg = e instanceof Error ? e.message : `${label} failed`;
        setError(msg);
        return null;
      }
    },
    [walletAccount, isMainnet, refreshBalances],
  );

  const shieldRegistrationFee = useCallback(
    () => runAction('Shield', () => shieldStrk(walletAccount!, REGISTRATION_FEE_WEI)),
    [runAction, walletAccount],
  );

  const demoPrivateTransfer = useCallback(() => {
    if (!address) {
      setError('Connect your Starknet wallet first (recipient = your address).');
      return Promise.resolve(null);
    }
    return runAction('Private transfer', () =>
      privateTransferStrk(walletAccount!, DEMO_TRANSFER_WEI, address),
    );
  }, [runAction, walletAccount, address]);

  return {
    isMainnet,
    isWalletConnected: accountStatus === 'connected',
    address,
    wallets,
    walletAccount,
    supported,
    status,
    error,
    shieldedBalance,
    txHashes,
    connectPrivacyWallet,
    shieldRegistrationFee,
    demoPrivateTransfer,
    refreshBalances,
    registrationFeeStr: '0.1 STRK',
    transferAmountStr: '0.01 STRK',
  };
}
