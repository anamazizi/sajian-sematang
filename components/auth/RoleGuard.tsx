'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, usePermission } from '../../lib/auth/hooks';
import { Permission, hasPermission, canAccessRoute } from '../../lib/auth/permissions';
import { UserRole } from '../../types/database';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission | Permission[];
  requiredRoute?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Component to guard content based on user role or permissions
 * 
 * Usage:
 * <RoleGuard requiredRole="admin">
 *   <AdminContent />
 * </RoleGuard>
 * 
 * <RoleGuard requiredPermission="view_financial">
 *   <FinancialData />
 * </RoleGuard>
 */
export default function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  requiredRoute,
  fallback,
  redirectTo,
}: RoleGuardProps) {
  const router = useRouter();
  const { profile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!profile) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    
    return fallback || (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Anda perlu log masuk untuk melihat kandungan ini.</p>
      </div>
    );
  }

  const userRole = profile.role as UserRole;

  // Check role-based access
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRole = roles.includes(userRole);

    if (!hasRole) {
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }

      return fallback || (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">
            Anda tidak mempunyai akses ke kandungan ini.
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            Peranan diperlukan: {roles.join(', ')}
          </p>
        </div>
      );
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) 
      ? requiredPermission 
      : [requiredPermission];
    
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(userRole, permission)
    );

    if (!hasRequiredPermission) {
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }

      return fallback || (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">
            Anda tidak mempunyai kebenaran untuk melihat kandungan ini.
          </p>
        </div>
      );
    }
  }

  // Check route-based access
  if (requiredRoute) {
    const canAccess = canAccessRoute(userRole, requiredRoute);

    if (!canAccess) {
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }

      return fallback || (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">
            Anda tidak mempunyai akses ke halaman ini.
          </p>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Hook version of RoleGuard for conditional rendering
 */
export function useRoleGuard(
  requiredRole?: UserRole | UserRole[],
  requiredPermission?: Permission | Permission[]
): boolean {
  const { profile } = useAuth();

  if (!profile) return false;

  const userRole = profile.role as UserRole;

  // Check role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole)) return false;
  }

  // Check permission
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) 
      ? requiredPermission 
      : [requiredPermission];
    
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(userRole, permission)
    );

    if (!hasRequiredPermission) return false;
  }

  return true;
}
