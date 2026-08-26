# 🔐 Manual RLS Policies Application Guide

Since Supabase doesn't support executing raw SQL via REST API easily, please follow these manual steps:

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: **Sajian Sematang**
3. Navigate to: **SQL Editor** (left sidebar)

## Step 2: Apply Part 1 (Cleanup & Helpers)

1. Click **New Query**
2. Open file: `supabase/rls_policies_part1_cleanup.sql`
3. Copy ALL content (Ctrl+A, Ctrl+C)
4. Paste into SQL Editor
5. Click **Run** button
6. ✅ Verify: "Success. No rows returned" (expected)

**What this does:**
- Drops all old policies
- Creates helper functions (is_admin, is_staff, etc.)
- Creates customer-safe views (products_customer_view, sellers_customer_view)

## Step 3: Apply Part 2 (Main Policies)

1. Click **New Query** (create another query)
2. Open file: `supabase/rls_policies_part2_main.sql`
3. Copy ALL content
4. Paste into SQL Editor
5. Click **Run** button
6. ✅ Verify: "Success. No rows returned" (expected)

**What this does:**
- Creates ~40 strict RLS policies for all tables
- Users, Sellers, Products, Orders, Order Items, Payouts, Audit Logs

## Step 4: Verify Installation

Run this query in SQL Editor:

```sql
-- Check policies created
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
users          | 6
sellers        | 6
products       | 8
orders         | 8
order_items    | 4
payouts        | 5
audit_logs     | 3
```

**Total: ~40 policies**

## Step 5: Verify Helper Functions

```sql
-- Check functions exist
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN ('is_admin', 'is_staff', 'is_admin_or_staff', 'get_user_seller_id');
```

**Expected: 4 rows**

## Step 6: Verify Customer Views

```sql
-- Check views exist
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('products_customer_view', 'sellers_customer_view');
```

**Expected: 2 rows**

## Step 7: Test Basic Security (CRITICAL)

### Test 1: Products table access

```sql
-- This should return products (you're admin via service role)
SELECT id, name, cost_price FROM products LIMIT 1;
```

✅ Should work (you have admin access)

### Test 2: Customer view

```sql
-- This should return products WITHOUT cost_price
SELECT * FROM products_customer_view LIMIT 1;
```

✅ Should work, check that cost_price column does NOT exist in result

### Test 3: Sellers view

```sql
-- This should return sellers WITHOUT duitnow_qr_url
SELECT * FROM sellers_customer_view LIMIT 1;
```

✅ Should work, check that duitnow_qr_url column does NOT exist in result

## ✅ Success Criteria

- [x] Part 1 SQL executed without errors
- [x] Part 2 SQL executed without errors
- [x] ~40 policies created
- [x] 4 helper functions exist
- [x] 2 customer views exist
- [x] Views exclude sensitive columns (cost_price, duitnow_qr_url)

## 🚨 If You See Errors

### Error: "policy already exists"
**Solution**: The cleanup part should have dropped all policies. If you see this:
1. Re-run Part 1 (it has DROP POLICY IF EXISTS)
2. Then re-run Part 2

### Error: "function already exists"
**Solution**: The script uses CREATE OR REPLACE, this shouldn't happen. If it does:
1. The function will be replaced with new version
2. No action needed

### Error: "permission denied"
**Solution**: You need admin access to create policies
1. Verify you're logged in to correct Supabase project
2. Use project owner account

## 📋 After Successful Application

1. ✅ Update application code (use customer views)
2. ✅ Run application tests
3. ✅ Update PHASE_REBUILD-1_PROGRESS.md to 100%
4. ✅ Git commit changes

## 🔗 Next Phase

After RLS is verified working:
- **PHASE REBUILD-2**: Stock Concurrency (RPC functions)
- **PHASE REBUILD-3**: Order Snapshot & Price Security
