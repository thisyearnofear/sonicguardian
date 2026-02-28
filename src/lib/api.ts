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
export class BaseAPIError extends Error {
  constructor(
    public message: string,
    public code: string = 'UNKNOWN_ERROR',
    public status: number = 500
  ) {
    super(message);
    this.name = 'BaseAPIError';
  }
}

/**
 * Rate limiting utility with enhanced security
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequests: number = 10;
  private readonly burstLimit: number = 3; // Allow bursts of 3 requests
  private readonly burstWindowMs: number = 5000; // 5 seconds

  isAllowed(identifier: string): boolean {
    try {
      if (!identifier || typeof identifier !== 'string') {
        return false;
      }

      const now = Date.now();
      const userRequests = this.requests.get(identifier) || [];

      // Remove old requests outside the window
      const validRequests = userRequests.filter(
        timestamp => now - timestamp < this.windowMs
      );

      // Check burst limit
      const recentRequests = userRequests.filter(
        timestamp => now - timestamp < this.burstWindowMs
      );

      if (validRequests.length >= this.maxRequests || recentRequests.length >= this.burstLimit) {
        return false;
      }

      validRequests.push(now);
      this.requests.set(identifier, validRequests);
      return true;
    } catch (error) {
      console.error('Rate limiter error:', error);
      return false;
    }
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Input validation utilities with enhanced security
 */
export const validators = {
  prompt: (prompt: string): string => {
    try {
      if (!prompt || typeof prompt !== 'string') {
        throw new BaseAPIError('Invalid prompt provided', 'INVALID_PROMPT', 400);
      }

      const trimmed = prompt.trim();
      
      // Enhanced validation
      if (trimmed.length < 3 || trimmed.length > 500) {
        throw new BaseAPIError('Prompt must be between 3 and 500 characters', 'INVALID_PROMPT_LENGTH', 400);
      }

      // Check for potentially malicious content
      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /data:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
        /function\s*\(/i
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(trimmed)) {
          throw new BaseAPIError('Prompt contains potentially malicious content', 'INVALID_PROMPT_CONTENT', 400);
        }
      }

      return trimmed;
    } catch (error) {
      if (error instanceof BaseAPIError) {
        throw error;
      }
      throw new BaseAPIError('Failed to validate prompt', 'VALIDATION_ERROR', 400);
    }
  },

  code: (code: string): string => {
    try {
      if (!code || typeof code !== 'string') {
        throw new BaseAPIError('Invalid code provided', 'INVALID_CODE', 400);
      }

      const trimmed = code.trim();
      
      if (trimmed.length > 2000) {
        throw new BaseAPIError('Code too long', 'CODE_TOO_LONG', 400);
      }

      // Validate Strudel syntax patterns
      const validPatterns = [
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

      const hasValidPattern = validPatterns.some(pattern => pattern.test(trimmed));
      if (!hasValidPattern && trimmed.length > 0) {
        throw new BaseAPIError('Code must contain valid Strudel patterns', 'INVALID_CODE_SYNTAX', 400);
      }

      return trimmed;
    } catch (error) {
      if (error instanceof BaseAPIError) {
        throw error;
      }
      throw new BaseAPIError('Failed to validate code', 'VALIDATION_ERROR', 400);
    }
  },

  btcAddress: (address: string): string => {
    try {
      if (!address || typeof address !== 'string') {
        throw new BaseAPIError('Invalid Bitcoin address provided', 'INVALID_BTC_ADDRESS', 400);
      }

      const trimmed = address.trim();
      
      // Basic format validation
      const p2pkhRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
      const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
      const bech32Regex = /^(bc1)[a-z0-9]{39,87}$/;
      
      if (!p2pkhRegex.test(trimmed) && !p2shRegex.test(trimmed) && !bech32Regex.test(trimmed)) {
        throw new BaseAPIError('Invalid Bitcoin address format', 'INVALID_BTC_ADDRESS_FORMAT', 400);
      }

      return trimmed;
    } catch (error) {
      if (error instanceof BaseAPIError) {
        throw error;
      }
      throw new BaseAPIError('Failed to validate Bitcoin address', 'VALIDATION_ERROR', 400);
    }
  },

  hexValue: (value: string): string => {
    try {
      if (!value || typeof value !== 'string') {
        throw new BaseAPIError('Invalid hex value provided', 'INVALID_HEX_VALUE', 400);
      }

      const clean = value.replace(/^0x/, '');
      if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length === 0) {
        throw new BaseAPIError('Invalid hex value format', 'INVALID_HEX_FORMAT', 400);
      }

      return value;
    } catch (error) {
      if (error instanceof BaseAPIError) {
        throw error;
      }
      throw new BaseAPIError('Failed to validate hex value', 'VALIDATION_ERROR', 400);
    }
  }
};

