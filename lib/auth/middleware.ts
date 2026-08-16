// Auth middleware for server-side route protection
// Sajian Sematang v2.0

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessRoute } from './permissions';
import type { UserRole } from '../../types/database';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const publicRoutes = ['/', '/sellers', '/preorder', '/auth/login'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/sellers/'));

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !pathname.startsWith('/auth')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated, check profile completion
  if (user && !pathname.startsWith('/auth/profile') && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check if profile is complete
    if (profile) {
      const hasName = !!profile.name;
      const hasEmail = !!profile.email;
      const hasPhone = !!profile.phone_number;
      
      let isComplete = hasName && hasEmail;
      
      if (profile.role === 'seller') {
        isComplete = isComplete && hasPhone && !!profile.address;
      } else if (profile.role === 'admin' || profile.role === 'staff') {
        isComplete = isComplete && hasPhone;
      }

      // Redirect to profile completion if incomplete
      if (!isComplete) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/auth/profile';
        return NextResponse.redirect(redirectUrl);
      }

      // Check role-based access
      const userRole = profile.role as UserRole;
      if (!canAccessRoute(userRole, pathname)) {
        // Redirect to appropriate dashboard
        const redirectUrl = request.nextUrl.clone();
        
        if (userRole === 'admin') {
          redirectUrl.pathname = '/admin';
        } else if (userRole === 'staff') {
          redirectUrl.pathname = '/staff';
        } else if (userRole === 'seller') {
          redirectUrl.pathname = '/dashboard';
        } else {
          redirectUrl.pathname = '/sellers';
        }
        
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}
