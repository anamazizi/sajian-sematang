// lib/rate-limiting.ts
// Basic rate limiting for API protection (Phase 9 - Security Audit)
// Master Prompt Section 109: Rate Limiting & Abuse Prevention

import { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting (for demo/development)
// In production, consider using Redis or a distributed store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clear old entries periodically (simple cleanup)
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldEntries, 5 * 60 * 1000);

export function checkRateLimit(
  request: NextRequest,
  options: {
    limit: number;      // requests per window
    windowMs: number;   // window in milliseconds
    identifier?: string // custom identifier (default: IP)
  }
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const identifier = options.identifier || ip;
  const key = `${identifier}:${options.limit}:${options.windowMs}`;
  
  const now = Date.now();
  const windowStart = Math.floor(now / options.windowMs) * options.windowMs;
  const resetTime = windowStart + options.windowMs;
  
  const entry = rateLimitStore.get(key);
  
  if (entry && entry.resetTime > now) {
    // Still in same window
    if (entry.count >= options.limit) {
      return {
        success: false,
        limit: options.limit,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    // Increment count
    entry.count += 1;
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - entry.count,
      resetTime: entry.resetTime
    };
  } else {
    // New window or expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime
    });
    
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetTime
    };
  }
}

// Rate limiting configuration for different endpoints
export const rateLimitConfig = {
  // Checkout endpoint - prevent spam orders
  checkout: {
    limit: 10,     // 10 requests
    windowMs: 60 * 1000, // per minute
  },
  
  // Login attempts - prevent brute force
  login: {
    limit: 5,      // 5 attempts
    windowMs: 15 * 60 * 1000, // per 15 minutes
  },
  
  // Like button - prevent spam likes
  like: {
    limit: 30,     // 30 requests
    windowMs: 5 * 60 * 1000, // per 5 minutes
  },
  
  // General API endpoints
  api: {
    limit: 100,    // 100 requests
    windowMs: 60 * 1000, // per minute
  }
};

export function getRateLimitHeaders(
  request: NextRequest,
  config: typeof rateLimitConfig.checkout
) {
  const result = checkRateLimit(request, config);
  
  return {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  };
}