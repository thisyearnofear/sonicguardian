import { NextRequest } from 'next/server';
import { generateStrudelCode, sonicAgent } from '@/lib/ai-agent';
import { rateLimiter, createAPIResponse, createAPIError } from '@/lib/api';

/**
 * AI Agent Generation API Route
 * Consolidates prompt-to-code generation with robust error handling
 */

/**
 * POST /api/agent/generate
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const body = await request.json();
    const { prompt, options } = body;

    const response = await generateStrudelCode(prompt, options);

    return createAPIResponse({
      code: response.code,
      prompt: response.prompt,
      confidence: response.confidence,
      timestamp: response.timestamp,
      usingRealAI: sonicAgent.isRealAIEnabled()
    });
  } catch (error: any) {
    return handleAPIError(error);
  }
}

/**
 * GET /api/agent/generate?prompt=...
 */
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');

    if (!prompt) {
      return createAPIError('Prompt parameter is required', 'MISSING_PROMPT', 400);
    }

    const response = await generateStrudelCode(prompt);

    return createAPIResponse({
      code: response.code,
      prompt: response.prompt,
      confidence: response.confidence,
      timestamp: response.timestamp,
      usingRealAI: sonicAgent.isRealAIEnabled()
    });
  } catch (error: any) {
    return handleAPIError(error);
  }
}

/**
 * OPTIONS handler for CORS
 */
export function OPTIONS() {
  return createAPIResponse(null, 204);
}

/**
 * Shared error handler for API routes
 */
function handleAPIError(error: any) {
  console.error('API Error:', error);
  if (error.name === 'APIError') {
    return createAPIError(error.message, error.code, error.status);
  }
  return createAPIError('Internal server error', 'INTERNAL_ERROR', 500);
}