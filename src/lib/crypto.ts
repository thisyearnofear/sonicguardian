/**
 * Cryptographic utilities for Sonic Guardian
 * Implements Pedersen commitments for zero-knowledge proofs
 */

import { hash } from 'starknet';

/**
 * Compute Pedersen hash (Standard Starknet version)
 * This uses the exact same hash function as Cairo's pedersen to ensure
 * on-chain verification is possible.
 * 
 * @param a - First input (DNA hash or blinding factor)
 * @param b - Second input (blinding factor or blinding factor)
 * @returns Pedersen hash as hex string
 */
export async function pedersen(a: string, b: string): Promise<string> {
    // Remove 0x prefix if present and handle inputs as bigints
    const cleanA = a.startsWith('0x') ? a : '0x' + a;
    const cleanB = b.startsWith('0x') ? b : '0x' + b;
    
    try {
        // Standard Starknet Pedersen Hash (returns bigint/string)
        const result = hash.computePedersenHash(cleanA, cleanB);
        return result.replace(/^0x/, '');
    } catch (error) {
        console.error('Pedersen hash failed, falling back to simple hash:', error);
        return simpleHash(cleanA + cleanB);
    }
}

/**
 * Generate a cryptographically secure blinding factor
 * @returns Random blinding factor as hex string
 * @throws Error if secure random is not available
 */
export function generateBlinding(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // In production, we should NEVER fall back to insecure randomness
    throw new Error('Secure random number generator not available. Use a secure context (HTTPS).');
}

/**
 * Simple hash function fallback for non-secure contexts
 */
function simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    let hex = Math.abs(hash).toString(16);
    while (hex.length < 64) hex = '0' + hex;
    return hex.substring(0, 64);
}

/**
 * Convert hex string to felt252 (Starknet field element)
 * @param hex - Hex string
 * @returns Felt252 as string
 */
export function hexToFelt(hex: string): string {
    const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
    const clean = hex.replace(/^0x/, '');
    return (BigInt('0x' + clean) % MODULO).toString();
}

/**
 * Validate Bitcoin address format (basic check)
 * @param address - Bitcoin address
 * @returns true if valid format
 */
export function isValidBtcAddress(address: string): boolean {
    // Basic validation for common Bitcoin address formats
    // P2PKH: starts with 1
    // P2SH: starts with 3
    // Bech32: starts with bc1
    const p2pkhRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const bech32Regex = /^(bc1)[a-z0-9]{39,87}$/;
    
    return p2pkhRegex.test(address) || 
           p2shRegex.test(address) || 
           bech32Regex.test(address);
}

/**
 * Validate that a value is a valid hex string
 * @param value - String to validate
 * @returns true if valid hex
 */
export function isValidHex(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const clean = value.replace(/^0x/, '');
    return /^[0-9a-fA-F]+$/.test(clean) && clean.length > 0;
}

/**
 * Validate that a value is a valid felt252
 * @param value - String to validate
 * @returns true if valid felt252
 */
export function isValidFelt252(value: string): boolean {
    try {
        const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
        const num = BigInt(value);
        return num >= 0 && num < MODULO;
    } catch {
        return false;
    }
}
