/**
 * Unit tests for AI Agent functionality
 */

import { generateStrudelCode, SonicAgent } from '../lib/ai-agent';

describe('AI Agent', () => {
  describe('generateStrudelCode', () => {
    it('should generate code from prompt', async () => {
      const prompt = 'A slow, muffled industrial bassline';
      const result = await generateStrudelCode(prompt);
      
      expect(result).toBeTruthy();
      expect(result.code).toBeTruthy();
      expect(result.prompt).toBe(prompt.toLowerCase().trim());
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should produce consistent results for same prompt', async () => {
      const prompt = 'A fast techno beat';
      const result1 = await generateStrudelCode(prompt);
      const result2 = await generateStrudelCode(prompt);
      
      expect(result1.code).toBe(result2.code);
      expect(result1.prompt).toBe(result2.prompt);
    });

    it('should validate prompt input', async () => {
      await expect(generateStrudelCode('')).rejects.toThrow();
      await expect(generateStrudelCode('   ')).rejects.toThrow();
      await expect(generateStrudelCode(123 as any)).rejects.toThrow();
    });
  });

  describe('SonicAgent', () => {
    it('should create agent instance', () => {
      const agent = new SonicAgent();
      expect(agent).toBeInstanceOf(SonicAgent);
    });

    it('should generate code with mock agent by default', async () => {
      const agent = new SonicAgent();
      const result = await agent.generateCode('test prompt');
      
      expect(result).toBeTruthy();
      expect(result.code).toBeTruthy();
      expect(result.confidence).toBe(0.8); // Mock confidence
    });

    it('should enable and disable real AI', () => {
      const agent = new SonicAgent();
      
      expect(agent.isRealAIEnabled()).toBe(false);
      
      agent.enableRealAI('test-key');
      expect(agent.isRealAIEnabled()).toBe(true);
      
      agent.disableRealAI();
      expect(agent.isRealAIEnabled()).toBe(false);
    });

    it('should clear cache when using real AI', () => {
      const agent = new SonicAgent({ useRealAI: true });
      expect(() => agent.clearCache()).not.toThrow();
    });
  });
});