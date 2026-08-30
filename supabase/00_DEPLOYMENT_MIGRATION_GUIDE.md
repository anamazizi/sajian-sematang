# 🚀 SAJIAN SEMATANG - PRODUCTION DEPLOYMENT MIGRATION GUIDE

**Phase R7: Complete Migration Sequence**  
**Created:** 30 Ogos 2026

---

## ⚠️ IMPORTANT: Run Migrations in THIS ORDER ONLY

---

## 📋 MIGRATION SEQUENCE

### **STEP 1: Core Database Schema** 🔴 WAJIB

**File:** `migration_business_structure.sql`

```sql
\\i supabase/migration_business_structure.sql
```

**Creates:**
- ✅ users table (role, seller_id, location)
- ✅ sellers table
- ✅ products table (cost_price, stock, preorder)
- ✅ orders table (snapshot, delivery)
- ✅ order_items table (snapshot)
- ✅ payouts table
- ✅ audit_logs table
- ✅ Helper functions (is_admin, is_staff)
- ✅ Views for reporting

---

### **STEP 2: User Location Fields** 🔴 WAJIB

**File:** `02_add_user_location_fields.sql`

```sql
\\i supabase/02_add_user_location_fields.sql
```

**Adds:** latitude, longitude, google_maps_url

---

### **STEP 3: Storage Buckets** 🔴 WAJIB

**File:** `03_create_storage_buckets.sql`

```sql
\\i supabase/03_create_storage_buckets.sql
```

**Creates:**
- ✅ product-images (public)
- ✅ seller-qr (private)

---

### **STEP 4: Stock Movements Table** 🟡 PENTING

**File:** `04_create_stock_movements_table.sql`

```sql
\\i supabase/04_create_stock_movements_table.sql
```

**Purpose:** Audit trail for stock changes

---

### **STEP 5: Order Snapshot Fields** 🔴 KRITIKAL

**File:** `05_add_order_snapshot_fields.sql`

```sql
\\i supabase/05_add_order_snapshot_fields.sql
```

**Adds:**
- ✅ customer_name_snapshot
- ✅ customer_phone_snapshot
- ✅ customer_address_snapshot
- ✅ delivery_distance_snapshot
- ✅ delivery_fee_snapshot
- ✅ product_name_snapshot
- ✅ cost_price_snapshot

---

### **STEP 6: Order Creation RPC (Base)** 🔴 KRITIKAL

**File:** `06_create_order_with_stock_check.sql`

```sql
\\i supabase/06_create_order_with_stock_check.sql
```

**Purpose:** Atomic order creation with stock validation

---

### **STEP 7: Product Options Table** 🟡 PENTING

**File:** `09_create_product_options_table.sql`

```sql
\\i supabase/09_create_product_options_table.sql
```

**Purpose:** Hot/Iced, Add-ons, Size options

---

### **STEP 8: Order Item Options Field** 🟡 PENTING

**File:** `10_add_order_item_options.sql`

```sql
\\i supabase/10_add_order_item_options.sql
```

**Adds:** selected_options JSONB field

---

### **STEP 9: Update Order RPC with Options** 🔴 KRITIKAL

**File:** `11_update_order_rpc_with_options.sql`

```sql
\\i supabase/11_update_order_rpc_with_options.sql
```

**Purpose:** Replace Step 6 RPC with options support

---

### **STEP 10: RLS Policies** 🔴 KRITIKAL

**File:** `rls_policies_final.sql`

```sql
\\i supabase/rls_policies_final.sql
```

**Creates policies for:**
- ✅ users (own profile)
- ✅ sellers (own data)
- ✅ products (public read, secure write)
- ✅ orders (role-based access)
- ✅ order_items (via orders)
- ✅ payouts (admin only)
- ✅ audit_logs (admin only)

---

### **STEP 11: RLS cost_price Protection** 🔴 KRITIKAL

**File:** `13_fix_rls_cost_price_protection.sql`

```sql
\\i supabase/13_fix_rls_cost_price_protection.sql
```

**Purpose:** Enhanced cost_price column security (Phase R5)

---

### **STEP 12 (OPTIONAL): Seed Sample Data** 🟢 DEV ONLY

**File:** `08_seed_sample_data.sql`

```sql
-- DO NOT RUN IN PRODUCTION
\\i supabase/08_seed_sample_data.sql
```

**Purpose:** Test data for development

---

## ✅ VERIFICATION QUERIES

### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected:**
- audit_logs
- order_items
- orders
- payouts
- product_options
- products
- sellers
- stock_movements
- users

### 2. Check RLS Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

**Expected:** All 9 tables above

### 3. Check RLS Policies

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected:** Multiple policies per table

### 4. Check RPC Function

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'create_order_with_stock_check';
```

**Expected:** 1 row

### 5. Check Storage Buckets

```sql
SELECT id, name, public
FROM storage.buckets
ORDER BY name;
```

**Expected:**
- product-images (public: true)
- seller-qr (public: false)

### 6. Check Snapshot Fields

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
AND column_name LIKE '%snapshot%';
```

**Expected:**
- product_name_snapshot (text)
- cost_price_snapshot (numeric)

---

## 📋 POST-DEPLOYMENT CHECKLIST

- [ ] All migrations completed without errors
- [ ] All tables created
- [ ] All RLS policies active
- [ ] RPC function working
- [ ] Storage buckets created
- [ ] Verification queries pass
- [ ] Backup taken before migration

---

## 🔒 MASTER PROMPT COMPLIANCE

- ✅ Seksyen 17: Product options
- ✅ Seksyen 19: Stock concurrency (atomic RPC)
- ✅ Seksyen 28: Order snapshot
- ✅ Seksyen 29: Server-side price validation
- ✅ Seksyen 39: Stock movement audit
- ✅ Seksyen 64: Item snapshot complete
- ✅ Seksyen 66: RLS per role
- ✅ Seksyen 73: Migration strategy

---

**Total Migrations:** 11 files (+ 1 optional seed data)

**Estimated Time:** 10-15 minutes

