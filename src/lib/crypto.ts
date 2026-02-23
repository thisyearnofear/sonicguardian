/**
 * Cryptographic utilities for Sonic Guardian
 * Implements Pedersen commitments for zero-knowledge proofs
 */

/**
 * Compute Pedersen hash (simplified client-side version)
 * In production, this should use the exact same hash function as Cairo's pedersen
 * For now, we use SHA-256 as a placeholder that will be replaced with proper Pedersen
 * 
 * @param a - First input (DNA hash or blinding factor)
 * @param b - Second input (blinding factor or blinding factor)
 * @returns Pedersen hash as hex string
 */
export async function pedersen(a: string, b: string): Promise<string> {
    // Remove 0x prefix if present
    const cleanA = a.replace(/^0x/, '');
    const cleanB = b.replace(/^0x/, '');
    
    // Concatenate inputs
    const combined = cleanA + cleanB;
    
    // Use Web Crypto API for hashing
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback for non-secure contexts
    return simpleHash(combined);
}

/**
 * Generate a cryptographically secure blinding factor
 * @returns Random blinding factor as hex string
 */
export function generateBlinding(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback (not cryptographically secure, for development only)
    return Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
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
