# 🔧 SQL MIGRATION FIX - UUID Type Cast

**Date:** 30 Ogos 2026  
**Status:** ✅ FIXED  
**Git Commit:** 553d425

---

## ⚠️ ERROR REPORTED

```
ERROR: 42883: operator does not exist: uuid = text
LINE 406: AND o.id NOT IN (
HINT: No operator matches the given name and argument types. 
You might need to add explicit type casts.
```

**File:** `supabase/migration_business_structure.sql`  
**Location:** Line 406 (and 2 other similar locations)

---

## 🔍 ROOT CAUSE ANALYSIS

### Problem:

**Type Mismatch:**
- `orders.id` column type: **UUID**
- `payouts.order_ids` column type: **TEXT[]** (array of text)

**Code:**
```sql
AND o.id NOT IN (
  SELECT unnest(order_ids) 
  FROM public.payouts 
  WHERE seller_id = s.id
)
```

**Issue:**
- `unnest(order_ids)` returns **TEXT**
- `o.id` is **UUID**
- PostgreSQL cannot compare UUID with TEXT directly

---

## ✅ SOLUTION APPLIED

### Fix: Explicit Type Cast

Cast UUID to TEXT before comparison:

```sql
AND o.id::text NOT IN (
  SELECT unnest(order_ids) 
  FROM public.payouts 
  WHERE seller_id = s.id
)
```

**Operator:** `::text` (PostgreSQL type cast)

---

## 📝 LOCATIONS FIXED

### 1. Function: `calculate_seller_outstanding`
**Line:** 326

**Before:**
```sql
AND o.id NOT IN (
```

**After:**
```sql
AND o.id::text NOT IN (
```

---

### 2. Function: `get_unpaid_orders`
**Line:** 356

**Before:**
```sql
AND o.id NOT IN (
```

**After:**
```sql
AND o.id::text NOT IN (
```

---

### 3. View: `seller_outstanding_summary`
**Line:** 406

**Before:**
```sql
AND o.id NOT IN (
```

**After:**
```sql
AND o.id::text NOT IN (
```

---

## 🧪 TESTING

### Verification:

```bash
cd /home/honor/Desktop/sajian-sematang
grep -n 'o.id.*NOT IN' supabase/migration_business_structure.sql
```

**Result:**
```
326:    AND o.id::text NOT IN (
356:    AND o.id::text NOT IN (
406:  AND o.id::text NOT IN (
```

✅ All 3 locations fixed

---

## 📊 GIT CHANGES

**Commit:** 553d425

**Diff:**
```diff
-    AND o.id NOT IN (
+    AND o.id::text NOT IN (
```

**Files Modified:** 1  
**Insertions:** 3  
**Deletions:** 3

---

## 🚀 NEXT STEPS

### For User:

1. **Copy updated file to Supabase:**
   - Open `supabase/migration_business_structure.sql`
   - Copy entire content
   - Paste into Supabase SQL Editor
   - Run migration

2. **Expected Result:**
   ✅ Migration completes without errors

3. **If still error:**
   - Check Supabase PostgreSQL version
   - Verify `payouts` table exists
   - Verify `order_ids` column is `text[]`

---

## 📚 ADDITIONAL NOTES

### Why TEXT[] instead of UUID[]?

From original schema design:
```sql
order_ids text[] not null, -- Array of order IDs yang dibayar
```

**Reason:** Flexibility for future order ID format changes

**Alternative Fix (if you want to change):**

Option 1: Change column type to UUID[]
```sql
ALTER TABLE payouts 
ALTER COLUMN order_ids TYPE uuid[] 
USING order_ids::uuid[];
```

Then use:
```sql
AND o.id NOT IN (
  SELECT unnest(order_ids) 
  ...
)
```

Option 2: Keep as TEXT[] (current solution)
```sql
AND o.id::text NOT IN (
  SELECT unnest(order_ids) 
  ...
)
```

**Recommendation:** Keep current solution (TEXT[]) untuk flexibility

---

## ✅ VERIFICATION QUERIES

### After Migration:

```sql
-- 1. Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'calculate_seller_outstanding',
  'get_unpaid_orders'
);

-- 2. Check view exists
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'seller_outstanding_summary';

-- 3. Test function
SELECT calculate_seller_outstanding('[seller-uuid-here]');

-- 4. Test view
SELECT * FROM seller_outstanding_summary LIMIT 5;
```

---

**Status:** ✅ FIXED  
**Ready for:** Supabase deployment  
**File:** `supabase/migration_business_structure.sql` (updated)

---

*End of Fix Documentation*
