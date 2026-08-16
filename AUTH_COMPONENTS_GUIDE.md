# 🔐 Auth Components Usage Guide

Panduan penggunaan komponen authentication untuk Sajian Sematang v2.0.

---

## 📚 Available Components & Hooks

### 1. **useAuth()** - Main Auth Hook
Get current user and profile information.

```typescript
import { useAuth } from '@/lib/auth/hooks';

function MyComponent() {
  const { user, profile, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  
  return <div>Welcome, {profile?.name}!</div>;
}
```

### 2. **usePermission()** - Check Permission
Check if user has specific permission.

```typescript
import { usePermission } from '@/lib/auth/hooks';

function FinancialSection() {
  const canViewFinancial = usePermission('view_financial');
  
  if (!canViewFinancial) {
    return <div>No access</div>;
  }
  
  return <div>Financial data...</div>;
}
```

### 3. **useUserRole()** - Get User Role
Get current user's role.

```typescript
import { useUserRole } from '@/lib/auth/hooks';

function Dashboard() {
  const role = useUserRole();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Your role: {role}</p>
    </div>
  );
}
```

### 4. **RoleGuard** - Component-Level Protection
Protect specific components based on role or permission.

```typescript
import RoleGuard from '@/components/auth/RoleGuard';

function AdminPanel() {
  return (
    <RoleGuard requiredRole="admin">
      <div>Admin-only content</div>
    </RoleGuard>
  );
}

// Multiple roles
function StaffPanel() {
  return (
    <RoleGuard requiredRole={['admin', 'staff']}>
      <div>Admin or Staff content</div>
    </RoleGuard>
  );
}

// Permission-based
function PayoutButton() {
  return (
    <RoleGuard requiredPermission="create_payout">
      <button>Create Payout</button>
    </RoleGuard>
  );
}

// With fallback
function ProtectedContent() {
  return (
    <RoleGuard 
      requiredRole="admin"
      fallback={<div>You need admin access</div>}
    >
      <div>Admin content</div>
    </RoleGuard>
  );
}
```

### 5. **ProtectedRoute** - Page-Level Protection
Protect entire pages/routes.

```typescript
// app/admin/page.tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute 
      requireAuth 
      allowedRoles={['admin']}
    >
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin content */}
      </div>
    </ProtectedRoute>
  );
}

// app/staff/page.tsx
export default function StaffPage() {
  return (
    <ProtectedRoute 
      requireAuth 
      allowedRoles={['admin', 'staff']}
    >
      <div>
        <h1>Staff Dashboard</h1>
        {/* Staff content */}
      </div>
    </ProtectedRoute>
  );
}

// app/dashboard/page.tsx (Seller)
export default function SellerDashboard() {
  return (
    <ProtectedRoute 
      requireAuth 
      allowedRoles={['admin', 'staff', 'seller']}
    >
      <div>
        <h1>Seller Dashboard</h1>
        {/* Seller content */}
      </div>
    </ProtectedRoute>
  );
}
```

### 6. **useRoleGuard()** - Hook Version
Conditional rendering based on role/permission.

