/**
 * API utilities for Sonic Guardian
 * Consolidates all API-related functionality with proper error handling
 */

export interface APISuccess<T> {
  success: true;
  data: T;
}

export interface APIError {
  success: false;
  error: string;
  code?: string;
}

export type APIResponse<T> = APISuccess<T> | APIError;

/**
 * Enhanced error handling for API responses
 */
export class APIError extends Error {
  constructor(
    public message: string,
    public code: string = 'UNKNOWN_ERROR',
    public status: number = 500
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Rate limiting utility
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequests: number = 10;

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Input validation utilities
 */
export const validators = {
  prompt: (prompt: string): string => {
    if (!prompt || typeof prompt !== 'string') {
      throw new APIError('Invalid prompt provided', 'INVALID_PROMPT', 400);
    }
    
    const trimmed = prompt.trim();
    if (trimmed.length < 3 || trimmed.length > 500) {
      throw new APIError('Prompt must be between 3 and 500 characters', 'INVALID_PROMPT_LENGTH', 400);
    }
    
    return trimmed;
  },

  code: (code: string): string => {
    if (!code || typeof code !== 'string') {
      throw new APIError('Invalid code provided', 'INVALID_CODE', 400);
    }
    
    const trimmed = code.trim();
    if (trimmed.length > 1000) {
      throw new APIError('Code too long', 'CODE_TOO_LONG', 400);
    }
    
    return trimmed;
  }
};

/**
 * CORS headers for API responses
 */
export const getCORSHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
});

/**
 * Standard API response wrapper
 */
export const createAPIResponse = <T>(
  data: T,
  status: number = 200
): Response => {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders()
    }
  });
};

export const createAPIError = (
  error: string,
  code: string = 'UNKNOWN_ERROR',
  status: number = 500
): Response => {
  return new Response(JSON.stringify({ 
    success: false, 
    error, 
    code 
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders()
    }
  });
};