# ARCHITECTURE_PHASE0.md - SAJIAN SEMATANG
## Final Architecture Documentation (Updated 31 Ogos 2026)
## Based on Phase -1 Audit & Phase R1-R9 Implementation

---

## 📋 OVERVIEW & SYSTEM ARCHITECTURE

### **Core Philosophy**
- **Frontend:** Simple, mobile-first customer experience
- **Backend:** Structured, secure, maintainable
- **Database:** Reliable, auditable with historical snapshots
- **Security:** Strict RLS policies, rate limiting, audit logging
- **Deployment:** Vercel + Supabase production-ready

### **Technology Stack (Confirmed & Tested)**
```
Browser → Vercel (Next.js 16.3.1) → Supabase (PostgreSQL/Auth/Storage) → PostgreSQL
```

### **Architecture Layers**
1. **Presentation Layer:** Next.js App Router + React 19.2.8 + Tailwind CSS
2. **Business Logic Layer:** Server Actions + Supabase RPC Functions
3. **Data Layer:** PostgreSQL with Row Level Security (RLS)
4. **Infrastructure Layer:** Vercel + Supabase + Google OAuth
5. **Security Layer:** Rate Limiting + Audit Logging + PII Protection

---

## 🏗️ DATABASE SCHEMA DESIGN

### **Core Entities & Relationships**
```
profiles (users) ↔ user_roles ↔ orders ↔ order_items ↔ products ↔ sellers
                          ↓              ↓               ↓
                    stock_movements  order_item_options categories
```

### **Complete Table Structure**

#### **1. Authentication & Profiles**
```sql
-- profiles (extends Supabase auth.users)
id (uuid, PK, references auth.users.id)
email (text)
full_name (text)
phone_number (text)
address (text)
latitude (numeric)
longitude (numeric)
google_maps_url (text)
created_at (timestamptz)
updated_at (timestamptz)

-- user_roles (role management)
user_id (uuid, PK, references profiles.id)
role (text) -- 'customer', 'seller', 'staff', 'admin'
created_at (timestamptz)
created_by (uuid) -- admin who assigned role
```

#### **2. Product Management**
```sql
-- categories
id (uuid, PK)
name (text)
description (text)
sort_order (integer)
is_active (boolean)
created_at (timestamptz)

-- products
id (uuid, PK)
seller_id (uuid, references seller_profiles.id)
#### **3. Order & Transaction System**
```sql
-- orders (master order table)
id (uuid, PK)
order_number (text) -- SS-XXXX (atomic sequence)
customer_id (uuid, references profiles.id)
order_type (text) -- 'DELIVERY' | 'SELF_PICKUP'
delivery_fee (numeric(10,2))
distance_km (numeric(10,2)) -- snapshot for audit
customer_note (text)
total_amount (numeric(10,2))
status (text) -- 'PENDING', 'ACCEPTED', 'READY', 'DELIVERING', 'COMPLETED'
created_by (uuid) -- staff/admin if created for customer
created_by_role (text)
created_at (timestamptz)
updated_at (timestamptz)

-- order_items (snapshot of product at time of purchase)
id (uuid, PK)
order_id (uuid, references orders.id)
product_id (uuid, references products.id)
product_name_snapshot (text)
selling_price_snapshot (numeric(10,2))
cost_price_snapshot (numeric(10,2)) -- for seller payout calculation
quantity (integer)
created_at (timestamptz)

-- order_item_options (snapshot of selected options)
id (uuid, PK)
order_item_id (uuid, references order_items.id)
option_name_snapshot (text)
option_price_snapshot (numeric(10,2))
quantity (integer)
created_at (timestamptz)

-- order_status_history (audit trail)
id (uuid, PK)
order_id (uuid, references orders.id)
old_status (text)
new_status (text)
changed_by (uuid, references profiles.id)
changed_by_role (text)
reason (text)
created_at (timestamptz)
```

#### **4. Seller & Financial Management**
```sql
-- seller_profiles (extends profiles)
id (uuid, PK, references profiles.id)
business_name (text)
business_registration (text)
bank_name (text)
bank_account (text)
duitnow_qr_url (text) -- stored in private storage bucket
is_verified (boolean)
created_at (timestamptz)
updated_at (timestamptz)

