/**
 * AI Agent for Sonic Guardian
 * Pure, privacy-focused inference using Venice AI.
 * Disables non-private fallbacks to ensure ZK integrity of the acoustic signature.
 */

import { mockAgentGenerate } from './dna';

export interface AgentOptions {
  useRealAI?: boolean;
  apiKey?: string;
  model?: string;
}

export interface AgentResponse {
  code: string;
  prompt: string;
  confidence: number;
  provider: string;
  timestamp: number;
}

class SonicAgent {
  private cache: Map<string, AgentResponse> = new Map();
  private readonly cacheTTL: number = 5 * 60 * 1000;

  private readonly veniceConfig = {
    url: 'https://api.venice.ai/api/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    }),
    formatBody: (prompt: string, model: string, system: string) => ({
      model: model || 'llama-3.1-405b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content
  };

  async generateCode(prompt: string, options: AgentOptions = {}): Promise<AgentResponse> {
    const trimmedPrompt = prompt.trim().toLowerCase();

    const cached = this.cache.get(trimmedPrompt);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) return cached;

    const useRealAI = options.useRealAI ?? (process.env.NEXT_PUBLIC_USE_REAL_AI === 'true');
    const veniceKey = process.env.VENICE_API_KEY;

    if (useRealAI && veniceKey) {
      try {
        const response = await fetch(this.veniceConfig.url, {
          method: 'POST',
          headers: this.veniceConfig.headers(veniceKey),
          body: JSON.stringify(this.veniceConfig.formatBody(trimmedPrompt, options.model || '', this.getSystemPrompt()))
        });

        if (!response.ok) throw new Error(`Venice Error: ${response.statusText}`);

        const data = await response.json();
        const rawCode = this.veniceConfig.parseResponse(data);

        if (rawCode) {
          const result: AgentResponse = {
            code: this.cleanCode(rawCode),
            prompt: trimmedPrompt,
            confidence: 0.98,
            provider: 'venice',
            timestamp: Date.now()
          };
          this.cache.set(trimmedPrompt, result);
          return result;
        }
      } catch (error) {
        console.warn(`Venice synthesis failed:`, error);
      }
    }

    return this.getMockResponse(trimmedPrompt);
  }

  private getMockResponse(prompt: string): AgentResponse {
    return {
      code: mockAgentGenerate(prompt),
      prompt,
      confidence: 0.8,
      provider: 'mock',
      timestamp: Date.now()
    };
  }

  private getSystemPrompt(): string {
    return `You are the Sonic Guardian synthesis engine. Translate musical descriptions into valid Strudel pattern code.
Use: s("pd").bank("tr909"). Chain methods: .bank(), .distort(), .lpf(), .hpf(), .slow(), .fast(), .dec(), .gain().
Example: "industrial technp" -> s("[bd*2, [~ sn]*2, hh*4]").bank("tr909").distort(2)
Return ONLY code. No markdown or prose.`.trim();
  }

  private cleanCode(code: string): string {
    return code
      .replace(/```(?:javascript|js)?\n?/g, '')
      .replace(/```$/g, '')
      .replace(/^[:$]\s*/, '')
      .trim();
  }

  satisfiesInferenceRequirements(): boolean {
    return !!process.env.VENICE_API_KEY;
  }
}

export const sonicAgent = new SonicAgent();

export function isAgentConfigured(): boolean {
  return sonicAgent.satisfiesInferenceRequirements();
}

export async function generateStrudelCode(prompt: string, options?: AgentOptions): Promise<AgentResponse> {
  return await sonicAgent.generateCode(prompt, options);
}