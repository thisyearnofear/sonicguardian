import { pedersen, generateBlinding } from './crypto';
import { extractSonicDNA } from './dna';
import { vaultManager, GiftVault } from './storage';

export class GiftingService {
  /**
   * Create a Bitcoin Gift Vault locked by Sonic DNA
   * Frontend-only implementation using local storage
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

      // 3. Generate deterministic vault ID from commitment
      const vaultId = vaultManager.generateVaultId(commitment);

      // 4. Create local vault
      const vault: GiftVault = {
        id: vaultId,
        sender: senderAddress,
        amount: amountBtc,
        commitment,
        blinding,
        status: 'locked',
        musicalChunks: chunks,
        createdAt: Date.now()
      };

      // 5. Store vault locally
      const success = vaultManager.createVault(vault);
      
      if (!success) {
        throw new Error('Failed to store gift vault locally');
      }

      return vault;
    } catch (error) {
      console.error("Failed to create gift:", error);
      return null;
    }
  }

  /**
   * Claim a gift using Sonic DNA
   * Frontend-only implementation with client-side verification
   */
  async claimGift(
    vaultId: string,
    recipientAddress: string,
    musicalCode: string,
    blinding: string
  ): Promise<boolean> {
    try {
      // 1. Retrieve the vault from local storage
      const vault = vaultManager.getVault(vaultId);
      if (!vault) {
        throw new Error('Gift vault not found');
      }

      if (vault.status !== 'locked') {
        throw new Error('Gift vault is not available for claiming');
      }

      // 2. Extract DNA from provided musical code
      const dna = await extractSonicDNA(musicalCode);
      if (!dna) throw new Error("Failed to extract DNA from provided code");

      // 3. Verify the commitment matches
      const computedCommitment = await pedersen(dna.hash, blinding);
      
      if (computedCommitment !== vault.commitment) {
        throw new Error('Musical DNA verification failed - commitment mismatch');
      }

      // 4. Update vault status to claimed
      const success = vaultManager.updateVault(vaultId, {
        status: 'claimed',
        claimedAt: Date.now(),
        recipient: recipientAddress
      });

      if (!success) {
        throw new Error('Failed to update vault status');
      }

      return true;
    } catch (error) {
      console.error("Failed to claim gift:", error);
      return false;
    }
  }

  /**
   * Onboard a user via social login (Web3Auth)
   * Client-side OAuth with no backend required
   */
  async socialLogin(provider: 'google' | 'apple'): Promise<any> {
    try {
      const { socialLogin } = await import('./web3auth');
      return await socialLogin(provider);
    } catch (error) {
      console.error('Social login error:', error);
      throw new Error('Failed to authenticate with social provider');
    }
  }

  /**
   * Get gift status from local storage
   */
  async getGiftStatus(vaultId: string): Promise<GiftVault | null> {
    try {
      return vaultManager.getVault(vaultId);
    } catch (error) {
      console.error('Get gift status error:', error);
      return null;
    }
  }

  /**
   * List user gifts from local storage
   */
  async listUserGifts(recipientAddress: string): Promise<GiftVault[]> {
    try {
      const metadataList = vaultManager.listUserVaults(recipientAddress);
      const vaults: GiftVault[] = [];
      
      for (const metadata of metadataList) {
        const vault = vaultManager.getVault(metadata.vaultId);
        if (vault) {
          vaults.push(vault);
        }
      }
      
      return vaults;
    } catch (error) {
      console.error('List user gifts error:', error);
      return [];
    }
  }

  /**
   * List vaults created by a sender
   */
  async listSenderGifts(senderAddress: string): Promise<GiftVault[]> {
    try {
      const metadataList = vaultManager.listSenderVaults(senderAddress);
      const vaults: GiftVault[] = [];
      
      for (const metadata of metadataList) {
        const vault = vaultManager.getVault(metadata.vaultId);
        if (vault) {
          vaults.push(vault);
        }
      }
      
      return vaults;
    } catch (error) {
      console.error('List sender gifts error:', error);
      return [];
    }
  }

  /**
   * Verify if a musical code can claim a specific vault
   */
  async verifyClaim(
    vaultId: string,
    musicalCode: string,
    blinding: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const vault = vaultManager.getVault(vaultId);
      if (!vault) {
        return { success: false, message: 'Gift vault not found' };
      }

      if (vault.status !== 'locked') {
        return { success: false, message: 'Gift vault is not available for claiming' };
      }

      // Extract DNA and verify
      const dna = await extractSonicDNA(musicalCode);
      if (!dna) {
        return { success: false, message: 'Failed to extract DNA from provided code' };
      }

      const computedCommitment = await pedersen(dna.hash, blinding);
      
      if (computedCommitment !== vault.commitment) {
        return { success: false, message: 'Musical DNA verification failed' };
      }

      return { success: true, message: 'Musical DNA verified successfully' };
    } catch (error) {
      console.error('Claim verification error:', error);
      return { success: false, message: 'Verification failed' };
    }
  }
}
