import { StarkzapSDK } from 'starkzap';
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
}

export class GiftingService {
  private starkzap: StarkzapSDK;

  constructor(apiKey: string) {
    this.starkzap = new StarkzapSDK({
      apiKey,
      network: process.env.NEXT_PUBLIC_STARKNET_NETWORK as any || 'sepolia',
    });
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

      // 3. Create Starkzap Vault
      // Note: This is a high-level representation of Starkzap's vault API
      const vault = await this.starkzap.bitcoin.createVault({
        owner: senderAddress,
        amount: amountBtc,
        condition: {
          type: 'pedersen_commitment',
          value: commitment,
        },
      });

      return {
        id: vault.id,
        sender: senderAddress,
        amount: amountBtc,
        commitment,
        blinding,
        status: 'locked',
        musicalChunks: chunks,
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

      // 2. Claim via Starkzap
      // The SDK handles the ZK proof verification on-chain
      const success = await this.starkzap.bitcoin.claimVault(vaultId, {
        recipient: recipientAddress,
        witness: {
          dnaHash: dna.hash,
          blinding: blinding,
        },
      });

      return success;
    } catch (error) {
      console.error("Failed to claim gift:", error);
      return false;
    }
  }

  /**
   * Onboard a user via Social Login (powered by Starkzap)
   */
  async socialLogin(provider: 'google' | 'apple') {
    return await this.starkzap.auth.login(provider);
  }
}
