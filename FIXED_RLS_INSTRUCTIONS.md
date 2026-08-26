# 🔧 FIXED RLS POLICIES — Step-by-Step (Error Fixed!)

**Error Fixed**: ✅ `order_items` table creation added  
**Date**: 26 Ogos 2026, 11:45 PM

---

## 🚨 WHAT WAS THE PROBLEM?

Error: `relation "public.order_items" does not exist`

**Root Cause**: RLS policies script assumed `order_items` table exists, but it wasn't created yet in your database.

**Solution**: Created `rls_fix_missing_tables.sql` to create missing tables BEFORE applying policies.

---

## ✅ CORRECTED DEPLOYMENT STEPS (10-15 minutes)

### **STEP 1: Open Supabase Dashboard** (2 min)

1. Go to: **https://supabase.com/dashboard**
2. Login & select project: **Sajian Sematang** (ecortjyopjmintikurzq)
3. Click: **SQL Editor** (left sidebar)

---

### **STEP 2: Create Missing Tables FIRST** (3 min)

**⚠️ IMPORTANT: Run this FIRST to fix the error!**

1. Click **"New Query"**
2. Open file: **`supabase/rls_fix_missing_tables.sql`**
3. Copy ALL content
4. Paste into SQL Editor
5. Click **"Run"**
6. ✅ Verify: "Success. No rows returned" (expected)

**What this does:**
- Creates `order_items` table if not exists
- Creates `payouts` table if not exists
- Creates `audit_logs` table if not exists
- Adds `customer_email` column to orders if not exists
- Enables RLS on all new tables

---

### **STEP 3: Apply RLS Policies** (3 min)

Now the main policies will work without errors:

1. Click **"New Query"** (create another query tab)
2. Open file: **`supabase/rls_policies_complete.sql`**
3. Copy ALL 362 lines
4. Paste into SQL Editor
5. Click **"Run"**
6. ✅ Verify: "Success. No rows returned" (expected)

**What this does:**
- Drops all old policies
- Creates helper functions (is_admin, is_staff, etc.)
- Creates customer-safe views
- Creates ~40 strict RLS policies

---

### **STEP 4: Verify Installation** (5 min)

Run these queries in SQL Editor to confirm everything worked:

#### 4.1: Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('order_items', 'payouts', 'audit_logs')
ORDER BY table_name;
```

**Expected: 3 rows** ✅

#### 4.2: Check Policies Created

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected Output:**
```
audit_logs   | 3
order_items  | 4
orders       | 8
payouts      | 5
products     | 8
sellers      | 6
users        | 6
```

**Total: ~40 policies** ✅

#### 4.3: Check Helper Functions

```sql
SELECT proname as function_name
FROM pg_proc
WHERE proname IN ('is_admin', 'is_staff', 'is_admin_or_staff', 'get_user_seller_id')
ORDER BY proname;
```

**Expected: 4 functions** ✅

#### 4.4: Check Customer Views

```sql
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('products_customer_view', 'sellers_customer_view')
ORDER BY viewname;
```

**Expected: 2 views** ✅

#### 4.5: Verify cost_price is Protected (CRITICAL TEST)

```sql
-- Check that cost_price is NOT in customer view
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'products_customer_view'
  AND table_schema = 'public'
ORDER BY column_name;
```

✅ **MUST see `selling_price` but NOT `cost_price`**

---

## ✅ SUCCESS CHECKLIST

After all steps:

- [ ] Step 2: Missing tables created (no error)
- [ ] Step 3: RLS policies applied (no error)
- [ ] Verify 4.1: order_items, payouts, audit_logs exist ✓
- [ ] Verify 4.2: ~40 policies created ✓
- [ ] Verify 4.3: 4 helper functions exist ✓
- [ ] Verify 4.4: 2 customer views exist ✓
- [ ] Verify 4.5: cost_price NOT in customer view ✓

---

## 🎯 AFTER SUCCESSFUL DEPLOYMENT

**Tell me the result:**

✅ **If Success**: 
```
"Policies applied successfully! 
- order_items table created
- ~40 policies created
- cost_price protected
```

Then I will:
1. Update application code to use customer views
2. Test the application
3. Mark PHASE REBUILD-1 as 100% complete

❌ **If Error**:
```
"Error at step X: [error message]"
```

Then I will help debug and fix.

---

## 📁 FILE SUMMARY

**Files to use (in order)**:

1. ✅ `supabase/rls_fix_missing_tables.sql` — **RUN THIS FIRST** (create missing tables)
2. ✅ `supabase/rls_policies_complete.sql` — **RUN THIS SECOND** (apply policies)
3. ✅ `supabase/rls_test_suite.sql` — Use for verification queries

---

## 🔍 WHY THIS FIX WORKS

**Original Problem:**
```sql
DROP POLICY IF EXISTS "..." ON public.order_items;
-- ❌ ERROR: table order_items doesn't exist
```

**Fixed:**
```sql
-- Step 1: Create table first
CREATE TABLE IF NOT EXISTS public.order_items (...);

-- Step 2: Then drop/create policies
DROP POLICY IF EXISTS "..." ON public.order_items; -- ✅ Works now!
```

**Lesson**: Always ensure tables exist before creating policies on them!

---

## 🚀 READY?

Follow the corrected steps above:
1. Run `rls_fix_missing_tables.sql` FIRST
2. Then run `rls_policies_complete.sql`
3. Verify with test queries
4. Report results

Let's fix this! 💪
