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

CRITICAL RULES:
- Use exact bank names: RolandTR808, RolandTR909, RolandTR606, RolandTR707 (NOT tr909 or TR909)
- Use s() for samples: s("bd sd hh"), note() for melody: note("c4 e4 g4")
- Layer patterns using stack(): stack(s("bd*4"), s("~ sd ~ sd"))

EFFECTS (chain with .):
.bank("RolandTR909") .distort(n) .lpf(freq) .hpf(freq) .slow(n) .fast(n) .gain(n) .room(n) .crush(n)

WORKING EXAMPLES:
- "techno": stack(s("bd*2, [~ bd] ~").bank("RolandTR909"), s("~ sd ~ sd").bank("RolandTR909"), s("hh*8").gain(0.4))
- "ambient": note("c4 eb4 g4").s("pad").slow(4).room(0.8)
- "acid bass": note("c2 [~ c3] bb1").s("sawtooth").lpf(800).lpq(20).distort(2)
- "breaks": s("amen").chop(8).speed("<1 0.8 1.2>")

Return ONLY valid code. No markdown, no explanation.`.trim();
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