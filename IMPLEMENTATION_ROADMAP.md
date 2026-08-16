# 🗺️ Implementation Roadmap - Sajian Sematang v2.0

## 📋 Ringkasan Projek

Upgrade sistem Sajian Sematang kepada platform perniagaan lengkap dengan:
- ✅ Dual pricing (harga kos & harga jualan)
- ✅ Sistem kewangan & payout
- ✅ Peranan pengguna (Admin, Staf, Seller)
- ✅ Google OAuth authentication
- ✅ Audit logging
- ✅ QR DuitNow untuk setiap seller

---

## 🎯 Fasa Implementasi

### ✅ FASA 0: Persiapan (SELESAI)
- [x] Dokumentasi struktur perniagaan ([`BUSINESS_STRUCTURE.md`](BUSINESS_STRUCTURE.md))
- [x] Migration SQL script ([`supabase/migration_business_structure.sql`](supabase/migration_business_structure.sql))
- [x] Update TypeScript types ([`types/database.ts`](types/database.ts))

---

### 🔄 FASA 1: Database Migration (SETERUSNYA)

#### 1.1 Backup Data Sedia Ada
```bash
# Export data dari Supabase Dashboard
# Table Editor > Export to CSV untuk setiap table:
- users
- sellers
- products
- orders
- order_items
```

#### 1.2 Run Migration Script
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy & paste kandungan [`migration_business_structure.sql`](supabase/migration_business_structure.sql)
4. Execute script
5. Verify semua table dan column baru wujud

#### 1.3 Update Existing Data
```sql
-- Update sellers dengan DuitNow QR (contoh)
UPDATE public.sellers 
SET duitnow_qr_url = 'https://example.com/qr/seller1.png',
    phone_number = '0123456789'
WHERE id = 'seller-uuid-here';

-- Verify cost_price calculated correctly
SELECT id, name, price, cost_price, (price - cost_price) as margin
FROM public.products
LIMIT 10;
```

#### 1.4 Create Admin User
```sql
-- Selepas create user di Supabase Auth, update role:
UPDATE public.users 
SET role = 'admin',
    phone_number = '0111234567',
    address = 'Admin Office',
    is_active = true
WHERE email = 'admin@sajian-sematang.com';
```

**Deliverables:**
- ✅ Database schema updated
- ✅ Sample data verified
- ✅ Admin user created

---

### 🔐 FASA 2: Authentication & Authorization

