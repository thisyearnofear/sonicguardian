import { NextRequest, NextResponse } from 'next/server';
import { extractSonicDNA, extractSonicDNASync } from '@/lib/dna';
import { rateLimiter, validators, createAPIResponse, createAPIError } from '@/lib/api';

/**
 * POST /api/dna/extract
 * Extracts Sonic DNA from Strudel code with enhanced security
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const body = await request.json();
    const { code, options } = body;

    // Input validation
    const validatedCode = validators.code(code);

    // Extract DNA with enhanced security
    const dna = await extractSonicDNA(validatedCode, {
      salt: options?.salt,
      includeTimestamp: true
    });

    if (!dna) {
      return createAPIError('Failed to extract DNA from code', 'EXTRACTION_FAILED', 400);
    }

    return createAPIResponse({
      ...dna,
      // Remove sensitive data from response
      salt: undefined // Don't expose salt in response
    });
  } catch (error) {
    console.error('DNA extraction API error:', error);
    
    if (error instanceof Error && error.name === 'APIError') {
      return createAPIError(error.message, error.code, error.status);
    }
    
    return createAPIError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/dna/extract?code=...
 * Synchronous DNA extraction for client-side usage
 */
export function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return createAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return createAPIError('Code parameter is required', 'MISSING_CODE', 400);
    }

    // Input validation
    const validatedCode = validators.code(code);

    // Extract DNA synchronously for client-side compatibility
    const dna = extractSonicDNASync(validatedCode, {
      includeTimestamp: true
    });

    if (!dna) {
      return createAPIError('Failed to extract DNA from code', 'EXTRACTION_FAILED', 400);
    }

    return createAPIResponse({
      dna: dna.dna,
      hash: dna.hash,
      timestamp: dna.timestamp
      // Don't expose salt in response
    });
  } catch (error) {
    console.error('DNA extraction API error:', error);
    
    if (error instanceof Error && error.name === 'APIError') {
      return createAPIError(error.message, error.code, error.status);
    }
    
    return createAPIError('Internal server error', 'INTERNAL_ERROR', 500);
  }
}

/**
 * OPTIONS /api/dna/extract
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