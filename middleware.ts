// Root Middleware - Route Protection
// Sajian Sematang - Phase R2
// 
// This middleware runs on EVERY request to protect routes
// and manage authentication sessions

import { type NextRequest } from 'next/server';
import { updateSession } from './lib/auth/middleware';

/**
 * Middleware to protect routes and manage authentication
 * Delegates to lib/auth/middleware.ts for actual logic
 */
export async function middleware(request: NextRequest) {
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