#### 2.1 Setup Google OAuth
1. Pergi ke [Google Cloud Console](https://console.cloud.google.com)
2. Create new project atau guna existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (untuk development)
6. Copy Client ID & Client Secret
7. Pergi ke Supabase Dashboard > Authentication > Providers
8. Enable Google provider
9. Paste Client ID & Client Secret

#### 2.2 Create Auth Components
**Files to create:**
- `app/auth/login/page.tsx` - Login page dengan Google button
- `app/auth/callback/page.tsx` - OAuth callback handler
- `app/auth/profile/page.tsx` - Complete profile form
- `components/auth/ProtectedRoute.tsx` - Route protection
- `lib/auth/hooks.ts` - Custom auth hooks

#### 2.3 Implement Role-Based Access Control (RBAC)
**Files to create:**
- `lib/auth/permissions.ts` - Permission definitions
- `lib/auth/middleware.ts` - Auth middleware
- `components/auth/RoleGuard.tsx` - Component-level protection

**Example permissions.ts:**
```typescript
export const PERMISSIONS = {
  admin: {
    orders: ['view_all', 'create', 'update', 'delete'],
    products: ['view_all', 'create', 'update', 'delete'],
    users: ['view_all', 'create', 'update', 'delete'],
    financial: ['view_all', 'create_payout'],
    audit: ['view_all'],
  },
  staff: {
    orders: ['view_all', 'create', 'update'],
    products: ['view_all', 'create', 'update'],
    users: [],
    financial: [],
    audit: [],
  },
  seller: {
    orders: ['view_own', 'update_own'],
    products: ['view_own', 'create_own', 'update_own', 'delete_own'],
    users: ['view_own'],
    financial: ['view_own'],
    audit: [],
  },
};
```

**Deliverables:**
- ✅ Google OAuth working
- ✅ Login/logout flow
- ✅ Profile completion form
- ✅ Role-based access control
- ✅ Protected routes

---

### 💰 FASA 3: Financial System

#### 3.1 Admin Financial Dashboard
**File: `app/admin/financial/page.tsx`**

Features:
- Overview cards (total sales, orders, outstanding)
- Seller outstanding list
- Daily/weekly/monthly reports
- Export to CSV

#### 3.2 Seller Outstanding Component
**File: `components/admin/SellerOutstanding.tsx`**

Features:
- List semua seller dengan tunggakan
- Detail unpaid orders
- Calculate total outstanding
- Button "Sahkan Sudah Bayar"

#### 3.3 Payout System
**File: `components/admin/PayoutModal.tsx`**

Features:
- Select seller
- Show unpaid orders
- Calculate total amount
- Payment method selection
- Reference number input
- Generate WhatsApp receipt
- Create payout record

#### 3.4 WhatsApp Payout Receipt
**Add to `lib/utils.ts`:**
```typescript
export function generatePayoutWhatsApp(payout: {
  seller_name: string;
  seller_phone: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  order_ids: string[];
  paid_date: string;
}): string {
  const message = `
🏦 *RESIT PEMBAYARAN - SAJIAN SEMATANG*

📋 *Maklumat Pembayaran:*
Penerima: ${payout.seller_name}
Jumlah: RM ${payout.amount.toFixed(2)}
Kaedah: ${payout.payment_method}
${payout.reference_number ? `Rujukan: ${payout.reference_number}` : ''}
Tarikh: ${payout.paid_date}

📦 *Pesanan Dibayar:*
${payout.order_ids.map((id, i) => `${i + 1}. #${id.substring(0, 8)}`).join('\n')}

Jumlah Pesanan: ${payout.order_ids.length}

---
Terima kasih atas perkhidmatan anda!
Sajian Sematang
  `.trim();
  
  return `https://wa.me/${payout.seller_phone}?text=${encodeURIComponent(message)}`;
}
```

**Deliverables:**
- ✅ Admin financial dashboard
- ✅ Seller outstanding tracking
- ✅ Payout creation system
- ✅ WhatsApp receipt generation

---

### 📝 FASA 4: Audit Logging

#### 4.1 Audit Logger Service
**File: `lib/audit/logger.ts`**

```typescript
import { supabase } from '../supabase/client';
import { AuditLog } from '../../types/database';

