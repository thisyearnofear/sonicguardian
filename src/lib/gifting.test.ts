/**
 * Test suite for the frontend-only gifting system
 */

import { GiftingService } from './gifting';
import { extractSonicDNA } from './dna';
import { pedersen } from './crypto';
import { vaultManager } from './storage';

describe('Frontend-Only Gifting System', () => {
  const giftingService = new GiftingService('test');

  beforeEach(() => {
    // Clear localStorage before each test
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sonic_')) {
        localStorage.removeItem(key);
      }
    });
  });

  test('should create a gift vault with deterministic ID', async () => {
    const senderAddress = '0x1234567890abcdef';
    const amountBtc = '0.001';
    const musicalCode = 's("bd*4").cpm(120)';
    const chunks = ['bd rhythm', '4 beats', '120 bpm'];

    const vault = await giftingService.createGift(senderAddress, amountBtc, musicalCode, chunks);

    expect(vault).toBeTruthy();
    expect(vault?.sender).toBe(senderAddress);
    expect(vault?.amount).toBe(amountBtc);
    expect(vault?.status).toBe('locked');
    expect(vault?.musicalChunks).toEqual(chunks);
    expect(vault?.id).toMatch(/^vault_/);
    expect(vault?.createdAt).toBeGreaterThan(0);
  });

  test('should claim a gift with correct musical DNA', async () => {
    const senderAddress = '0x1234567890abcdef';
    const recipientAddress = '0xabcdef1234567890';
    const amountBtc = '0.001';
    const musicalCode = 's("bd*4").cpm(120)';
    const chunks = ['bd rhythm', '4 beats', '120 bpm'];

    // Create gift
    const vault = await giftingService.createGift(senderAddress, amountBtc, musicalCode, chunks);
    expect(vault).toBeTruthy();

    // Extract DNA and blinding for claiming
    const dna = await extractSonicDNA(musicalCode);
    expect(dna).toBeTruthy();

    // Claim gift
    const success = await giftingService.claimGift(
      vault!.id,
      recipientAddress,
      musicalCode,
      vault!.blinding
    );

    expect(success).toBe(true);

    // Verify vault status updated
    const updatedVault = await giftingService.getGiftStatus(vault!.id);
    expect(updatedVault?.status).toBe('claimed');
    expect(updatedVault?.recipient).toBe(recipientAddress);
  });

  test('should reject claim with incorrect musical DNA', async () => {
    const senderAddress = '0x1234567890abcdef';
    const recipientAddress = '0xabcdef1234567890';
    const amountBtc = '0.001';
    const musicalCode = 's("bd*4").cpm(120)';
    const chunks = ['bd rhythm', '4 beats', '120 bpm'];

    // Create gift
    const vault = await giftingService.createGift(senderAddress, amountBtc, musicalCode, chunks);
    expect(vault).toBeTruthy();

    // Try to claim with wrong musical code
    const wrongCode = 's("sd*4").cpm(120)';
    const success = await giftingService.claimGift(
      vault!.id,
      recipientAddress,
      wrongCode,
      vault!.blinding
    );

    expect(success).toBe(false);

    // Verify vault status unchanged
    const updatedVault = await giftingService.getGiftStatus(vault!.id);
    expect(updatedVault?.status).toBe('locked');
  });

  test('should list user gifts correctly', async () => {
    const senderAddress = '0x1234567890abcdef';
    const recipientAddress = '0xabcdef1234567890';

    // Create multiple gifts
    await giftingService.createGift(senderAddress, '0.001', 's("bd*4")', ['bd rhythm']);
    await giftingService.createGift(senderAddress, '0.002', 's("sd*4")', ['sd rhythm']);
    await giftingService.createGift(senderAddress, '0.003', 's("hh*8")', ['hh rhythm']);

    // List sender gifts
    const senderGifts = await giftingService.listSenderGifts(senderAddress);
    expect(senderGifts.length).toBe(3);

    // List user gifts (should be empty since none are claimable)
    const userGifts = await giftingService.listUserGifts(recipientAddress);
    expect(userGifts.length).toBe(0);
  });

  test('should verify claims without updating status', async () => {
    const senderAddress = '0x1234567890abcdef';
    const recipientAddress = '0xabcdef1234567890';
    const musicalCode = 's("bd*4").cpm(120)';

    // Create gift
    const vault = await giftingService.createGift(senderAddress, '0.001', musicalCode, ['bd rhythm']);
    expect(vault).toBeTruthy();

    // Verify claim
    const verification = await giftingService.verifyClaim(vault!.id, musicalCode, vault!.blinding);
    expect(verification.success).toBe(true);
    expect(verification.message).toBe('Musical DNA verified successfully');

    // Verify vault status unchanged (verification doesn't update status)
    const updatedVault = await giftingService.getGiftStatus(vault!.id);
    expect(updatedVault?.status).toBe('locked');
  });

  test('should generate deterministic vault IDs', async () => {
    const musicalCode = 's("bd*4").cpm(120)';
    const chunks = ['bd rhythm', '4 beats'];

    // Extract DNA to get commitment
    const dna = await extractSonicDNA(musicalCode);
    const blinding = 'test_blinding_factor';
    const commitment = await pedersen(dna!.hash, blinding);

    // Generate vault ID
    const vaultId = vaultManager.generateVaultId(commitment);
    expect(vaultId).toMatch(/^vault_/);
    expect(vaultId).toBe(`vault_${commitment.substring(0, 16)}`);
  });
});

// Run tests if in Node.js environment
if (typeof window === 'undefined') {
  // Import test runner if available
  console.log('Frontend-only gifting system tests defined');
}