-- stock_movements (auditable stock changes)
id (uuid, PK)
product_id (uuid, references products.id)
seller_id (uuid, references seller_profiles.id)
previous_quantity (integer)
adjustment_quantity (integer)
new_quantity (integer)
reason (text) -- 'SALE', 'MANUAL_ADJUSTMENT', 'RETURN', 'DAMAGE'
changed_by (uuid, references profiles.id)
changed_by_role (text)
created_at (timestamptz)

-- seller_settlements (payable calculations)
id (uuid, PK)
seller_id (uuid, references seller_profiles.id)
period_start (date)
period_end (date)
total_sales_amount (numeric(10,2))
total_cost_amount (numeric(10,2))
total_payable (numeric(10,2))
status (text) -- 'PENDING', 'CALCULATED', 'PAID'
created_at (timestamptz)
updated_at (timestamptz)

-- seller_payments (actual payments)
id (uuid, PK)
#### **5. Accounting & Operations**
```sql
-- expenses (business expenses)
id (uuid, PK)
expense_date (date)
supplier (text)
description (text)
amount (numeric(10,2))
notes (text)
created_by (uuid, references profiles.id)
created_at (timestamptz)

-- external_income (non-sale income)
id (uuid, PK)
income_date (date)
source (text)
amount (numeric(10,2))
notes (text)
created_by (uuid, references profiles.id)
created_at (timestamptz)

-- audit_logs (security & compliance)
id (uuid, PK)
actor_id (uuid, references profiles.id)
actor_role (text)
---

## 👥 ROLE & PERMISSION MATRIX

### **1. CUSTOMER**
**Purpose:** Place orders, view history, manage profile
**Access:**
- ✅ Read/update own profile
- ✅ Read active products (selling_price only)
- ✅ Create/like products (one like per product)
- ✅ Create orders (own)
- ✅ Read own order history
- ✅ View order status
- ❌ Read cost_price
- ❌ Access seller data
- ❌ View other customers' data
- ❌ Stock management
- ❌ Financial operations

### **2. SELLER**
**Purpose:** Manage products, stock, view sales/payments
**Access:**
- ✅ Read/update own seller profile
- ✅ Create/read/update/delete own products
- ✅ Manage own product stock
- ✅ Read own sales (completed orders only)
- ✅ Read own payable calculations
- ✅ Read own payment history
- ✅ Upload/manage own DuitNow QR
- ❌ Access customer private data
- ❌ View other sellers' data
- ❌ Read orders (except own completed sales)
- ❌ Financial adjustments
- ❌ Role management

### **3. STAFF**
**Purpose:** Operational support, order management
**Access:**
- ✅ View all orders (read-only)
- ✅ Update order status (PENDING → ACCEPTED → READY → DELIVERING → COMPLETED)
- ✅ Create orders on behalf of customers
- ✅ View product stock (read-only)
- ✅ View seller profiles (read-only)
- ✅ Delivery operation management
- ❌ Financial operations (payments, adjustments)
- ❌ Role management
- ❌ Seller settlement calculations
- ❌ System configuration changes
- ❌ Audit log modifications

### **4. ADMIN**
**Purpose:** Full system management
**Access:**
- ✅ Full CRUD on all tables (except auth.users)
- ✅ Role management (assign customer/seller/staff/admin)
- ✅ Financial operations (payments, adjustments, expenses)
- ✅ System configuration
- ✅ Audit log access
- ✅ Reporting and analytics
- ✅ Database migration execution
---

## 🔐 SECURITY ARCHITECTURE

### **1. Authentication Strategy**
- **Primary:** Supabase Auth + Google OAuth
- **Session:** 7-day refresh with secure token management
- **No passwords stored** (Google OAuth only)
- **Server-side session validation** for sensitive operations

### **2. Rate Limiting Strategy (Section 109)**
```typescript
// Rate Limits Configuration
const rateLimits = {
  CHECKOUT: { requests: 10, windowMs: 60 * 1000 }, // 10/min
  LOGIN: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5/15min
  LIKE: { requests: 20, windowMs: 60 * 1000 }, // 20/min
  API: { requests: 100, windowMs: 60 * 60 * 1000 }, // 100/hour
};
```

### **3. Audit Logging Strategy (Section 58 & 111)**
- **Sensitive Actions Logged:** Role changes, stock corrections, payments, adjustments
- **PII Sanitization:** Addresses masked, payment info redacted
- **Error Tracking:** Structured errors with context
- **Production Monitoring:** Vercel log drains + Sentry integration

### **4. Data Privacy Protection (Section 88)**
- **Customer PII:** Never exposed to sellers
- **Address Masking:** "123 Street, [DETAILS_REDACTED]" in logs
- **Payment Info:** Card numbers/CVV never logged
- **Storage Policies:** Seller QR in private buckets

### **5. Stock Concurrency Protection (Section 19)**
```sql
-- Atomic RPC Function
CREATE OR REPLACE FUNCTION create_order_with_stock_check(...)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
---