/**
 * CORS headers for API responses with security enhancements
 */
export const getCORSHeaders = (): Record<string, string> => {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
        ? origin
        : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  } catch (error) {
    console.error('Failed to get CORS headers:', error);
    return {};
  }
};

/**
 * Security headers for API responses
 */
export const getSecurityHeaders = (): Record<string, string> => {
  try {
    return {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };
  } catch (error) {
    console.error('Failed to get security headers:', error);
    return {};
  }
};

/**
 * Standard API response wrapper with enhanced security
 */
export const createAPIResponse = <T>(
  data: T,
  status: number = 200
): Response => {
  try {
    return new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders(),
        ...getSecurityHeaders()
      }
    });
  } catch (error) {
    console.error('Failed to create API response:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create response'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const createAPIError = (
  error: string,
  code: string = 'UNKNOWN_ERROR',
  status: number = 500
): Response => {
  try {
    // Don't expose sensitive error details in production
    const safeError = process.env.NODE_ENV === 'production' && status >= 500 
      ? 'Internal server error' 
      : error;

    return new Response(JSON.stringify({
      success: false,
      error: safeError,
      code,
      ...(process.env.NODE_ENV === 'development' && { debug: error })
    }), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders(),
        ...getSecurityHeaders()
      }
    });
  } catch (responseError) {
    console.error('Failed to create API error response:', responseError);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create error response'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

/**
 * Environment validation
 */
export const validateEnvironment = () => {
  try {
    const requiredEnvVars = [];
    
    if (process.env.NEXT_PUBLIC_USE_REAL_AI === 'true') {
      requiredEnvVars.push('VENICE_API_KEY');
    }

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new BaseAPIError(
        `Missing required environment variables: ${missing.join(', ')}`,
        'MISSING_ENV_VARS',
        500
      );
    }
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
};

/**
 * Enhanced fetch wrapper with comprehensive error handling
 */
export const secureFetch = async <T>(
  url: string,
  options: RequestInit = {},
  identifier?: string
): Promise<APIResponse<T>> => {
  try {
    // Validate inputs
    if (!url || typeof url !== 'string') {
      throw new BaseAPIError('Invalid URL provided', 'INVALID_URL', 400);
    }

    // Apply rate limiting if identifier provided
    if (identifier && !rateLimiter.isAllowed(identifier)) {
      throw new BaseAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    }

    // Add security headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new BaseAPIError(
        `HTTP error! status: ${response.status} - ${response.statusText}`,
        'HTTP_ERROR',
        response.status
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new BaseAPIError('Invalid response format: expected JSON', 'INVALID_RESPONSE_FORMAT', 500);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error instanceof BaseAPIError) {
      return { success: false, error: error.message, code: error.code };
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out', code: 'TIMEOUT_ERROR' };
      }
      return { success: false, error: error.message, code: 'FETCH_ERROR' };
    }

    return { success: false, error: 'Unknown error occurred', code: 'UNKNOWN_ERROR' };
  }
};
