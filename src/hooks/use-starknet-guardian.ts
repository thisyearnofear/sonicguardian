'use client';

import { useAccount, useContract, useSendTransaction } from '@starknet-react/core';
import { abi } from '@/lib/abi';
import { pedersen, isValidBtcAddress, isValidHex, hashStringToFelt, hexToFelt, getAcousticPublicKey, signWithAcousticKey } from '@/lib/crypto';
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
     * Register a Bitcoin guardian with Pedersen commitment and Acoustic Public Key.
     *
     * Privacy: only the Pedersen commitment and acoustic public key are stored on-chain.
     * The blinding_commitment parameter is kept in the ABI for backwards compat but
     * is NOT stored — the contract no longer exposes blinding factors.
     *
     * @param btcAddress - Bitcoin address to protect
     * @param dnaHash - SHA-256 hash of the musical pattern (client-side)
     * @param blinding - Random blinding factor used in the Pedersen commitment
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

            // 2. Compute Pedersen commitment: P = pedersen(dna_hash, blinding)
            const commitment = await pedersen(feltDnaHash, feltBlinding);

            // 3. Derive Acoustic Public Key (ZK anchor) from DNA hash via safe KDF
            const acousticKey = await getAcousticPublicKey(dnaHash);

            // 4. Register — note: blindingCommitment is accepted by ABI for compat
            //    but the contract no longer stores it on-chain.
            const result = await sendAsync([
                contract.populate('register_guardian', [
                    feltBtcAddress,
                    hexToFelt(commitment),
                    hexToFelt(commitment), // blindingCommitment: deprecated, pass commitment for compat
                    hexToFelt(acousticKey)
                ]),
            ]);

            return result;
        } catch (error) {
            console.error('Registration failed:', error);
            throw new BaseAPIError('Failed to register guardian', 'REGISTRATION_FAILED', 500);
        }
    };

    /**
     * Verify recovery via Acoustic Signature (Zero-Knowledge)
     */
    const verifyAcousticProof = async (
        btcAddress: string,
        dnaHash: string,
        message: string
    ): Promise<boolean> => {
        try {
            if (!contract) return false;
            
            const feltBtcAddress = await hashStringToFelt(btcAddress);
            const messageHash = hexToFelt(message); // Message to sign
            
            // Generate signature off-chain using DNA as private key (safe KDF)
            const signature = await signWithAcousticKey(dnaHash, messageHash);
            
            // Extract r and s correctly from Signature type
            let r, s;
            if (Array.isArray(signature)) {
                r = signature[0];
                s = signature[1];
            } else if ('r' in signature && 's' in signature) {
                r = (signature as any).r;
                s = (signature as any).s;
            } else {
                throw new Error('Unsupported signature format');
            }

            // @ts-ignore
            return await contract.verify_acoustic_signature(
                feltBtcAddress, 
                messageHash, 
                hexToFelt(r.toString(16)), 
                hexToFelt(s.toString(16))
            );
        } catch (error) {
            console.error('Acoustic proof failed:', error);
            return false;
        }
    };

    /**
     * Authorize recovery via Acoustic Signature (True ZK)
     * The only remaining on-chain authorization path.
     */
    const authorizeWithAcousticSignature = async (
        btcAddress: string,
        dnaHash: string
    ) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
            const feltBtcAddress = await hashStringToFelt(btcAddress);
            
            // Create a unique message hash for this authorization (BTC address + timestamp)
            const message = await hashStringToFelt(`${btcAddress}:${Date.now()}`);
            
            // Sign with Acoustic Key (safe KDF)
            const signature = signWithAcousticKey(dnaHash, message);

            // Extract r and s correctly from Signature type
            let r, s;
            if (Array.isArray(signature)) {
                r = signature[0];
                s = signature[1];
            } else if ('r' in signature && 's' in signature) {
                r = (signature as any).r;
                s = (signature as any).s;
            } else {
                throw new Error('Unsupported signature format');
            }

            const result = await sendAsync([
                contract.populate('authorize_with_acoustic_signature', [
                    feltBtcAddress,
                    message,
                    hexToFelt(r.toString(16)),
                    hexToFelt(s.toString(16))
                ]),
            ]);

            return result;
        } catch (error) {
            console.error('Acoustic authorization failed:', error);
            throw new BaseAPIError('Failed to authorize with acoustic proof', 'AUTHORIZATION_FAILED', 500);
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

    return {
        address,
        status,
        registerGuardian,
        authorizeWithAcousticSignature,
        verifyAcousticProof,
        getCommitment,
        getGuardianCount,
        isConnected: status === 'connected',
    };
}
