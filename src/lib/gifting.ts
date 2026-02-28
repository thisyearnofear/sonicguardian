import { pedersen, generateBlinding } from './crypto';
import { extractSonicDNA } from './dna';

export interface GiftVault {
  id: string;
  sender: string;
  amount: string; // in BTC
  commitment: string;
  blinding: string; // Stored client-side for the sender (or passed to recipient)
  status: 'locked' | 'claimed' | 'refunded';
  musicalChunks: string[];
  createdAt: number;
}

export class GiftingService {
  private apiKey: string;
  private baseUrl: string = 'https://api.starkzap.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create a Bitcoin Gift Vault locked by Sonic DNA
   */
  async createGift(
    senderAddress: string,
    amountBtc: string,
    musicalCode: string,
    chunks: string[]
  ): Promise<GiftVault | null> {
    try {
      // 1. Extract DNA
      const dna = await extractSonicDNA(musicalCode);
      if (!dna) throw new Error("Failed to extract DNA");

      // 2. Generate Blinding and Commitment
      const blinding = generateBlinding();
      const commitment = await pedersen(dna.hash, blinding);

      // 3. Create Starkzap Vault (Mock API call)
      const response = await fetch(`${this.baseUrl}/gifts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: senderAddress,
          amount: amountBtc,
          commitment,
          musicalChunks: chunks
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create gift vault');
      }

      const result = await response.json();
      return {
        id: result.id || 'gift_' + Math.random().toString(36).slice(2, 10),
        sender: senderAddress,
        amount: amountBtc,
        commitment,
        blinding,
        status: 'locked',
        musicalChunks: chunks,
        createdAt: Date.now()
      };
    } catch (error) {
      console.error("Failed to create gift:", error);
      return null;
    }
  }

  /**
   * Claim a gift using Sonic DNA and Starkzap Social Login
   */
  async claimGift(
    vaultId: string,
    recipientAddress: string,
    musicalCode: string,
    blinding: string
  ): Promise<boolean> {
    try {
      // 1. Extract DNA from provided chunks (reconstructed to code)
      const dna = await extractSonicDNA(musicalCode);
      if (!dna) throw new Error("Failed to extract DNA");

      // 2. Claim via Starkzap (Mock API call)
      const response = await fetch(`${this.baseUrl}/gifts/${vaultId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: recipientAddress,
          dnaHash: dna.hash,
          blinding
        })
      });

      if (!response.ok) {
        throw new Error('Claim verification failed');
      }

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error("Failed to claim gift:", error);
      return false;
    }
  }

  /**
   * Onboard a user via Social Login (powered by Starkzap)
   */
  async socialLogin(provider: 'google' | 'apple'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Social login failed');
      }

      const result = await response.json();
      return {
        address: result.address || '0x' + Math.random().toString(16).slice(2, 18),
        provider,
        status: 'connected',
        email: result.email
      };
    } catch (error) {
      console.error('Social login error:', error);
      throw new Error('Failed to connect wallet via social login');
    }
  }

  /**
   * Get gift status
   */
  async getGiftStatus(vaultId: string): Promise<GiftVault | null> {
    try {
      const response = await fetch(`${this.baseUrl}/gifts/${vaultId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Get gift status error:', error);
      return null;
    }
  }

  /**
   * List user gifts
   */
  async listUserGifts(recipientAddress: string): Promise<GiftVault[]> {
    try {
      const response = await fetch(`${this.baseUrl}/gifts/user/${recipientAddress}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('List user gifts error:', error);
      return [];
    }
  }
}
