/**
 * AI Agent for Sonic Guardian
 * Privacy-focused inference using Venice AI (default) with Gemini fallback.
 * Consolidates multiple providers into a unified strategy to prevent bloat.
 */

import { mockAgentGenerate } from './dna';

export interface AgentOptions {
  useRealAI?: boolean;
  apiKey?: string;
  model?: string;
  provider?: 'venice' | 'gemini';
}

export interface AgentResponse {
  code: string;
  prompt: string;
  confidence: number;
  provider: string;
  timestamp: number;
}

type ProviderConfig = {
  url: string;
  headers: (key: string) => Record<string, string>;
  formatBody: (prompt: string, model: string, systemPrompt: string) => any;
  parseResponse: (data: any) => string;
};

class SonicAgent {
  private cache: Map<string, AgentResponse> = new Map();
  private readonly cacheTTL: number = 5 * 60 * 1000;

  private providers: Record<string, ProviderConfig> = {
    venice: {
      url: 'https://api.venice.ai/api/v1/chat/completions',
      headers: (key) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      }),
      formatBody: (prompt, model, system) => ({
        model: model || 'llama-3.1-405b',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      }),
      parseResponse: (data) => data.choices?.[0]?.message?.content
    },
    gemini: {
      url: 'https://generativelanguage.googleapis.com/v1/models/', // Appended later
      headers: () => ({ 'Content-Type': 'application/json' }),
      formatBody: (prompt, model, system) => ({
        contents: [{ parts: [{ text: `${system}\n\nPrompt: ${prompt}` }] }],
        generationConfig: { temperature: 0.1 }
      }),
      parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text
    }
  };

  async generateCode(prompt: string, options: AgentOptions = {}): Promise<AgentResponse> {
    const trimmedPrompt = prompt.trim().toLowerCase();

    const cached = this.cache.get(trimmedPrompt);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) return cached;

    const useRealAI = options.useRealAI ?? (process.env.NEXT_PUBLIC_USE_REAL_AI === 'true');
    const selectedProvider = options.provider ?? (process.env.NEXT_PUBLIC_AI_PROVIDER as any) ?? 'venice';

    if (useRealAI) {
      const providersToTry = selectedProvider === 'venice' ? ['venice', 'gemini'] : ['gemini', 'venice'];

      for (const providerId of providersToTry) {
        const apiKey = providerId === 'venice' ? process.env.VENICE_API_KEY : process.env.GEMINI_API_KEY;
        if (!apiKey) continue;

        try {
          const config = this.providers[providerId];
          let url = config.url;
          if (providerId === 'gemini') {
            url += `${options.model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`;
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: config.headers(apiKey),
            body: JSON.stringify(config.formatBody(trimmedPrompt, options.model || '', this.getSystemPrompt()))
          });

          if (!response.ok) throw new Error(`${providerId} Error: ${response.statusText}`);

          const data = await response.json();
          const rawCode = config.parseResponse(data);

          if (rawCode) {
            const result: AgentResponse = {
              code: this.cleanCode(rawCode),
              prompt: trimmedPrompt,
              confidence: 0.95,
              provider: providerId,
              timestamp: Date.now()
            };
            this.cache.set(trimmedPrompt, result);
            return result;
          }
        } catch (error) {
          console.warn(`Provider ${providerId} failed:`, error);
        }
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
Example: "industrial" -> s("[bd*2, [~ sn]*2]").bank("tr909").distort(2)
Return ONLY code. No markdown.`.trim();
  }

  private cleanCode(code: string): string {
    return code
      .replace(/```(?:javascript|js)?\n?/g, '')
      .replace(/```$/g, '')
      .replace(/^[:$]\s*/, '')
      .trim();
  }

  satisfiesInferenceRequirements(): boolean {
    return !!(process.env.VENICE_API_KEY || process.env.GEMINI_API_KEY);
  }
}

export const sonicAgent = new SonicAgent();

export function isAgentConfigured(): boolean {
  return sonicAgent.satisfiesInferenceRequirements();
}

export async function generateStrudelCode(prompt: string, options?: AgentOptions): Promise<AgentResponse> {
  return await sonicAgent.generateCode(prompt, options);
}