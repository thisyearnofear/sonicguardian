/**
 * AI Agent for Sonic Guardian
 * Deterministic prompt-to-code generation with Gemini integration and fallback
 */

import { mockAgentGenerate } from './dna';
import { APIError } from './api';

export interface AgentOptions {
  useRealAI?: boolean;
  apiKey?: string;
  model?: string;
}

export interface AgentResponse {
  code: string;
  prompt: string;
  confidence: number;
  timestamp: number;
}

class SonicAgent {
  private cache: Map<string, AgentResponse> = new Map();
  private readonly cacheTTL: number = 5 * 60 * 1000;

  async generateCode(prompt: string, options: AgentOptions = {}): Promise<AgentResponse> {
    const trimmedPrompt = prompt.trim().toLowerCase();

    // Cache check
    const cached = this.cache.get(trimmedPrompt);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached;
    }

    const useRealAI = options.useRealAI ?? (process.env.NEXT_PUBLIC_USE_REAL_AI === 'true');
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;

    if (useRealAI && apiKey) {
      try {
        const response = await this.callGemini(trimmedPrompt, apiKey, options.model);
        this.cache.set(trimmedPrompt, response);
        return response;
      } catch (error) {
        console.warn('Gemini failed, falling back:', error);
      }
    }

    // Mock fallback
    const code = mockAgentGenerate(trimmedPrompt);
    const response: AgentResponse = {
      code,
      prompt: trimmedPrompt,
      confidence: 0.8,
      timestamp: Date.now()
    };
    this.cache.set(trimmedPrompt, response);
    return response;
  }

  private async callGemini(prompt: string, apiKey: string, model: string = 'gemini-1.5-flash'): Promise<AgentResponse> {
    const systemPrompt = `
Generate valid Strudel live coding pattern for: "${prompt}". 
Return ONLY code, no markdown, no explanation.
Example: "heavy bass" -> s("bass").distort(5).lpf(500)
`.trim();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.1, topP: 1, topK: 1 }
      })
    });

    if (!response.ok) throw new Error(`Gemini Error: ${response.statusText}`);

    const data = await response.json();
    const code = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!code) throw new Error('Empty response from Gemini');

    return {
      code: code.replace(/```(?:javascript|js)?\n?/g, '').replace(/```$/g, '').trim(),
      prompt,
      confidence: 0.95,
      timestamp: Date.now()
    };
  }

  isRealAIEnabled(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }
}

export const sonicAgent = new SonicAgent();

export async function generateStrudelCode(prompt: string, options?: AgentOptions): Promise<AgentResponse> {
  return await sonicAgent.generateCode(prompt, options);
}