```typescript
import { useRoleGuard } from '@/components/auth/RoleGuard';

function MyComponent() {
  const isAdmin = useRoleGuard('admin');
  const canCreatePayout = useRoleGuard(undefined, 'create_payout');
  
  return (
    <div>
      {isAdmin && <button>Admin Action</button>}
      {canCreatePayout && <button>Create Payout</button>}
    </div>
  );
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Admin-Only Page
```typescript
// app/admin/financial/page.tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function FinancialPage() {
  return (
    <ProtectedRoute requireAuth allowedRoles={['admin']}>
      <div>
        <h1>Financial Dashboard</h1>
        {/* Financial content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Use Case 2: Conditional Button Display
```typescript
import { usePermission } from '@/lib/auth/hooks';

function OrderActions({ orderId }: { orderId: string }) {
  const canCreatePayout = usePermission('create_payout');
  const canUpdateOrder = usePermission('update_order');
  
  return (
    <div className="flex gap-2">
      {canUpdateOrder && (
        <button>Update Status</button>
      )}
      {canCreatePayout && (
        <button>Process Payout</button>
      )}
    </div>
  );
}
```

### Use Case 3: Role-Based Navigation
```typescript
import { useUserRole } from '@/lib/auth/hooks';
import Link from 'next/link';

function Navigation() {
  const role = useUserRole();
  
  return (
    <nav>
      <Link href="/">Home</Link>
      
      {role === 'admin' && (
        <>
          <Link href="/admin">Admin</Link>
          <Link href="/admin/financial">Financial</Link>
          <Link href="/admin/users">Users</Link>
        </>
      )}
      
      {(role === 'admin' || role === 'staff') && (
        <>
          <Link href="/staff">Staff</Link>
          <Link href="/staff/orders">Orders</Link>
        </>
      )}
      
      {(role === 'seller' || role === 'admin' || role === 'staff') && (
        <Link href="/dashboard">Dashboard</Link>
      )}
    </nav>
  );
}
```

### Use Case 4: Seller-Specific Content
```typescript
import RoleGuard from '@/components/auth/RoleGuard';
import { useAuth } from '@/lib/auth/hooks';

function ProductList() {
  const { profile } = useAuth();
  
  return (
    <div>
      <h2>Products</h2>
      
      {/* All users can view */}
      <ProductGrid />
      
      {/* Only seller can add */}
      <RoleGuard requiredRole="seller">
        <button>Add New Product</button>
      </RoleGuard>
      
      {/* Admin and staff can manage all */}
      <RoleGuard requiredRole={['admin', 'staff']}>
        <button>Manage All Products</button>
      </RoleGuard>
    </div>
  );
}
```

### Use Case 5: Financial Section
```typescript
import RoleGuard from '@/components/auth/RoleGuard';

function SellerProfile({ sellerId }: { sellerId: string }) {
  return (
    <div>
      <h2>Seller Information</h2>
      <SellerBasicInfo sellerId={sellerId} />
      
      {/* Only admin can see financial data */}
      <RoleGuard 
        requiredPermission="view_financial"
        fallback={<p>Financial data hidden</p>}
      >
        <SellerFinancialData sellerId={sellerId} />
      </RoleGuard>
      
      {/* Only admin can create payout */}
      <RoleGuard requiredPermission="create_payout">
        <button>Create Payout</button>
      </RoleGuard>
    </div>
  );
}
```

---

## 🔒 Permission List

### Orders
- `view_all_orders` - View all orders (admin, staff)
- `view_own_orders` - View own orders (seller)
- `create_order` - Create orders (admin, staff, customer)
- `update_order` - Update order status
- `delete_order` - Delete orders (admin only)

### Products
- `view_all_products` - View all products (admin, staff)
- `view_own_products` - View own products (seller)
- `create_product` - Create products
- `update_product` - Update products
- `delete_product` - Delete products

### Users
- `view_all_users` - View all users (admin)
- `view_own_user` - View own profile
- `create_user` - Create users (admin)
- `update_user` - Update users
- `delete_user` - Delete users (admin)

### Financial
- `view_financial` - View financial data (admin, seller own data)
- `create_payout` - Create payouts (admin only)

### Audit
- `view_audit_logs` - View audit logs (admin only)

### Sellers
- `view_all_sellers` - View all sellers (admin, staff)
- `manage_sellers` - Manage sellers (admin)

---

## 🚀 Quick Reference

### Protect a Page
```typescript
<ProtectedRoute requireAuth allowedRoles={['admin']}>
  {/* Page content */}
</ProtectedRoute>
```

### Protect a Component
```typescript
<RoleGuard requiredRole="admin">
  {/* Component content */}
</RoleGuard>
```

### Check Permission
```typescript
const canView = usePermission('view_financial');
if (canView) {
  // Show content
}
```

### Get User Info
```typescript
const { user, profile, loading } = useAuth();
```

### Sign Out
```typescript
import { signOut } from '@/lib/auth/hooks';

<button onClick={() => signOut()}>
  Log Out
</button>
```

---

## 📝 Best Practices

1. **Always use ProtectedRoute for pages** that require authentication
2. **Use RoleGuard for components** within pages for granular control
3. **Check permissions** for sensitive actions (delete, payout, etc.)
4. **Provide fallback UI** for better UX when access is denied
5. **Test all roles** to ensure proper access control
6. **Log audit trails** for sensitive operations

---

**Last Updated**: 16 Ogos 2026  
**Version**: 1.0
