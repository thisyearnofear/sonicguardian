'use client';

import { useAccount, useContract, useSendTransaction } from '@starknet-react/core';
import { abi } from '../lib/abi';
import { pedersen } from '../lib/crypto';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SONIC_GUARDIAN_ADDRESS || '0x0';

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
     * Register a Bitcoin guardian with Pedersen commitment
     * @param btcAddress - Bitcoin address to guard
     * @param dnaHash - Acoustic DNA hash
     * @param blinding - Blinding factor for commitment
     */
    const registerGuardian = async (
        btcAddress: string,
        dnaHash: string,
        blinding: string
    ) => {
        if (!address || !contract) {
            throw new Error('Wallet not connected or contract not initialized');
        }

        // Compute Pedersen commitment client-side
        const commitment = await pedersen(dnaHash, blinding);
        const blindingCommitment = await pedersen(blinding, blinding); // Commit to blinding

        // Convert to felt252 (mod prime field)
        const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
        const feltBtcAddress = (BigInt('0x' + btcAddress.replace(/^0x/, '')) % MODULO).toString();
        const feltCommitment = (BigInt('0x' + commitment) % MODULO).toString();
        const feltBlindingCommitment = (BigInt('0x' + blindingCommitment) % MODULO).toString();

        return await sendAsync([
            contract.populate('register_guardian', [
                feltBtcAddress,
                feltCommitment,
                feltBlindingCommitment
            ]),
        ]);
    };

    /**
     * Verify recovery proof (read-only, no transaction)
     * @param btcAddress - Bitcoin address
     * @param dnaHash - Acoustic DNA hash
     * @param blinding - Blinding factor
     */
    const verifyRecovery = async (
        btcAddress: string,
        dnaHash: string,
        blinding: string
    ): Promise<boolean> => {
        if (!contract) return false;

        const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
        const feltBtcAddress = (BigInt('0x' + btcAddress.replace(/^0x/, '')) % MODULO).toString();
        const feltDnaHash = (BigInt('0x' + dnaHash) % MODULO).toString();
        const feltBlinding = (BigInt('0x' + blinding) % MODULO).toString();

        try {
            // @ts-ignore - Cairo view function
            const result = await contract.verify_recovery(
                feltBtcAddress,
                feltDnaHash,
                feltBlinding
            );
            return result;
        } catch (e) {
            console.error('Verification failed:', e);
            return false;
        }
    };

    /**
     * Authorize Bitcoin recovery (creates authorization token)
     * @param btcAddress - Bitcoin address
     * @param dnaHash - Acoustic DNA hash
     * @param blinding - Blinding factor
     */
    const authorizeBtcRecovery = async (
        btcAddress: string,
        dnaHash: string,
        blinding: string
    ) => {
        if (!address || !contract) {
            throw new Error('Wallet not connected or contract not initialized');
        }

        const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
        const feltBtcAddress = (BigInt('0x' + btcAddress.replace(/^0x/, '')) % MODULO).toString();
        const feltDnaHash = (BigInt('0x' + dnaHash) % MODULO).toString();
        const feltBlinding = (BigInt('0x' + blinding) % MODULO).toString();

        return await sendAsync([
            contract.populate('authorize_btc_recovery', [
                feltBtcAddress,
                feltDnaHash,
                feltBlinding
            ]),
        ]);
    };

    /**
     * Get commitment for a Bitcoin address (read-only)
     */
    const getCommitment = async (btcAddress: string): Promise<string | null> => {
        if (!contract) return null;

        const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
        const feltBtcAddress = (BigInt('0x' + btcAddress.replace(/^0x/, '')) % MODULO).toString();

        try {
            // @ts-ignore - Cairo view function
            const result = await contract.get_commitment(feltBtcAddress);
            return result.toString();
        } catch (e) {
            console.error('Failed to get commitment:', e);
            return null;
        }
    };

    return {
        address,
        status,
        registerGuardian,
        verifyRecovery,
        authorizeBtcRecovery,
        getCommitment,
        isConnected: status === 'connected',
    };
}

