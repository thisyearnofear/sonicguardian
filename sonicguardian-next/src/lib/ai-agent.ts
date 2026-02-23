/**
 * AI Agent for Sonic Guardian
 * Consolidates prompt-to-code generation with proper error handling and caching
 */

import { mockAgentGenerate } from './dna';
import { APIError, createAPIError } from './api';

export interface AgentOptions {
  useRealAI?: boolean;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResponse {
  code: string;
  prompt: string;
  confidence: number;
  timestamp: number;
}

/**
 * Google Gemini API integration
 */
class GeminiAgent {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private cache: Map<string, AgentResponse> = new Map();
  private readonly cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(options: AgentOptions) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = options.model || 'gemini-1.5-flash';
    this.temperature = options.temperature || 0.3; // Low temperature for deterministic output
    this.maxTokens = options.maxTokens || 500;
  }

  /**
   * Generate Strudel code from prompt using Google Gemini
   */
  async generateCode(prompt: string): Promise<AgentResponse> {
    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      throw new APIError('Invalid prompt provided', 'INVALID_PROMPT', 400);
    }

    const trimmedPrompt = prompt.trim().toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(trimmedPrompt);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached;
    }

    if (!this.apiKey) {
      throw new APIError('Google Gemini API key not configured', 'MISSING_API_KEY', 503);
    }

    try {
      // Construct prompt for consistent output
      const systemPrompt = `
You are a musical AI agent specialized in generating Strudel live coding patterns.
Given a musical description, generate a deterministic Strudel code pattern.

Rules:
1. Always generate valid Strudel syntax
2. Use consistent function names and parameters
3. Return only the code, no explanations
4. Examples:
   - "muffled bass" -> s("bass").slow(2).distort(5).lpf(500)
   - "fast techno" -> stack(s("bd*4"), s("hh*8").gain(0.8))
   - "bright lead" -> s("saw").hpf(2000).fast(2)

Input: ${trimmedPrompt}
Output:
      `.trim();

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens,
            topP: 1,
            topK: 1
          }
        })
      });

      if (!response.ok) {
        throw new APIError(`Gemini API error: ${response.statusText}`, 'GEMINI_API_ERROR', response.status);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
        throw new APIError('Invalid response from Gemini API', 'INVALID_GEMINI_RESPONSE', 500);
      }

      const generatedCode = data.candidates[0].content.parts[0].text.trim();
      
      // Validate the generated code
      const validatedCode = this.validateStrudelCode(generatedCode);
      
      const responseObj: AgentResponse = {
        code: validatedCode,
        prompt: trimmedPrompt,
        confidence: 0.95, // High confidence for AI-generated content
        timestamp: Date.now()
      };

      // Cache the response
      this.cache.set(trimmedPrompt, responseObj);

      return responseObj;

    } catch (error) {
      console.error('Gemini API error:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError('Failed to generate code with AI', 'AI_GENERATION_ERROR', 500);
    }
  }

  /**
   * Basic validation of Strudel code
   */
  private validateStrudelCode(code: string): string {
    // Remove any markdown formatting
    let cleaned = code.replace(/```(?:javascript|js)?\n?/g, '').replace(/```$/g, '').trim();
    
    // Basic syntax validation
    if (!cleaned.includes('s("') && !cleaned.includes('stack(')) {
      throw new APIError('Generated code does not appear to be valid Strudel syntax', 'INVALID_STRUDEL_SYNTAX', 400);
    }

    // Ensure it's not too long
    if (cleaned.length > 1000) {
      throw new APIError('Generated code is too long', 'CODE_TOO_LONG', 400);
    }

    return cleaned;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Consolidated agent that can use either real AI or mock
 */
export class SonicAgent {
  private geminiAgent: GeminiAgent | null = null;
  private useRealAI: boolean;
  private fallbackToMock: boolean = true;

  constructor(options: AgentOptions = {}) {
    this.useRealAI = options.useRealAI || false;
    
    if (this.useRealAI) {
      this.geminiAgent = new GeminiAgent(options);
    }
  }

  /**
   * Generate Strudel code from prompt
   */
  async generateCode(prompt: string): Promise<AgentResponse> {
    if (this.useRealAI && this.geminiAgent) {
      try {
        return await this.geminiAgent.generateCode(prompt);
      } catch (error) {
        console.warn('Gemini API failed, falling back to mock agent:', error);
        
        if (this.fallbackToMock) {
          return this.generateMockCode(prompt);
        }
        
        throw error;
      }
    }
    
    return this.generateMockCode(prompt);
  }

  /**
   * Generate code using mock agent
   */
  private generateMockCode(prompt: string): AgentResponse {
    const code = mockAgentGenerate(prompt);
    
    return {
      code,
      prompt: prompt.toLowerCase().trim(),
      confidence: 0.8, // Lower confidence for mock
      timestamp: Date.now()
    };
  }

  /**
   * Enable real AI
   */
  enableRealAI(apiKey?: string): void {
    this.useRealAI = true;
    this.geminiAgent = new GeminiAgent({ apiKey });
  }

  /**
   * Disable real AI and use mock
   */
  disableRealAI(): void {
    this.useRealAI = false;
    this.geminiAgent = null;
  }

  /**
   * Check if real AI is enabled
   */
  isRealAIEnabled(): boolean {
    return this.useRealAI && this.geminiAgent !== null;
  }

  /**
   * Clear cache if using real AI
   */
  clearCache(): void {
    if (this.geminiAgent) {
      this.geminiAgent.clearCache();
    }
  }
}

/**
 * Global agent instance for consistent usage
 */
export const sonicAgent = new SonicAgent({
  useRealAI: process.env.NEXT_PUBLIC_USE_REAL_AI === 'true',
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Utility function for easy access
 */
export async function generateStrudelCode(prompt: string, options?: AgentOptions): Promise<AgentResponse> {
  const agent = new SonicAgent(options);
  return await agent.generateCode(prompt);
}