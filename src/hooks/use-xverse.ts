'use client';

import { useState, useCallback, useEffect } from 'react';
import Wallet, { AddressPurpose } from 'sats-connect';

interface XverseAddressItem {
  address: string;
  publicKey: string;
  purpose: string;
  addressType: string;
  walletType: string;
}

export interface XverseAddress {
  address: string;
  purpose: 'payment' | 'ordinals';
}

export interface UseXverseResult {
  addresses: XverseAddress[];
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

export function useXverse(): UseXverseResult {
  const [addresses, setAddresses] = useState<XverseAddress[]>([]);
  const [isConnectedState, setIsConnectedState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAddresses = (result: unknown): XverseAddress[] => {
    const data = result as { addresses: XverseAddressItem[] };
    if (!data.addresses) return [];
    return data.addresses
      .filter((addr) => addr.purpose === 'payment' || addr.purpose === 'ordinals')
      .map((addr) => ({
        address: addr.address,
        purpose: addr.purpose as 'payment' | 'ordinals',
      }));
  };

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await Wallet.request('getAddresses', {
        purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
        message: 'Sonic Guardian needs your BTC addresses',
      });
      
      if (response.status === 'success' && response.result) {
        const addrs = processAddresses(response.result);
        setAddresses(addrs);
        setIsConnectedState(addrs.length > 0);
      } else {
        setAddresses([]);
        setIsConnectedState(false);
      }
    } catch (err) {
      console.error('Failed to get Xverse addresses:', err);
      setAddresses([]);
      setIsConnectedState(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

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
      } else {
        setError('Connection rejected or failed');
        setAddresses([]);
        setIsConnectedState(false);
      }
    } catch (err) {
      console.error('Xverse connection error:', err);
      setError('Failed to connect to Xverse wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddresses([]);
    setIsConnectedState(false);
  }, []);

  return {
    addresses,
    isConnected: isConnectedState,
    isLoading,
    connect,
    disconnect,
    error,
  };
}
