import { NextRequest, NextResponse } from 'next/server';
import { generateStrudelCode, sonicAgent } from '@/lib/ai-agent';
import { rateLimiter, validators, createAPIResponse, createAPIError } from '@/lib/api';

/**
 * POST /api/agent/generate
 * Generate Strudel code from prompt using AI agent
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const body = await request.json();
    const { prompt, options } = body;

    // Input validation
    const validatedPrompt = validators.prompt(prompt);

    // Generate code using AI agent
    const response = await generateStrudelCode(validatedPrompt, options);

    return createAPIResponse({
      code: response.code,
      prompt: response.prompt,
      confidence: response.confidence,
      timestamp: response.timestamp,
      usingRealAI: sonicAgent.isRealAIEnabled()
    });
  } catch (error) {
    console.error('AI agent API error:', error);
    
    if (error instanceof Error && error.name === 'APIError') {
      return createAPIError(error.message, error.code, error.status);
    }
    
    return createAPIError('Failed to generate code', 'GENERATION_ERROR', 500);
  }
}

/**
 * GET /api/agent/generate?prompt=...
 * Synchronous code generation for client-side usage
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');

    if (!prompt) {
      return createAPIError('Prompt parameter is required', 'MISSING_PROMPT', 400);
    }

    // Input validation
    const validatedPrompt = validators.prompt(prompt);

    // Generate code using AI agent
    const response = await generateStrudelCode(validatedPrompt);

    return createAPIResponse({
      code: response.code,
      prompt: response.prompt,
      confidence: response.confidence,
      timestamp: response.timestamp,
      usingRealAI: sonicAgent.isRealAIEnabled()
    });
  } catch (error) {
    console.error('AI agent API error:', error);
    
    if (error instanceof Error && error.name === 'APIError') {
      return createAPIError(error.message, error.code, error.status);
    }
    
    return createAPIError('Failed to generate code', 'GENERATION_ERROR', 500);
  }
}

/**
 * OPTIONS /api/agent/generate
 * CORS preflight handler
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' 
        : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}