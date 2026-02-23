'use client';

import { useAccount, useContract, useSendTransaction } from '@starknet-react/core';
import { abi } from '../lib/abi';

// Placeholder address for the deployed contract on Sepolia
const CONTRACT_ADDRESS = '0x05481d86d5e759247d9b939f82d1f953282b97c0f1c3f9a7d3e9a7d3e9a7d3e';

export function useStarknetGuardian() {
    const { address, status } = useAccount();
    const { contract } = useContract({
        abi: abi as any,
        address: CONTRACT_ADDRESS,
    });

    const { sendAsync } = useSendTransaction({
        calls: undefined,
    });

    const registerIdentity = async (commitment: string) => {
        if (!address || !contract) throw new Error('Wallet not connected or contract not initialized');

        // Using BigInt constructor with strings to avoid syntax errors in older TS targets/linters
        // that don't support the 'n' suffix.
        const MODULO = BigInt("0x800000000000000000000000000000000000000000000000000000000000000");
        const feltCommitment = (BigInt('0x' + commitment) % MODULO).toString();

        return await sendAsync([
            contract.populate('register_identity', [feltCommitment]),
        ]);
    };

    const verifyIdentity = async (proofHash: string) => {
        if (!contract || !address) return false;
        const MODULO = BigInt("0x800000000000000000000000000000000000000000000000000000000000000");
        const feltProof = (BigInt('0x' + proofHash) % MODULO).toString();
        try {
            // @ts-ignore - Cairo 1.0 view function call
            const result = await contract.verify_identity(address, feltProof);
            return result;
        } catch (e) {
            console.error('Verification failed:', e);
            return false;
        }
    };

    return {
        address,
        status,
        registerIdentity,
        verifyIdentity,
        isConnected: status === 'connected',
    };
}
