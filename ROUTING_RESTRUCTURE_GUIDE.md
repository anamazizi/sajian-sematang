# 🔐 Routing Restructure Guide - Secret Portals

Panduan untuk restructure routing dengan portal rahsia untuk Seller dan Admin.

---

## 🎯 Objektif

1. Halaman utama `/` = Customer login sahaja
2. Portal Seller rahsia: `/portal-seller`
3. Portal Admin rahsia: `/portal-admin-v2`
4. Middleware protect semua routes
5. Redirect unauthorized users ke `/`

---

## 📝 Perubahan Yang Perlu Dibuat

### 1. Update Halaman Utama (app/page.tsx)

**Current**: Homepage dengan navigation ke dashboard, sellers, etc.

**New**: Customer login page sahaja

```typescript
// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth/hooks';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // If already logged in as customer, redirect to sellers
    if (!loading && user && profile?.role === 'customer') {
      router.push('/sellers');
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🍽️ Sajian Sematang
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Platform Pesanan Makanan Tempatan
          </p>
        </div>

        {/* Customer Login/Browse */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-6">Selamat Datang!</h2>
            <p className="text-gray-600 mb-8">
              Jelajahi pelbagai pilihan makanan dari peniaga tempatan
            </p>
            
            {/* Browse as Guest */}
            <a
              href="/sellers"
              className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg mb-4"
            >
              🛒 Jelajah Menu
            </a>

            {/* Optional: Login for saved preferences */}
            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-gray-500 mb-4">
                Sudah ada akaun? Log masuk untuk pengalaman lebih baik
              </p>
              <a
                href="/auth/login"
                className="inline-block text-green-600 hover:text-green-700 font-medium"
              >
                Log Masuk
              </a>
            </div>
          </div>
        </div>

        {/* Footer - NO links to admin/seller portals */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2026 Sajian Sematang. Hak Cipta Terpelihara.</p>
        </footer>
      </div>
    </div>
  );
}
```

---

### 2. Create Portal Seller (app/portal-seller/page.tsx)

**New File**: Secret seller login portal

