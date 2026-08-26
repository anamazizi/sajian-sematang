# 🔐 APPLY RLS POLICIES — STEP-BY-STEP INSTRUCTIONS

**IMPORTANT**: Please follow these steps carefully to apply RLS policies to Supabase.

---

## ✅ STEP 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard**
2. Login to your account
3. Select project: **Sajian Sematang** (ecortjyopjmintikurzq)
4. Click **SQL Editor** in left sidebar

---

## ✅ STEP 2: Apply Complete RLS Policies

### Option A: Use Combined File (Recommended - Fastest)

1. In SQL Editor, click **"New Query"**
2. Open this file in your editor: **`supabase/rls_policies_complete.sql`**
3. Select All (Ctrl+A or Cmd+A)
4. Copy (Ctrl+C or Cmd+C)
5. Paste into Supabase SQL Editor
6. Click **"Run"** button (or press Ctrl+Enter)
7. ✅ Wait for completion (should take 5-10 seconds)
8. Verify: Should see "Success. No rows returned" or similar

### Option B: Apply in Parts (If Option A Fails)

**Part 1 - Cleanup & Helpers:**
1. Open: `supabase/rls_policies_part1_cleanup.sql`
2. Copy all content → Paste in SQL Editor → Run
3. ✅ Verify success

**Part 2 - Main Policies:**
1. Open: `supabase/rls_policies_part2_main.sql`
2. Copy all content → Paste in SQL Editor → Run
3. ✅ Verify success

---

## ✅ STEP 3: Verify Installation

Run these verification queries in SQL Editor:

### 3.1: Count Policies Created

```sql
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected Output:**
```
audit_logs     | 3
order_items    | 4
orders         | 8
payouts        | 5
products       | 8
sellers        | 6
users          | 6
```

**Total: ~40 policies** ✅

### 3.2: Check Helper Functions

```sql
SELECT 
  proname as function_name,
  pronargs as arg_count
FROM pg_proc
WHERE proname IN ('is_admin', 'is_staff', 'is_admin_or_staff', 'get_user_seller_id')
ORDER BY proname;
```

**Expected: 4 functions** ✅

### 3.3: Check Customer Views

```sql
SELECT 
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('products_customer_view', 'sellers_customer_view')
ORDER BY viewname;
```

**Expected: 2 views** ✅

---

## ✅ STEP 4: Test Security (CRITICAL)

### Test 4.1: Verify cost_price is Protected

```sql
-- Test: Check products_customer_view does NOT have cost_price
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'products_customer_view'
  AND table_schema = 'public'
ORDER BY column_name;
```

✅ **Verify**: Should see `selling_price` but **NOT** `cost_price`

### Test 4.2: Test Customer View Works

```sql
-- This should work and return products WITHOUT cost_price
SELECT * FROM products_customer_view LIMIT 3;
```

✅ **Verify**: Returns data, no `cost_price` column

### Test 4.3: Test Seller View Works

```sql
-- This should work and return sellers WITHOUT QR codes
SELECT * FROM sellers_customer_view LIMIT 3;
```

✅ **Verify**: Returns data, no `duitnow_qr_url` column

---

## ✅ STEP 5: Update Application Code

After policies are applied, you need to update customer-facing code to use customer views:

### Files to Update:

**1. `app/sellers/[id]/page.tsx`** (Customer product listing)

```typescript
// ❌ OLD (will fail after RLS):
const { data: products } = await supabase
  .from('products')
  .select('*')
  .eq('seller_id', params.id);

// ✅ NEW (use customer view):
const { data: products } = await supabase
  .from('products_customer_view')
  .select('*')
  .eq('seller_id', params.id);
```

**2. `app/sellers/page.tsx`** (Seller listing)

```typescript
// ❌ OLD:
const { data: sellers } = await supabase
  .from('sellers')
  .select('*');

// ✅ NEW:
const { data: sellers } = await supabase
  .from('sellers_customer_view')
  .select('*');
```

**3. Any other customer-facing product/seller queries**

Search for:
- `.from('products')`
- `.from('sellers')`

Replace with:
- `.from('products_customer_view')`
- `.from('sellers_customer_view')`

**IMPORTANT**: Only for customer/public pages. Seller/admin dashboards can still use direct tables.

---

## ✅ STEP 6: Test Application

1. Start dev server: `npm run dev`
2. Open: `http://localhost:3000`
3. Navigate to sellers page
4. Navigate to products page
5. ✅ Verify: No errors, data loads correctly

---

## 🚨 Troubleshooting

### Error: "relation does not exist"
**Solution**: The views were not created. Re-run Part 1.

### Error: "permission denied for table products"
**Solution**: This is expected! Customers must use `products_customer_view`.
Update your code to use the view.

### Error: "policy already exists"
**Solution**: Re-run Part 1 (it has DROP POLICY IF EXISTS statements).

### No data returned from views
**Solution**: 
1. Check if products/sellers tables have data
2. Check if `is_available = true` for products
3. Views filter for available items only

---

## ✅ Success Checklist

After completing all steps:

- [ ] RLS policies applied to Supabase (verify ~40 policies)
- [ ] Helper functions created (verify 4 functions)
- [ ] Customer views created (verify 2 views)
- [ ] cost_price NOT in products_customer_view ✓
- [ ] duitnow_qr_url NOT in sellers_customer_view ✓
- [ ] Application code updated to use views
- [ ] Application tested (no errors, data loads)
- [ ] PHASE_REBUILD-1_PROGRESS.md updated to 100%

---

## 📋 After Completion

When all tests pass:

1. Update progress doc:
   ```bash
   # Update PHASE_REBUILD-1_PROGRESS.md status to 100%
   ```

2. Git commit:
   ```bash
   git add .
   git commit -m "security(rls): Apply comprehensive RLS policies

   - Created 40 strict policies for all tables
   - Added helper functions (is_admin, is_staff, etc.)
   - Created customer-safe views (no cost_price, no QR)
   - Updated app code to use customer views
   - Verified security: cost_price protected, QR codes hidden
   
   PHASE REBUILD-1: 100% COMPLETE"
   ```

3. Proceed to **PHASE REBUILD-2: Stock Concurrency**

---

**Prepared by**: Roo Code Assistant  
**Date**: 26 Ogos 2026, 11:20 PM  
**Status**: Ready for application 🚀
