// Permission definitions for role-based access control
// Sajian Sematang v2.0

export type UserRole = 'customer' | 'seller' | 'admin' | 'staff';

export type Permission = 
  | 'view_all_orders'
  | 'view_own_orders'
  | 'create_order'
  | 'update_order'
  | 'delete_order'
  | 'view_all_products'
  | 'view_own_products'
  | 'create_product'
  | 'update_product'
  | 'delete_product'
  | 'view_all_users'
  | 'view_own_user'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'view_financial'
  | 'create_payout'
  | 'view_audit_logs'
  | 'view_all_sellers'
  | 'manage_sellers';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Orders
    'view_all_orders',
    'create_order',
    'update_order',
    'delete_order',
    // Products
    'view_all_products',
    'create_product',
    'update_product',
    'delete_product',
    // Users
    'view_all_users',
    'create_user',
    'update_user',
    'delete_user',
    // Financial
    'view_financial',
    'create_payout',
    // Audit
    'view_audit_logs',
    // Sellers
    'view_all_sellers',
    'manage_sellers',
  ],
  
  staff: [
    // Orders
    'view_all_orders',
    'create_order',
    'update_order',
    // Products
    'view_all_products',
    'create_product',
    'update_product',
    // Sellers
    'view_all_sellers',
    // NO financial access
    // NO audit logs
    // NO user management
  ],
  
  seller: [
    // Orders
    'view_own_orders',
    'update_order', // Own orders only
    // Products
    'view_own_products',
    'create_product', // Own products only
    'update_product', // Own products only
    'delete_product', // Own products only
    // Users
    'view_own_user',
    'update_user', // Own profile only
    // Financial
    'view_financial', // Own financial data only
  ],
  
  customer: [
    // Orders
    'create_order',
    // Products
    'view_all_products',
    // Users
    'view_own_user',
    'update_user', // Own profile only
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  // Public routes
  const publicRoutes = ['/', '/preorder'];
  if (publicRoutes.some(r => route.startsWith(r))) {
    return true;
  }
  
  // Kawalan routes (Admin & Staff)
  if (route.startsWith('/kawalan')) {
    return role === 'admin' || role === 'staff';
  }
  
  // Jualan routes (Seller & Admin)
  if (route.startsWith('/jualan')) {
    return role === 'seller' || role === 'admin';
  }
  
  // Admin routes (for backward compatibility - e.g. /admin/payouts)
  if (route.startsWith('/admin')) {
    return role === 'admin';
  }
  
  // OLD routes (deprecated, redirect)
  if (route.startsWith('/staff') || route.startsWith('/seller') || route.startsWith('/dashboard')) {
    return false; // Force redirect to new routes
  }
  
  // Auth routes (accessible to all authenticated users)
  if (route.startsWith('/auth')) {
    return true;
  }
  
  return false;
}

/**
 * Get redirect path based on user role
 */
export function getDefaultRedirectPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/kawalan'; // New admin/staff dashboard
    case 'staff':
      return '/kawalan'; // New admin/staff dashboard
    case 'seller':
      return '/jualan'; // New seller dashboard
    case 'customer':
    default:
      return '/';
  }
}
