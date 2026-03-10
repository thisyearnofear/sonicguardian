/**
 * Cryptographic utilities for Sonic Guardian
 * Implements Pedersen commitments for zero-knowledge proofs
 * and AES-GCM for secure backups.
 */

import { hash, ec, Signature } from 'starknet';

/**
 * Acoustic Key Derivation (AKD)
 * Derives a deterministic Starknet public key from a Sonic DNA hash.
 * This allows the musical identity to act as a private key without ever revealing it.
 */
export function getAcousticPublicKey(dnaHash: string): string {
    const privateKey = hexToFelt(dnaHash);
    return ec.starkCurve.getStarkKey(privateKey);
}

/**
 * Sign a message using the derived acoustic key (Private Key = DNA Hash)
 * Returns a signature that proves knowledge of the DNA without revealing it.
 */
export function signWithAcousticKey(dnaHash: string, messageHash: string): Signature {
    const privateKey = hexToFelt(dnaHash);
    return ec.starkCurve.sign(messageHash, privateKey);
}

/**
 * Compute Pedersen hash (Standard Starknet version)
 */
export async function pedersen(a: string, b: string): Promise<string> {
    try {
        if (!a || !b || typeof a !== 'string' || typeof b !== 'string') {
            throw new Error('Invalid inputs: both parameters must be non-empty strings');
        }

        const cleanA = a.startsWith('0x') ? a : '0x' + a;
        const cleanB = b.startsWith('0x') ? b : '0x' + b;
        
        const result = hash.computePedersenHash(cleanA, cleanB);
        return result.replace(/^0x/, '');
    } catch (error) {
        console.error('Failed to compute Pedersen hash:', error);
        throw error;
    }
}

/**
 * Generate a cryptographically secure blinding factor
 */
export function generateBlinding(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    throw new Error('Secure random number generator not available.');
}

/**
 * AES-GCM Encryption
 * Securely encrypts data using a derived key
 */
export async function encryptData(data: string, keyStr: string): Promise<string> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    
    // Convert hex key string to CryptoKey
    const keyData = encoder.encode(keyStr.slice(0, 32)); // Use first 32 chars for 256-bit key
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as Base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * AES-GCM Decryption
 */
export async function decryptData(encryptedBase64: string, keyStr: string): Promise<string> {
    const combined = new Uint8Array(
        atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyStr.slice(0, 32));
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Derive an encryption key from a wallet signature
 * This ensures the key is deterministic for the user but never leaves their wallet
 */
export async function deriveKeyFromSignature(signature: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(signature);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert a generic string (e.g. BTC address) to a felt252 deterministically.
 * Uses SHA-256 and applies MODULO.
 */
export async function hashStringToFelt(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexToFelt(hex);
}

/**
 * Convert hex string to felt252
 */
export function hexToFelt(hex: string): string {
    const MODULO = BigInt("0x800000000000011000000000000000000000000000000000000000000000001");
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    try {
        return (BigInt('0x' + clean) % MODULO).toString();
    } catch {
        // Fallback for non-hex strings if accidentally passed
        return "0";
    }
}


/**
 * Basic Bitcoin address validation
 */
export function isValidBtcAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    const p2pkhRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const bech32Regex = /^(bc1)[a-z0-9]{39,87}$/;
    return p2pkhRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address);
}

/**
 * Validate that a value is a valid hex string
 * @param value - String to validate
 * @returns true if valid hex
 */
export function isValidHex(value: string): boolean {
    try {
        if (!value || typeof value !== 'string') return false;
        const clean = value.replace(/^0x/, '');
        return /^[0-9a-fA-F]+$/.test(clean) && clean.length > 0;
    } catch (error) {
        console.error('Failed to validate hex value:', error);
        return false;
    }
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
