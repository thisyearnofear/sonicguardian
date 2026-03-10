'use client';

import { useAccount, useContract, useSendTransaction } from '@starknet-react/core';
import { abi } from '@/lib/abi';
import { pedersen, isValidBtcAddress, isValidHex, hashStringToFelt, hexToFelt } from '@/lib/crypto';
import { BaseAPIError } from '@/lib/api';

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS || '0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de') as `0x${string}`;

export function useStarknetGuardian() {
    const { address, status } = useAccount();
    const { contract } = useContract({
        abi: abi as any,
        address: CONTRACT_ADDRESS,
    });

    const { sendAsync } = useSendTransaction({
        calls: undefined,
    });

    /**
     * Validate inputs before contract interaction
     */
    const validateInputs = (btcAddress: string, dnaHash: string, blinding: string) => {
        if (!address || !contract) {
            throw new BaseAPIError('Wallet not connected or contract not initialized', 'WALLET_NOT_CONNECTED', 400);
        }

        if (!isValidBtcAddress(btcAddress)) {
            throw new BaseAPIError('Invalid Bitcoin address format', 'INVALID_BTC_ADDRESS', 400);
        }

        if (!isValidHex(dnaHash)) {
            throw new BaseAPIError('Invalid DNA hash format', 'INVALID_DNA_HASH', 400);
        }

        if (!isValidHex(blinding)) {
            throw new BaseAPIError('Invalid blinding factor format', 'INVALID_BLINDING', 400);
        }
    };

    /**
     * Register a Bitcoin guardian with Pedersen commitment
     */
    const registerGuardian = async (
        btcAddress: string,
        dnaHash: string,
        blinding: string
    ) => {
        validateInputs(btcAddress, dnaHash, blinding);

        if (!contract) throw new Error('Contract not initialized');

        try {
            // 1. Normalize inputs to felts
            const feltBtcAddress = await hashStringToFelt(btcAddress);
            const feltDnaHash = hexToFelt(dnaHash);
            const feltBlinding = hexToFelt(blinding);

            // 2. Compute commitments (client-side matches Cairo pedersen_hash)
            const commitment = await pedersen(feltDnaHash, feltBlinding);
            const blindingCommitment = await pedersen(feltBlinding, feltBlinding);

            const result = await sendAsync([
                contract.populate('register_guardian', [
                    feltBtcAddress,
                    hexToFelt(commitment),
                    hexToFelt(blindingCommitment)
                ]),
            ]);

            return result;
        } catch (error) {
            console.error('Registration failed:', error);
            throw new BaseAPIError('Failed to register guardian', 'REGISTRATION_FAILED', 500);
        }
    };

    /**
     * Verify recovery proof (read-only)
     */
    const verifyRecovery = async (
        btcAddress: string,
        dnaHash: string,
        blinding: string
    ): Promise<boolean> => {
        try {
            validateInputs(btcAddress, dnaHash, blinding);
            if (!contract) throw new Error('Contract not initialized');

            const feltBtcAddress = await hashStringToFelt(btcAddress);
            const feltDnaHash = hexToFelt(dnaHash);
            const feltBlinding = hexToFelt(blinding);

            // @ts-ignore - Cairo view function
            return await contract.verify_recovery(feltBtcAddress, feltDnaHash, feltBlinding);
        } catch (error) {
            console.error('Verification failed:', error);
            return false;
        }
    };

    /**
     * Authorize Bitcoin recovery
     */
    const authorizeBtcRecovery = async (
        btcAddress: string,
        dnaHash: string,
        blinding: string
    ) => {
        validateInputs(btcAddress, dnaHash, blinding);
        if (!contract) throw new Error('Contract not initialized');

        try {
            const feltBtcAddress = await hashStringToFelt(btcAddress);
            const feltDnaHash = hexToFelt(dnaHash);
            const feltBlinding = hexToFelt(blinding);

            const result = await sendAsync([
                contract.populate('authorize_btc_recovery', [
                    feltBtcAddress,
                    feltDnaHash,
                    feltBlinding
                ]),
            ]);

            return result;
        } catch (error) {
            console.error('Authorization failed:', error);
            throw new BaseAPIError('Failed to authorize recovery', 'AUTHORIZATION_FAILED', 500);
        }
    };

    /**
     * Get commitment for a Bitcoin address (read-only)
     */
    const getCommitment = async (btcAddress: string): Promise<string | null> => {
        try {
            if (!isValidBtcAddress(btcAddress)) return null;
            if (!contract) return null;

            const feltBtcAddress = await hashStringToFelt(btcAddress);
            // @ts-ignore - Cairo view function
            const result = await contract.get_commitment(feltBtcAddress);
            return result.toString();
        } catch (error) {
            console.error('Failed to get commitment:', error);
            return null;
        }
    };

    /**
     * Get total number of guardians registered
     */
    const getGuardianCount = async (): Promise<number> => {
        try {
            if (!contract) return 0;

            // @ts-ignore - Cairo view function
            const result = await contract.get_guardian_count();
            return Number(result.low || result); // Handle u256 format
        } catch (error) {
            console.error('Failed to get guardian count:', error);
            return 0;
        }
    };

    /**
     * Create an on-chain Bitcoin gift vault
     */
    const createOnChainGift = async (
        vaultId: string,
        commitment: string,
        amount: bigint,
        tokenAddress: string
    ) => {
        if (!address || !contract) {
            throw new Error('Wallet not connected');
        }

        try {
            // Multi-call: Approve + Create Vault
            const result = await sendAsync([
                {
                    contractAddress: tokenAddress,
                    entrypoint: 'approve',
                    calldata: [CONTRACT_ADDRESS, amount.toString(), '0'] // u256 low, high
                },
                {
                    contractAddress: CONTRACT_ADDRESS,
                    entrypoint: 'create_onchain_gift',
                    calldata: [vaultId, commitment, amount.toString(), '0', tokenAddress]
                }
            ]);

            return result;
        } catch (error) {
            console.error('Failed to create on-chain gift:', error);
            throw error;
        }
    };

    /**
     * Claim an on-chain Bitcoin gift
     */
    const claimOnChainGift = async (
        vaultId: string,
        dnaHash: string,
        blinding: string,
        recipient: string
    ) => {
        if (!address || !contract) {
            throw new Error('Wallet not connected');
        }

        try {
            const feltDnaHash = hexToFelt(dnaHash);
            const feltBlinding = hexToFelt(blinding);

            const result = await sendAsync([
                contract.populate('claim_onchain_gift', [
                    vaultId,
                    feltDnaHash,
                    feltBlinding,
                    recipient
                ]),
            ]);

            return result;
        } catch (error) {
            console.error('Failed to claim on-chain gift:', error);
            throw error;
        }
    };

    return {
        address,
        status,
        registerGuardian,
        verifyRecovery,
        authorizeBtcRecovery,
        createOnChainGift,
        claimOnChainGift,
        getCommitment,
        getGuardianCount,
        isConnected: status === 'connected',
    };
}
