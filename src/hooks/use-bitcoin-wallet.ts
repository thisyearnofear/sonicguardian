'use client';

import { useState, useCallback } from 'react';
import Wallet, { AddressPurpose } from 'sats-connect';

interface BitcoinWalletAddressItem {
  address: string;
  publicKey: string;
  purpose: string;
  addressType: string;
  walletType: string;
}

export interface BitcoinWalletAddress {
  address: string;
  purpose: 'payment' | 'ordinals';
  walletType?: string;
}

export interface UseBitcoinWalletResult {
  addresses: BitcoinWalletAddress[];
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  walletName: string | null;
}

export function useBitcoinWallet(): UseBitcoinWalletResult {
  const [addresses, setAddresses] = useState<BitcoinWalletAddress[]>([]);
  const [isConnectedState, setIsConnectedState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);

  const processAddresses = (result: unknown): BitcoinWalletAddress[] => {
    const data = result as { addresses: BitcoinWalletAddressItem[] };
    if (!data.addresses) return [];
    return data.addresses
      .filter((addr) => addr.purpose === 'payment' || addr.purpose === 'ordinals')
      .map((addr) => ({
        address: addr.address,
        purpose: addr.purpose as 'payment' | 'ordinals',
        walletType: addr.walletType,
      }));
  };

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await Wallet.request('getAddresses', {
        purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
        message: 'Connect to Sonic Guardian',
      });

      if (response.status === 'success' && response.result) {
        const addrs = processAddresses(response.result);
        setAddresses(addrs);
        setIsConnectedState(addrs.length > 0);
        // Detect wallet type from first address
        if (addrs.length > 0) {
          const walletType = addrs[0].walletType || 'unknown';
          setWalletName(walletType.toLowerCase().includes('leather') ? 'Leather' : 
                       walletType.toLowerCase().includes('xverse') ? 'Xverse' : 'Bitcoin Wallet');
        }
      } else {
        setError('Connection rejected or failed');
        setAddresses([]);
        setIsConnectedState(false);
      }
    } catch (err) {
      console.error('Bitcoin wallet connection error:', err);
      setError('Failed to connect to Bitcoin wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddresses([]);
    setIsConnectedState(false);
    setWalletName(null);
    setError(null);
  }, []);

  return {
    addresses,
    isConnected: isConnectedState,
    isLoading,
    connect,
    disconnect,
    error,
    walletName,
  };
}
