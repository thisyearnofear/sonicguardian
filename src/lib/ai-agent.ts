/**
 * AI Agent for Sonic Guardian
 * Pure, privacy-focused inference using Venice AI.
 * Disables non-private fallbacks to ensure ZK integrity of the acoustic signature.
 */

import { getTemplateVibe } from './dna';

export interface AgentOptions {
  useRealAI?: boolean;
  apiKey?: string;
  model?: string;
}

export interface AgentResponse {
  code: string;
  prompt: string;
  confidence: number;
  provider: 'venice' | 'template';
  timestamp: number;
}

class SonicAgent {
  private cache: Map<string, AgentResponse> = new Map();
  private readonly cacheTTL: number = 5 * 60 * 1000;

  private readonly veniceConfig = {
    url: 'https://api.venice.ai/api/v1/chat/completions',
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'User-Agent': 'SonicGuardian/1.0'
    }),
    formatBody: (prompt: string, model: string, system: string) => ({
      model: model || 'llama-3.1-405b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content
  };

  async generateCode(prompt: string, options: AgentOptions = {}): Promise<AgentResponse> {
    const trimmedPrompt = prompt.trim().toLowerCase();

    // Check cache first
    const cached = this.cache.get(trimmedPrompt);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) return cached;

    const useRealAI = options.useRealAI ?? (process.env.NEXT_PUBLIC_USE_REAL_AI === 'true');
    const veniceKey = process.env.VENICE_API_KEY;

    if (useRealAI && veniceKey) {
      try {
        const response = await fetch(this.veniceConfig.url, {
          method: 'POST',
          headers: this.veniceConfig.headers(veniceKey),
          body: JSON.stringify(this.veniceConfig.formatBody(trimmedPrompt, options.model || '', this.getSystemPrompt())),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (!response.ok) {
          throw new Error(`Venice Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const rawCode = this.veniceConfig.parseResponse(data);

        if (rawCode) {
          const cleanedCode = this.cleanCode(rawCode);
          
          // Validate the generated code
          if (!this.validateStrudelCode(cleanedCode)) {
            throw new Error('Generated code failed validation');
          }

          const result: AgentResponse = {
            code: cleanedCode,
            prompt: trimmedPrompt,
            confidence: 0.98,
            provider: 'venice',
            timestamp: Date.now()
          };
          this.cache.set(trimmedPrompt, result);
          return result;
        } else {
          throw new Error('No code generated from AI response');
        }
      } catch (error) {
        console.warn(`Venice synthesis failed, falling back to template:`, error);
      }
    }

    return this.getTemplateResponse(trimmedPrompt);
  }

  private validateStrudelCode(code: string): boolean {
    // Basic validation for Strudel syntax
    const requiredPatterns = [
      /^s\(/,
      /^note\(/,
      /^stack\(/,
      /^slow\(/,
      /^fast\(/,
      /^distort\(/,
      /^lpf\(/,
      /^hpf\(/,
      /^gain\(/,
      /^room\(/
    ];

    const hasValidPattern = requiredPatterns.some(pattern => pattern.test(code));
    const hasBalancedParens = (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length;
    const hasValidQuotes = (code.match(/"/g) || []).length % 2 === 0;

    return (hasValidPattern || code.length > 0) && hasBalancedParens && hasValidQuotes;
  }

  private getTemplateResponse(prompt: string): AgentResponse {
    return {
      code: getTemplateVibe(prompt),
      prompt,
      confidence: 0.95,
      provider: 'template',
      timestamp: Date.now()
    };
  }

  private getSystemPrompt(): string {
    return `You are the Sonic Guardian synthesis engine, an expert in live-coded algorithmic music. Your task is to translate evocative musical descriptions into sophisticated, valid Strudel pattern code. 

CRITICAL RULES:
- ONLY use these drum samples: bd (bass drum), sd (snare), hh (hi-hat), hc (closed hi-hat), ho (open hi-hat), cp (clap), 808 (808 tom)
- Use s() for drum patterns with these sample names
- DO NOT use piano, fm, gm_pad, or any other synth/sound unless you also load them
- Layer multiple patterns using stack() for complexity
- ALWAYS include subtle variations or probabilistic modifiers (e.g., .sometimes(), .when(), .struct()) to ensure uniqueness

ADVANCED PRIMITIVES:
- stack(p1, p2, p3) - Layers
- .struct("hh [hh hh] hh/2") - Complex rhythms (use existing samples)
- .scale("c:minor") - Harmonic constraints
- .lpf(freq).lpq(q) - Resonant filtering
- .room(reverb).gain(gain) - Spatial/Mixing
- .slow(n).fast(n).chop(n) - Temporal manipulation

VALID DRUM PATTERN EXAMPLES:
- "Driving Techno": stack(s("bd*4").lpf("<400 800 1200>"), s("~ [sd/2 cp] ~ sd").distort(2), s("hh*16").gain(0.4).struct("hh [hh hh] hh/2")).cpm(132)
- "Breakbeat Acid": s("bd ~ [bd ~] ~ [~ bd bd ~] sd ~ ~ ~ cp").swing(0.1)
- "Minimal House": stack(s("bd*4").gain(1), s("~ sd ~ sd").speed("<1 1.5>"), s("hh*4").gain(0.3))

Return ONLY valid Strudel code. No markdown, no explanations, no text outside the code.`.trim();
  }

  private cleanCode(code: string): string {
    return code
      .replace(/```(?:javascript|js)?\n?/g, '')
      .replace(/```$/g, '')
      .replace(/^[:$]\s*/, '')
      .replace(/\/\/.*$/gm, '') // Remove comments
      .trim();
  }

  satisfiesInferenceRequirements(): boolean {
    return !!process.env.VENICE_API_KEY;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const sonicAgent = new SonicAgent();

export function isAgentConfigured(): boolean {
  return sonicAgent.satisfiesInferenceRequirements();
}

export async function generateStrudelCode(prompt: string, options?: AgentOptions): Promise<AgentResponse> {
  return await sonicAgent.generateCode(prompt, options);
}
