'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/hooks';
import { canAccessRoute, getDefaultRedirectPath } from '../../lib/auth/permissions';
import { UserRole } from '../../types/database';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireCompleteProfile?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

/**
 * Component to protect entire routes/pages
 * Wrap your page content with this component to enforce authentication
 * 
 * Usage in page.tsx:
 * export default function AdminPage() {
 *   return (
 *     <ProtectedRoute requireAuth allowedRoles={['admin']}>
 *       <AdminContent />
 *     </ProtectedRoute>
 *   );
 * }
 */
export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireCompleteProfile = true,
  allowedRoles,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Check authentication
    if (requireAuth && !user) {
      const currentPath = window.location.pathname;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check profile completion
    if (requireAuth && requireCompleteProfile && user && profile) {
      const hasName = !!profile.name;
      const hasEmail = !!profile.email;
      const hasPhone = !!profile.phone_number;
      
      let isComplete = hasName && hasEmail;
      
      if (profile.role === 'seller') {
        isComplete = isComplete && hasPhone && !!profile.address;
      } else if (profile.role === 'admin' || profile.role === 'staff') {
        isComplete = isComplete && hasPhone;
      }

      if (!isComplete) {
        router.push('/auth/profile');
        return;
      }
    }

    // Check role-based access
    if (requireAuth && allowedRoles && profile) {
      const userRole = profile.role as UserRole;
      
      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard
        const destination = redirectTo || getDefaultRedirectPath(userRole);
        router.push(destination);
        return;
      }
    }
  }, [user, profile, loading, requireAuth, requireCompleteProfile, allowedRoles, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (requireAuth && !user) {
    return null; // Will redirect in useEffect
  }

  // Profile incomplete
  if (requireAuth && requireCompleteProfile && user && profile) {
    const hasName = !!profile.name;
    const hasEmail = !!profile.email;
    const hasPhone = !!profile.phone_number;
    
    let isComplete = hasName && hasEmail;
    
    if (profile.role === 'seller') {
      isComplete = isComplete && hasPhone && !!profile.address;
    } else if (profile.role === 'admin' || profile.role === 'staff') {
      isComplete = isComplete && hasPhone;
    }

    if (!isComplete) {
      return null; // Will redirect in useEffect
    }
  }

  // Role not allowed
  if (requireAuth && allowedRoles && profile) {
    const userRole = profile.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      return null; // Will redirect in useEffect
    }
  }

  // All checks passed
  return <>{children}</>;
}

/**
 * Higher-order component version for wrapping page components
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