## 🌐 DEPLOYMENT ARCHITECTURE

### **Production Environment**
```
GitHub Repository
    ↓
Vercel (Automatic Deployment)
    ↓
Next.js Application (Browser)
    ↓    ↓    ↓
Supabase (Auth)   Supabase (Database)   Supabase (Storage)
    ↓               ↓                    ↓
Google OAuth   PostgreSQL (RLS)     Product Images / Seller QR
```

### **Environment Configuration**
```env
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key] # SERVER-SIDE ONLY
NEXT_PUBLIC_GOOGLE_CLIENT_ID=[client-id]
GOOGLE_CLIENT_SECRET=[client-secret]
---

## 📋 PRE-LAUNCH CHECKLIST

### **Phase 0 Architecture Documentation** ✅ COMPLETE
- [x] Database schema finalized with all tables
- [x] RLS policies defined and tested
- [x] Role permission matrix complete
- [x] Order lifecycle documented
- [x] Security architecture defined
- [x] Deployment strategy documented

### **Technical Implementation** ✅ 89% COMPLETE
- [x] Phase -1: Audit Complete (26 Ogos)
- [x] Phase R1-R7: Critical Patches Complete (28-30 Ogos)
- [x] Phase 8: E2E Testing Complete (31 Ogos)
- [x] Phase 9: Production Monitoring Complete (31 Ogos)
- [ ] Phase 0: Architecture Finalized (IN PROGRESS)

### **Production Readiness**
- [x] Codebase: Clean TypeScript build (0 errors)
- [x] Security: RLS, rate limiting, audit logging implemented
- [x] Documentation: PRODUCTION_LAUNCH_GUIDE.md complete
- [ ] Infrastructure: Vercel, Supabase, Google OAuth setup needed
- [x] Monitoring: Error tracking configured
- [x] Testing: E2E procedures defined

---

## 🚀 NEXT STEPS & TIMELINE

### **Immediate Next Steps (Post-Phase 0)**
1. **Production Environment Setup** (Estimated: 4-6 hours)
   - Create Supabase production project
   - Configure Google OAuth production URLs
   - Setup Vercel with environment variables

2. **Database Migration** (Estimated: 3-4 hours)
   - Run migration scripts in production
   - Verify RLS policies
   - Seed initial data (categories, store settings)

3. **Final Security Testing** (Estimated: 4-6 hours)
   - Penetration testing
   - Rate limiting verification
   - RLS policy validation

### **Estimated Total Time to Production: 15-22 hours**

### **Post-Launch Considerations**
1. **Monitoring:** Vercel logs, Supabase metrics, error tracking
2. **Support:** FAQ, troubleshooting guide, support email
3. **Backup:** Daily automated backups, weekly exports
4. **Maintenance:** Regular updates, security patches

---

## 📞 CONTACT & SUPPORT

### **Documentation Maintainer**
- **Primary:** Roo Code AI Assistant
- **Last Updated:** 31 Ogos 2026
- **Next Review:** 30 September 2026

### **Key Documentation Files**
- `ARCHITECTURE_PHASE0.md` - This document
- `PRODUCTION_LAUNCH_GUIDE.md` - Step-by-step deployment guide
- `PROJECT_PROGRESS.txt` - Current project status (89% → 90%)
- `AUDIT_REPORT_PHASE_MINUS_1.md` - Initial audit findings

### **Technical Support**
- **Vercel:** Dashboard support for deployment issues
- **Supabase:** Community + paid support for database issues
- **Google Cloud:** OAuth configuration support
- **GitHub:** Code repository and issue tracking

---

**Architecture Status:** ✅ FINALIZED  
**Project Status:** 90% COMPLETE (Phase 0 Architecture Complete)  
**Ready for:** Production Environment Setup & Final Launch  

*End of Phase 0 Architecture Documentation*
NEXT_PUBLIC_APP_URL=https://sajian-sematang.vercel.app
NEXT_PUBLIC_WHATSAPP_NUMBER=601110890100
```