```typescript
// app/portal-seller/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, useAuth } from '../../lib/auth/hooks';

export default function SellerPortalPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in as seller, redirect to dashboard
    if (!loading && user && profile) {
      if (profile.role === 'seller') {
        router.push('/dashboard');
      } else if (profile.role === 'admin' || profile.role === 'staff') {
        router.push('/admin');
      } else {
        // Not authorized, redirect to home
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  async function handleGoogleSignIn() {
    try {
      setSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Ralat semasa log masuk');
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-green-600 p-4 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Portal Peniaga
          </h1>
          <p className="text-gray-400">
            Sajian Sematang
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Log Masuk Peniaga
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-100 transition font-semibold disabled:opacity-50"
          >
            {signingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                <span>Sedang log masuk...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Log Masuk dengan Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Hanya untuk peniaga berdaftar
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-300 text-sm text-center">
            ⚠️ Portal ini hanya untuk peniaga. Akses tanpa kebenaran adalah dilarang.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Create Portal Admin (app/portal-admin-v2/page.tsx)

**New File**: Secret admin/staff login portal

```typescript
// app/portal-admin-v2/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, useAuth } from '../../lib/auth/hooks';

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in as admin/staff, redirect to admin dashboard
    if (!loading && user && profile) {
      if (profile.role === 'admin' || profile.role === 'staff') {
        router.push('/admin');
      } else {
        // Not authorized, redirect to home
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  async function handleGoogleSignIn() {
    try {
      setSigningIn(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Ralat semasa log masuk');
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600 p-4 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Portal Admin
          </h1>
          <p className="text-gray-400">
            Sajian Sematang v2.0
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Log Masuk Admin/Staf
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-100 transition font-semibold disabled:opacity-50"
          >
            {signingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                <span>Sedang log masuk...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Log Masuk dengan Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Hanya untuk admin dan staf berdaftar
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-red-900/30 border border-red-700 rounded-lg p-4">
          <p className="text-red-300 text-sm text-center">
            🔒 Portal ini dilindungi. Akses tanpa kebenaran akan direkodkan.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Update Middleware (middleware.ts)

**Enable and update middleware** untuk protect routes

```typescript
// middleware.ts
import { updateSession } from './lib/auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes - accessible to everyone
  const publicRoutes = [
    '/',
    '/sellers',
    '/preorder',
    '/auth/login',
    '/auth/callback',
    '/auth/profile',
    '/portal-seller',
    '/portal-admin-v2',
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/sellers/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  const response = await updateSession(request);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

### 5. Update Auth Middleware Logic (lib/auth/middleware.ts)

**Update** untuk redirect unauthorized users

```typescript
// lib/auth/middleware.ts
// ... existing imports ...

export async function updateSession(request: NextRequest) {
  // ... existing code ...

  const pathname = request.nextUrl.pathname;

  // Protected routes
  const adminRoutes = ['/admin', '/portal-admin-v2'];
  const sellerRoutes = ['/dashboard', '/portal-seller'];
  const staffRoutes = ['/staff'];

  // Check if trying to access protected route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isSellerRoute = sellerRoutes.some(route => pathname.startsWith(route));
  const isStaffRoute = staffRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute || isSellerRoute || isStaffRoute) {
    // Must be authenticated
    if (!user) {
      // Redirect to home (hide existence of portal)
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    // Check role
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    // Check authorization
    if (isAdminRoute && profile.role !== 'admin' && profile.role !== 'staff') {
      // Not admin/staff, redirect to home
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    if (isSellerRoute && profile.role !== 'seller' && profile.role !== 'admin') {
      // Not seller, redirect to home
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    if (isStaffRoute && profile.role !== 'staff' && profile.role !== 'admin') {
      // Not staff, redirect to home
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
```

---

## 🔒 Security Features

1. **Hidden Portals**: URLs tidak dipamerkan di mana-mana
2. **Role-Based Redirect**: Unauthorized users → `/` (home)
3. **No Error Messages**: Tidak dedahkan portal existence
4. **Middleware Protection**: Server-side validation
5. **Session Verification**: Check auth pada setiap request

---

## 📊 URL Structure

```
Public (Everyone):
├── /                          → Customer homepage
├── /sellers                   → Browse sellers
├── /sellers/[id]              → Seller menu
├── /preorder                  → Pre-order page
└── /auth/*                    → Auth pages

Secret Portals (Hidden):
├── /portal-seller             → Seller login (secret)
├── /portal-admin-v2           → Admin login (secret)

Protected (After Login):
├── /dashboard                 → Seller dashboard
├── /admin                     → Admin dashboard
├── /admin/payouts             → Payout management
└── /staff                     → Staff dashboard
```

---

## ✅ Implementation Checklist

- [ ] Update `app/page.tsx` - Customer homepage
- [ ] Create `app/portal-seller/page.tsx` - Seller portal
- [ ] Create `app/portal-admin-v2/page.tsx` - Admin portal
- [ ] Enable `middleware.ts` - Uncomment code
- [ ] Update `lib/auth/middleware.ts` - Add redirect logic
- [ ] Test unauthorized access
- [ ] Test role-based redirects
- [ ] Remove all public links to portals
- [ ] Update documentation

---

## 🧪 Testing

### Test 1: Unauthorized Access
```
1. Open browser (not logged in)
2. Navigate to /admin
3. Should redirect to /
4. Navigate to /dashboard
5. Should redirect to /
```

### Test 2: Wrong Role Access
```
1. Login as customer
2. Try to access /admin
3. Should redirect to /
4. Try to access /dashboard
5. Should redirect to /
```

### Test 3: Correct Access
```
1. Navigate to /portal-seller
2. Login as seller
3. Should redirect to /dashboard
4. Navigate to /portal-admin-v2
5. Login as admin
6. Should redirect to /admin
```

---

**Status**: Documentation Complete
**Implementation Time**: 2-3 hours
**Priority**: High (Security Feature)
