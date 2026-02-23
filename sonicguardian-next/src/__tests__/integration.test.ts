/**
 * Integration tests for the complete Sonic Guardian system
 */

import { extractSonicDNASync } from '../lib/dna';
import { generateStrudelCode } from '../lib/ai-agent';
import { sessionManager } from '../lib/storage';

describe('Sonic Guardian Integration', () => {
  beforeEach(() => {
    // Clear any existing session data
    sessionManager.clearSession();
  });

  describe('Complete Registration Flow', () => {
    it('should complete full registration process', async () => {
      const secretVibe = 'A slow, muffled industrial bassline';
      
      // 1. Generate code from prompt
      const agentResponse = await generateStrudelCode(secretVibe);
      expect(agentResponse.code).toBeTruthy();
      expect(agentResponse.prompt).toBe(secretVibe.toLowerCase().trim());

      // 2. Extract DNA from code
      const dna = extractSonicDNASync(agentResponse.code, { includeTimestamp: true });
      expect(dna).toBeTruthy();
      expect(dna?.hash).toHaveLength(64);
      expect(dna?.salt).toBeTruthy();

      // 3. Create session
      const session = sessionManager.createSession(
        secretVibe.trim(),
        dna!.hash,
        dna!.salt
      );
      expect(session.secretPrompt).toBe(secretVibe.trim());
      expect(session.storedHash).toBe(dna!.hash);
      expect(session.storedSalt).toBe(dna!.salt);

      // 4. Verify session can be retrieved
      const retrievedSession = sessionManager.getCurrentSession();
      expect(retrievedSession?.id).toBe(session.id);
      expect(retrievedSession?.storedHash).toBe(session.storedHash);
    });
  });

  describe('Complete Recovery Flow', () => {
    let originalSession: any;
    let originalDNA: any;

    beforeEach(async () => {
      // Set up registration
      const secretVibe = 'A slow, muffled industrial bassline';
      const agentResponse = await generateStrudelCode(secretVibe);
      originalDNA = extractSonicDNASync(agentResponse.code, { includeTimestamp: true });
      originalSession = sessionManager.createSession(
        secretVibe.trim(),
        originalDNA.hash,
        originalDNA.salt
      );
    });

    it('should successfully recover with correct prompt', async () => {
      const recoveryVibe = 'A slow, muffled industrial bassline'; // Same as original
      
      // 1. Generate recovery code
      const recoveryResponse = await generateStrudelCode(recoveryVibe);
      expect(recoveryResponse.code).toBeTruthy();

      // 2. Extract recovery DNA
      const recoveryDNA = extractSonicDNASync(recoveryResponse.code, { includeTimestamp: true });
      expect(recoveryDNA).toBeTruthy();

      // 3. Verify hashes match
      expect(recoveryDNA?.hash).toBe(originalDNA.hash);

      // 4. Add recovery attempt
      const success = sessionManager.addRecoveryAttempt(
        recoveryVibe.trim(),
        true,
        recoveryDNA!.hash
      );
      expect(success).toBe(true);

      // 5. Verify attempt was recorded
      const updatedSession = sessionManager.getCurrentSession();
      expect(updatedSession?.recoveryAttempts).toHaveLength(1);
      expect(updatedSession?.recoveryAttempts[0].success).toBe(true);
      expect(updatedSession?.recoveryAttempts[0].hash).toBe(recoveryDNA!.hash);
    });

    it('should fail recovery with incorrect prompt', async () => {
      const recoveryVibe = 'A fast, bright techno beat'; // Different from original
      
      // 1. Generate recovery code
      const recoveryResponse = await generateStrudelCode(recoveryVibe);
      expect(recoveryResponse.code).toBeTruthy();

      // 2. Extract recovery DNA
      const recoveryDNA = extractSonicDNASync(recoveryResponse.code, { includeTimestamp: true });
      expect(recoveryDNA).toBeTruthy();

      // 3. Verify hashes do not match
      expect(recoveryDNA?.hash).not.toBe(originalDNA.hash);

      // 4. Add failed recovery attempt
      const success = sessionManager.addRecoveryAttempt(
        recoveryVibe.trim(),
        false,
        recoveryDNA!.hash
      );
      expect(success).toBe(true);

      // 5. Verify failed attempt was recorded
      const updatedSession = sessionManager.getCurrentSession();
      expect(updatedSession?.recoveryAttempts).toHaveLength(1);
      expect(updatedSession?.recoveryAttempts[0].success).toBe(false);
      expect(updatedSession?.recoveryAttempts[0].hash).toBe(recoveryDNA!.hash);
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce identical results for identical inputs', async () => {
      const prompt = 'A slow, muffled industrial bassline';
      
      // First generation
      const response1 = await generateStrudelCode(prompt, { useRealAI: false });
      const dna1 = extractSonicDNASync(response1.code, { salt: 'test-salt' });

      // Second generation (should be identical)
      const response2 = await generateStrudelCode(prompt, { useRealAI: false });
      const dna2 = extractSonicDNASync(response2.code, { salt: 'test-salt' });

      // Verify deterministic behavior
      expect(response1.code).toBe(response2.code);
      expect(dna1?.hash).toBe(dna2?.hash);
      expect(dna1?.dna).toBe(dna2?.dna);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid prompts gracefully', async () => {
      const invalidPrompts = ['', '   ', null, undefined];

      for (const prompt of invalidPrompts) {
        try {
          await generateStrudelCode(prompt as any);
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeTruthy();
        }
      }
    });

    it('should handle invalid code gracefully', () => {
      const invalidCodes = ['', '   ', 'invalid syntax {'];

      for (const code of invalidCodes) {
        const result = extractSonicDNASync(code);
        expect(result).toBeNull();
      }
    });
  });
});