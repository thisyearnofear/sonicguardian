import { NextRequest, NextResponse } from 'next/server';
import { extractSonicDNA } from '@/lib/dna';
import { rateLimiter, createAPIResponse, createAPIError, getCORSHeaders } from '@/lib/api';

/**
 * DNA Extraction API Route
 * Consolidates DNA extraction endpoints with robust error handling
 */

/**
 * POST /api/dna/extract
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const body = await request.json();
    const { code, options } = body;

    const dna = await extractSonicDNA(code, {
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
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return createAPIError('Code parameter is required', 'MISSING_CODE', 400);
    }

    const dna = await extractSonicDNA(code, {
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