### **Database Migration Strategy**
```bash
# Migration Files (in order)
00_patch_all_missing_columns.sql
02_add_user_location_fields.sql
03_create_storage_buckets.sql
04_create_stock_movements_table.sql
05_add_order_snapshot_fields.sql
06_create_order_with_stock_check.sql
09_create_product_options_table.sql
10_add_order_item_options.sql
11_update_order_rpc_with_options.sql
13_fix_rls_cost_price_protection.sql
```

---

## 🧪 TESTING & QUALITY ASSURANCE

### **Testing Strategy**
1. **Unit Tests:** Business logic (delivery fee, order total)
2. **Integration Tests:** RLS policies, authentication flows
3. **E2E Tests:** Complete customer journey (login → order → WhatsApp)
4. **Security Tests:** RLS bypass attempts, rate limiting, PII exposure

### **Critical Test Cases**
```sql
-- RLS Test: Customer A cannot see Customer B data
SET role authenticated;
SET request.jwt.claims.sub TO 'customer-a-uuid';
SELECT * FROM orders WHERE customer_id != 'customer-a-uuid'; -- Should return empty

-- Stock Concurrency Test
-- Simulate two simultaneous orders for same product
-- Should either both succeed (if stock sufficient) or one fail
```

### **Build & Deployment Verification**
```bash
npm run build        # TypeScript compilation
npm run lint         # Code quality
vercel --prod       # Production deployment test
```
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  -- FOR UPDATE lock prevents race conditions
  SELECT quantity INTO current_qty FROM products WHERE id = product_id FOR UPDATE;
  
  IF current_qty < order_qty THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;
  
  -- Atomic update
  UPDATE products SET quantity = quantity - order_qty WHERE id = product_id;
  
  -- Create order with snapshot
  INSERT INTO orders (...) VALUES (...);
  
  RETURN order_id;
END;
$$;
```

---

## 📈 BUSINESS LOGIC & CALCULATIONS

### **1. Delivery Fee Calculation (Section 24)**
**Formula:** `floor(distance_km)` where distance calculated using Haversine formula
**Example:** 6.9km → RM6, 7.1km → RM7
**Minimum Fee:** RM3 for distance < 1km
**Implementation:** Server-side PostgreSQL function

### **2. Order Total Calculation**
```
Order Total = 
  Σ(Product selling_price_snapshot × quantity) +
  Σ(Option option_price_snapshot × quantity) +
  delivery_fee +
  adjustments (if any)
```

**CRITICAL:** All calculations server-side using snapshot data

### **3. Seller Payable Calculation**
```
Seller Payable = 
  Σ(Product cost_price_snapshot × quantity) +
  adjustments (promotion/damage/correction)
```

**CRITICAL:** Uses `cost_price_snapshot` from order_item, NOT current product cost_price

### **4. Order ID Generation (Section 108)**
**Format:** `SS-XXXX` where XXXX is sequential number
**Implementation:** PostgreSQL sequence with atomic generation in RPC function
**Collision Protection:** FOR UPDATE locks prevent duplicate IDs
- ✅ Storage bucket management

---

## 📊 ORDER LIFECYCLE DIAGRAM

### **Flow: Customer Order**
```
[START]
  ↓
Google Login → Profile Setup (First Time)
  ↓
Browse Categories → View Products → Add to Cart
  ↓
Cart Management (Add/Remove/Update Quantity)
  ↓
Checkout: Delivery/Self Pickup + Location
  ↓
[CRITICAL: Server-Side Validation]
  • Product still active?
  • Price still valid?
  • Stock sufficient? (Atomic RPC)
  • Options available?
  ↓
Order Creation (Atomic Transaction)
  • Reserve/deduct stock
  • Create order with snapshot
  • Generate order number (SS-XXXX)
  ↓
Generate WhatsApp Message
  • Customer details
  • Order items
  • Delivery fee
  • Order ID
  ↓
Open WhatsApp with pre-filled message
  ↓
[END: Customer Flow Complete]
```

### **Flow: Order Status Management**
```
PENDING (Created by Customer)
  ↓
ACCEPTED (Staff/Admin accepts order)
  ↓
READY (Products prepared)
  ↓
DELIVERING (Out for delivery)
  ↓
COMPLETED (Delivered/Collected)
  ↓
[CRITICAL: Accounting Trigger]
  • Seller payable calculated (cost_price_snapshot × quantity)
  • Sales count incremented
  • Audit trail updated
