import { NextRequest, NextResponse } from 'next/server';
import { extractSonicDNA } from '@/lib/dna';
import { rateLimiter, createAPIResponse, createAPIError, validators, validateEnvironment } from '@/lib/api';

/**
 * DNA Extraction API Route
 * Consolidates DNA extraction endpoints with robust error handling
 */

/**
 * POST /api/dna/extract
 */
export async function POST(request: NextRequest) {
  try {
    // Validate environment first
    validateEnvironment();

    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const body = await request.json();
    const { code, options } = body;

    // Validate code
    const validatedCode = validators.code(code);

    const dna = await extractSonicDNA(validatedCode, {
      salt: options?.salt,
      includeTimestamp: true
    });

    if (!dna) {
      return createAPIError('Failed to extract DNA from code', 'EXTRACTION_FAILED', 400);
    }

    return createAPIResponse({
      dna: dna.dna,
      hash: dna.hash,
      timestamp: dna.timestamp
    });
  } catch (error: any) {
    return handleAPIError(error);
  }
}

/**
 * GET /api/dna/extract?code=...
 */
export async function GET(request: NextRequest) {
  try {
    // Validate environment first
    validateEnvironment();

    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return createAPIError('Code parameter is required', 'MISSING_CODE', 400);
    }

    // Validate code
    const validatedCode = validators.code(code);

    const dna = await extractSonicDNA(validatedCode, {
      includeTimestamp: true
    });

    if (!dna) {
      return createAPIError('Failed to extract DNA from code', 'EXTRACTION_FAILED', 400);
    }

    return createAPIResponse({
      dna: dna.dna,
      hash: dna.hash,
      timestamp: dna.timestamp
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
