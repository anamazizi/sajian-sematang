// Next.js Middleware for authentication
// This runs on every request to protected routes

// IMPORTANT: Middleware is currently DISABLED
// To enable:
// 1. Setup Google OAuth in Supabase
// 2. Run database migration
// 3. Set environment variables
// 4. Uncomment the code below

/*
import { updateSession } from './lib/auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
*/

// Temporary: Export empty middleware to prevent errors
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