```
action (text) -- 'ROLE_CHANGE', 'STOCK_CORRECTION', etc.
entity_type (text) -- 'user', 'product', 'order', 'payment'
entity_id (uuid)
old_value (jsonb)
new_value (jsonb)
reason (text)
ip_address (text)
user_agent (text)
created_at (timestamptz)
```

#### **6. System Configuration**
```sql
-- store_settings
id (uuid, PK)
store_name (text)
store_address (text)
store_latitude (numeric)
store_longitude (numeric)
store_phone (text)
store_email (text)
business_hours (jsonb) -- opening hours per day
delivery_minimum_fee (numeric(10,2)) -- e.g., RM3
delivery_max_distance (numeric(10,2)) -- maximum delivery radius
created_at (timestamptz)
updated_at (timestamptz)

-- delivery_settings
id (uuid, PK)
formula (text) -- 'floor(distance_km)' for RM6 at 6.9km
minimum_fee (numeric(10,2)) -- RM3 for distance < 1km
maximum_fee (numeric(10,2)) -- optional cap
created_at (timestamptz)
updated_at (timestamptz)
```

---

## 🔐 ROW LEVEL SECURITY (RLS) STRATEGY

### **RLS Principles Applied**
1. **Least Privilege:** Users only access what they need
2. **Data Privacy:** Sensitive data (cost_price) protected
3. **Role Isolation:** Customer ≠ Seller ≠ Staff ≠ Admin
4. **Audit Trail:** All sensitive actions logged

### **RLS Policy Matrix**

| Table | Customer | Seller | Staff | Admin | Notes |
|-------|----------|--------|-------|-------|-------|
| **profiles** | R/U own | R own | R all | R/W all | Email/phone protected |
| **user_roles** | R own | R own | R all | R/W all | Role change audit |
| **products** | R active | R/W own | R all | R/W all | cost_price hidden from customer |
| **orders** | R own | - | R all | R/W all | Seller cannot see customer orders |
| **order_items** | R own | R own cost | R all | R/W all | cost_price_snapshot for seller payout |
| **seller_profiles** | - | R/W own | R all | R/W all | QR in private storage |
| **stock_movements** | - | R own | R/W all | R/W all | Immutable audit trail |
| **seller_payments** | - | R own | R all | R/W all | Financial confidentiality |
| **audit_logs** | - | R own | R all | R/W all | PII sanitized in logs |

### **Critical RLS Protections**
1. **cost_price Protection:** Customer cannot read `products.cost_price`
2. **Cross-User Isolation:** Customer A cannot see Customer B orders
3. **Cross-Seller Isolation:** Seller A cannot access Seller B products
4. **Financial Data:** Only Admin can access payment/adjustment tables
5. **Audit Integrity:** audit_logs readable but not writable by non-admin
seller_id (uuid, references seller_profiles.id)
settlement_id (uuid, references seller_settlements.id)
amount (numeric(10,2))
payment_date (date)
admin_id (uuid, references profiles.id)
notes (text)
status (text) -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
reference (text)
created_at (timestamptz)

-- seller_payment_adjustments (financial corrections)
id (uuid, PK)
payment_id (uuid, references seller_payments.id)
original_amount (numeric(10,2))
adjustment (numeric(10,2)) -- positive or negative
final_amount (numeric(10,2))
reason (text) -- 'PROMOTION', 'DAMAGE', 'CORRECTION', 'OTHER'
admin_id (uuid, references profiles.id)
created_at (timestamptz)
```
category_id (uuid, references categories.id)
name (text)
description (text)
image_url (text)
selling_price (numeric(10,2))
cost_price (numeric(10,2)) -- protected by RLS
quantity (integer)
stock_mode (text) -- 'STOCK_QUANTITY' | 'PRE_ORDER'
is_active (boolean)
is_preorder (boolean)
preorder_start (timestamptz)
preorder_end (timestamptz)
created_at (timestamptz)
updated_at (timestamptz)

-- product_options (add-ons/variants)
id (uuid, PK)
product_id (uuid, references products.id)
name (text)
price (numeric(10,2))
is_active (boolean)
created_at (timestamptz)

-- product_likes (customer favorites)
id (uuid, PK)
product_id (uuid, references products.id)
user_id (uuid, references profiles.id)
created_at (timestamptz)
UNIQUE(product_id, user_id) -- one like per user per product
```