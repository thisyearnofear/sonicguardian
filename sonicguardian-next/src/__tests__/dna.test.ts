/**
 * Unit tests for DNA extraction functionality
 */

import { extractSonicDNA, extractSonicDNASync } from '../lib/dna';

describe('DNA Extraction', () => {
  describe('extractSonicDNA', () => {
    it('should extract DNA from valid Strudel code', async () => {
      const code = 's("bass").slow(2).distort(5).lpf(500)';
      const result = await extractSonicDNA(code);
      
      expect(result).toBeTruthy();
      expect(result?.dna).toContain('s(bass)');
      expect(result?.hash).toHaveLength(64); // SHA-256 hash length
      expect(result?.salt).toBeTruthy();
      expect(result?.timestamp).toBeGreaterThan(0);
    });

    it('should produce consistent results for same input', async () => {
      const code = 's("bd").slow(2)';
      const result1 = await extractSonicDNA(code, { salt: 'test-salt' });
      const result2 = await extractSonicDNA(code, { salt: 'test-salt' });
      
      expect(result1?.hash).toBe(result2?.hash);
      expect(result1?.dna).toBe(result2?.dna);
    });

    it('should handle different code variations', async () => {
      const code1 = 's("bass").slow(2).distort(5).lpf(500)';
      const code2 = 's("bass").lpf(500).slow(2).distort(5)'; // Different order
      
      const result1 = await extractSonicDNA(code1);
      const result2 = await extractSonicDNA(code2);
      
      // Should produce same DNA due to normalization
      expect(result1?.dna).toBe(result2?.dna);
      expect(result1?.hash).toBe(result2?.hash);
    });

    it('should reject invalid code', async () => {
      const result = await extractSonicDNA('');
      expect(result).toBeNull();
    });

    it('should validate input length', async () => {
      const longCode = 'a'.repeat(1001); // Exceeds 1000 character limit
      const result = await extractSonicDNA(longCode);
      expect(result).toBeNull();
    });
  });

  describe('extractSonicDNASync', () => {
    it('should extract DNA synchronously', () => {
      const code = 's("bass").slow(2).distort(5).lpf(500)';
      const result = extractSonicDNASync(code);
      
      expect(result).toBeTruthy();
      expect(result?.dna).toContain('s(bass)');
      expect(result?.hash).toHaveLength(64);
      expect(result?.salt).toBeTruthy();
      expect(result?.timestamp).toBeGreaterThan(0);
    });

    it('should produce consistent results', () => {
      const code = 's("bd").slow(2)';
      const result1 = extractSonicDNASync(code, { salt: 'test-salt' });
      const result2 = extractSonicDNASync(code, { salt: 'test-salt' });
      
      expect(result1?.hash).toBe(result2?.hash);
      expect(result1?.dna).toBe(result2?.dna);
    });
  });
});