export async function logAudit(params: {
  userId?: string;
  action: AuditLog['action'];
  tableName: string;
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        table_name: params.tableName,
        record_id: params.recordId,
        old_values: params.oldValues,
        new_values: params.newValues,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
```

#### 4.2 Integrate Logging
Add logging to:
- Product create/update/delete
- Order status changes
- Payout creation
- User management

#### 4.3 Audit Log Viewer
**File: `app/admin/audit/page.tsx`**

Features:
- Filter by user, action, table, date range
- Search by record ID
- View old/new values diff
- Export logs

**Deliverables:**
- ✅ Audit logging service
- ✅ Integrated in all CRUD operations
- ✅ Admin audit log viewer

---

### 🛒 FASA 5: Update Order Flow

#### 5.1 Update Order Status Flow
Change from: `New → Preparing → Ready → Completed`
To: `New → Accepted → Preparing → Completed`

**Files to update:**
- `app/dashboard/page.tsx` - Seller dashboard
- `app/admin/orders/page.tsx` - Admin orders page
- `types/database.ts` - Order status type (DONE)

#### 5.2 Staff Order Creation
**File: `app/staff/create-order/page.tsx`**

Features:
- Select seller
- Select products
- Enter customer details
- Choose delivery mode
- Calculate fees
- Create order on behalf of customer
- Log action in audit

#### 5.3 Update Order Calculations
Ensure `total_cost` calculated correctly:
```typescript
// When creating order
const totalCost = orderItems.reduce((sum, item) => {
  return sum + (item.quantity * item.product.cost_price);
}, 0);
```

**Deliverables:**
- ✅ Updated order status flow
- ✅ Staff order creation
- ✅ Correct cost calculations

---

### 🎨 FASA 6: UI/UX Updates

#### 6.1 Admin Dashboard
**File: `app/admin/page.tsx`**

Sections:
- Overview stats
- Recent orders
- Seller performance
- Financial summary
- Quick actions

#### 6.2 Staff Dashboard
**File: `app/staff/page.tsx`**

Sections:
- Create order button
- All orders list
- Product management
- Seller list

#### 6.3 Seller Dashboard Updates
**File: `app/dashboard/page.tsx`** (existing)

Add:
- Outstanding balance display
- Payout history
- DuitNow QR management

#### 6.4 Navigation & Layout
**File: `app/layout.tsx`**

Add role-based navigation:
- Admin: All menus
- Staff: Orders, Products, Sellers
- Seller: My Orders, My Products, Payouts

**Deliverables:**
- ✅ Admin dashboard
- ✅ Staff dashboard
- ✅ Updated seller dashboard
- ✅ Role-based navigation

---

### 🧪 FASA 7: Testing

#### 7.1 Unit Tests
Test files to create:
- `__tests__/lib/auth/permissions.test.ts`
- `__tests__/lib/audit/logger.test.ts`
- `__tests__/lib/utils.test.ts`

#### 7.2 Integration Tests
- Test order flow end-to-end
- Test payout creation
- Test audit logging
- Test RLS policies

#### 7.3 User Acceptance Testing (UAT)
Test scenarios:
1. Admin creates staff user
2. Staff creates order for customer
3. Seller updates order status
4. Admin processes payout
5. Verify audit logs
6. Test all permissions

**Deliverables:**
- ✅ Unit tests passing
- ✅ Integration tests passing
- ✅ UAT completed

---

### 🚀 FASA 8: Deployment

#### 8.1 Environment Setup
```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=your-prod-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

#### 8.2 Database Migration
1. Backup production database
2. Run migration script
3. Verify data integrity
4. Update existing records

#### 8.3 Deploy Application
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
vercel deploy --prod
```

#### 8.4 Post-Deployment
- Monitor error logs
- Test all features in production
- Train admin and staff users
- Create user documentation

**Deliverables:**
- ✅ Production deployment
- ✅ All features working
- ✅ User training completed
- ✅ Documentation ready

---

## 📚 Documentation to Create

### For Developers
- [ ] API documentation
- [ ] Database schema diagram
- [ ] Component documentation
- [ ] Deployment guide

### For Users
- [ ] Admin user manual
- [ ] Staff user manual
- [ ] Seller user manual
- [ ] Customer FAQ

---

## ⚠️ Important Notes

### Security Checklist
- [ ] All RLS policies tested
- [ ] API keys secured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] SQL injection prevention
- [ ] XSS protection

### Performance Checklist
- [ ] Database indexes created
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching strategy
- [ ] CDN configured

### Compliance Checklist
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy
- [ ] Backup strategy

---

## 📊 Success Metrics

### Technical Metrics
- Page load time < 3s
- API response time < 500ms
- 99.9% uptime
- Zero critical bugs

### Business Metrics
- Admin can process payouts in < 2 minutes
- Staff can create orders in < 3 minutes
- Sellers can update orders in < 1 minute
- 100% audit trail coverage

---

## 🆘 Support & Maintenance

### Regular Tasks
- Daily: Monitor error logs
- Weekly: Review audit logs
- Monthly: Database backup verification
- Quarterly: Security audit

### Emergency Contacts
- Database Admin: [Contact]
- System Admin: [Contact]
- Developer: [Contact]

---

**Last Updated:** 16 Ogos 2026
**Version:** 2.0
**Status:** Planning Phase
