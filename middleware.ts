// Root Middleware - Route Protection & Rate Limiting
// Sajian Sematang - Phase R2 + Phase 9 Security Updates
// 
// This middleware runs on EVERY request to protect routes
// manage authentication sessions, and implement rate limiting

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/auth/middleware';
import { checkRateLimit, rateLimitConfig } from './lib/rate-limiting';

/**
 * Middleware to protect routes, manage authentication, and apply rate limiting
 */
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;
  
  // Apply rate limiting for critical endpoints (Phase 9 - Security Audit)
  if (url.startsWith('/order/') && !url.includes('/success/')) {
    // Checkout endpoint rate limiting
    const rateLimitResult = checkRateLimit(request, rateLimitConfig.checkout);
    
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Terlalu banyak percubaan checkout. Sila cuba sebentar lagi.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfig.checkout.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }
  }
  
  // Login endpoint rate limiting
  if (url.startsWith('/auth/login')) {
    const rateLimitResult = checkRateLimit(request, rateLimitConfig.login);
    
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Terlalu banyak percubaan login. Sila cuba selepas 15 minit.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfig.login.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }
  }
  
  // Like button rate limiting
  if (url.includes('/like')) {
    const rateLimitResult = checkRateLimit(request, rateLimitConfig.like);
    
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Terlalu banyak aktiviti "like". Sila cuba sebentar lagi.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfig.like.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }
  }
  
  // API endpoints rate limiting
  if (url.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(request, rateLimitConfig.api);
    
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Terlalu banyak permintaan API. Sila cuba sebentar lagi.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfig.api.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }
  }
  
  // Continue with authentication middleware
  return await updateSession(request);
}

/**
 * Matcher configuration
 * Runs middleware on all routes EXCEPT:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon
 * - Image files (svg, png, jpg, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files with image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
