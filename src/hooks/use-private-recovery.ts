'use client';

import { useCallback, useState } from 'react';
import { useAccount, useNetwork } from '@starknet-react/core';
import { mainnet } from '@starknet-react/chains';
import { buildAcousticAuthorization } from '@/lib/sonic-authorization';
import {
  getRecoveryHelperAddress,
  submitPrivateRecoveryAuthorization,
} from '@/lib/strk20/recovery-oracle';
import { useStrk20 } from '@/hooks/use-strk20';

export function usePrivateRecovery() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const isMainnet = chain?.id === mainnet.id;
  const { walletAccount, supported, connectPrivacyWallet, wallets } = useStrk20();

  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const helperDeployed = Boolean(getRecoveryHelperAddress());

  const authorizePrivately = useCallback(
    async (btcAddress: string, dnaHash: string, acousticSecret?: string) => {
      if (!isMainnet) {
        setError('Private recovery authorization requires Starknet mainnet.');
        setStatus('error');
        return null;
      }
      if (!address) {
        setError('Connect your Starknet wallet first.');
        setStatus('error');
        return null;
      }
      if (!walletAccount || !supported) {
        setError('Connect a privacy-enabled wallet for STRK20 actions.');
        setStatus('error');
        return null;
      }
      if (!helperDeployed) {
        setError('Recovery helper contract not configured yet.');
        setStatus('error');
        return null;
      }

      setStatus('pending');
      setError(null);
      try {
        const auth = await buildAcousticAuthorization(btcAddress, dnaHash, undefined, acousticSecret);
        const hash = await submitPrivateRecoveryAuthorization(walletAccount, address, auth);
        setTxHash(hash);
        setStatus('success');
        return hash;
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Private authorization failed');
        return null;
      }
    },
    [isMainnet, address, walletAccount, supported, helperDeployed],
  );

  return {
    isMainnet,
    helperDeployed,
    status,
    error,
    txHash,
    wallets,
    walletAccount,
    supported,
    connectPrivacyWallet,
    authorizePrivately,
  };
}
