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
  const publicRoutes = ['/', '/sellers', '/preorder'];
  if (publicRoutes.some(r => route.startsWith(r))) {
    return true;
  }
  
  // Admin routes
  if (route.startsWith('/admin')) {
    return role === 'admin';
  }
  
  // Staff routes
  if (route.startsWith('/staff')) {
    return role === 'admin' || role === 'staff';
  }
  
  // Seller dashboard (NEW ROUTE)
  if (route.startsWith('/seller')) {
    return role === 'seller' || role === 'admin';
  }
  
  // OLD dashboard route (deprecated, redirect to /seller)
  if (route.startsWith('/dashboard')) {
    return false; // Force redirect
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
      return '/admin';
    case 'staff':
      return '/staff';
    case 'seller':
      return '/seller'; // FIXED: Was /dashboard
    case 'customer':
    default:
      return '/sellers';
  }
}
