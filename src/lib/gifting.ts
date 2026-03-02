import { Account, Contract, uint256, RpcProvider } from 'starknet';
import { pedersen, generateBlinding } from './crypto';
import { extractSonicDNA } from './dna';
import { vaultManager, GiftVault } from './storage';
import { abi } from './abi';

// Real Bitcoin-backed token addresses on Starknet Sepolia
// tBTC (Threshold Network) or similar. For demo/hackathon we can use a custom one 
// or the canonical tBTC if we have it.
export const BTC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_BTC_TOKEN_ADDRESS || "0x03fe2b97c1fd33ed324546411f97df48074902b794ba2422f2f7fc8b48f98d02";
export const GUARDIAN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x02b680ba171e40a103739a4af6739ce9b7df2c4cd24ff6c230074af3af8b73de";

export class GiftingService {
  private provider: RpcProvider;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
    });
  }

  /**
   * Create a Real Bitcoin Gift Vault on Starknet
   * Escrows native-backed BTC tokens on-chain
   */
  async createGift(
    account: Account,
    amountBtc: string,
    musicalCode: string,
    chunks: string[]
  ): Promise<GiftVault | null> {
    try {
      // 1. Extract DNA (Private, client-side only)
      const dna = await extractSonicDNA(musicalCode);
      if (!dna) throw new Error("Failed to extract DNA");

      // 2. Generate Blinding and Commitment
      const blinding = generateBlinding();
      const commitment = await pedersen(dna.hash, blinding);
      const vaultId = `0x${commitment.substring(0, 16)}`;

      // 3. Prepare Contract Instances
      const guardian = new Contract(abi, GUARDIAN_CONTRACT_ADDRESS, account);
      const btcToken = new Contract(abi, BTC_TOKEN_ADDRESS, account);

      // 4. Convert amount to value
      // Note: Real BTC uses 8, but bridged often uses 18. Adjust as needed.
      const amount = BigInt(Math.floor(parseFloat(amountBtc) * 10 ** 18));

      console.log(`Executing on-chain gift creation for ${amountBtc} BTC...`);

      // 5. Multi-call: Approve + Create Vault (Atomic)
      const { transaction_hash } = await account.execute([
        {
          contractAddress: BTC_TOKEN_ADDRESS,
          entrypoint: 'approve',
          calldata: [GUARDIAN_CONTRACT_ADDRESS, amount]
        },
        {
          contractAddress: GUARDIAN_CONTRACT_ADDRESS,
          entrypoint: 'create_onchain_gift',
          calldata: [vaultId, commitment, amount, BTC_TOKEN_ADDRESS]
        }
      ]);


      console.log(`Transaction submitted: ${transaction_hash}`);

      // 6. Store local metadata for tracking (UX only)
      const vault: GiftVault = {
        id: vaultId,
        sender: account.address,
        amount: amountBtc,
        commitment,
        blinding,
        status: 'locked',
        musicalChunks: chunks,
        createdAt: Date.now(),
        txHash: transaction_hash // Store tx for verification
      };

      vaultManager.createVault(vault);
      return vault;
    } catch (error) {
      console.error("Failed to create on-chain gift:", error);
      return null;
    }
  }

  /**
   * Claim a Bitcoin gift using Musical DNA Proof
   * Verification happens in the Cairo contract
   */
  async claimGift(
    account: Account,
    vaultId: string,
    recipientAddress: string,
    musicalCode: string,
    blinding: string
  ): Promise<boolean> {
    try {
      // 1. Extract DNA
      const dna = await extractSonicDNA(musicalCode);
      if (!dna) throw new Error("Failed to extract DNA");

      // 2. Initial on-chain claim via SonicGuardian contract
      const guardian = new Contract(abi, GUARDIAN_CONTRACT_ADDRESS, account);

      console.log(`Verifying Musical DNA and claiming vault ${vaultId} on-chain...`);

      const { transaction_hash } = await guardian.claim_onchain_gift(
        vaultId,
        dna.hash,
        blinding,
        recipientAddress
      );

      console.log(`Claim transaction: ${transaction_hash}`);

      // Wait for transaction to be accepted (simplified for hackathon)
      // await this.provider.waitForTransaction(transaction_hash);

      // 3. Update local UI state
      vaultManager.updateVault(vaultId, {
        status: 'claimed',
        claimedAt: Date.now(),
        recipient: recipientAddress
      });

      return true;
    } catch (error) {
      console.error("Failed to claim on-chain gift:", error);
      return false;
    }
  }

  /**
   * Verify if a gift is claimable by checking on-chain state
   */
  async getOnChainStatus(vaultId: string): Promise<string> {
    try {
      const guardian = new Contract(abi, GUARDIAN_CONTRACT_ADDRESS, this.provider);
      // We check if it exists and what the commitment is
      const commitment = await guardian.get_vault_commitment(vaultId);
      return commitment === 0n ? 'not_found' : 'locked';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Onboard via Web3Auth
   */
  async socialLogin(provider: 'google' | 'apple'): Promise<any> {
    const { socialLogin } = await import('./web3auth');
    return await socialLogin(provider);
  }

  // --- Utility functions maintained for compatibility ---

  async listUserGifts(recipientAddress: string): Promise<GiftVault[]> {
    return vaultManager.listUserVaults(recipientAddress).map(m => vaultManager.getVault(m.vaultId)!);
  }

  async listSenderGifts(senderAddress: string): Promise<GiftVault[]> {
    return vaultManager.listSenderVaults(senderAddress).map(m => vaultManager.getVault(m.vaultId)!);
  }
}

