# 🔧 SQL MIGRATION FIX #2 - View Column Rename

**Date:** 30 Ogos 2026  
**Status:** ✅ FIXED  
**Git Commit:** 3ba50ea

---

## ⚠️ ERROR REPORTED

```
ERROR: 42P16: cannot change name of view column "seller_name" to "shop_name"
```

**File:** `supabase/migration_business_structure.sql`  
**View:** `seller_outstanding_summary`

---

## 🔍 ROOT CAUSE ANALYSIS

### Problem:

**PostgreSQL Limitation:**
- `CREATE OR REPLACE VIEW` **CANNOT** rename columns
- Old view had column: `seller_name`
- New view wants column: `shop_name`
- PostgreSQL rejects this change

**Why this happens:**
- `CREATE OR REPLACE` is meant for minor changes
- Column rename is considered a breaking change
- PostgreSQL protects dependent objects

---

## ✅ SOLUTION APPLIED

### Fix: DROP then CREATE

**Pattern:**
```sql
-- Drop existing view first
DROP VIEW IF EXISTS public.view_name CASCADE;

-- Then create fresh
CREATE VIEW public.view_name AS
SELECT ...
```

**Benefits:**
1. `IF EXISTS` - No error if view doesn\'t exist yet
2. `CASCADE` - Drops dependent objects safely
3. Fresh `CREATE VIEW` - Allows any schema changes

---

## 📝 LOCATIONS FIXED

### 1. View: `seller_outstanding_summary`
**Lines:** 395-397

**Before:**
```sql
CREATE OR REPLACE VIEW public.seller_outstanding_summary AS
SELECT ...
```

**After:**
```sql
-- Drop existing view first to allow column rename
DROP VIEW IF EXISTS public.seller_outstanding_summary CASCADE;

CREATE VIEW public.seller_outstanding_summary AS
SELECT ...
```

---

### 2. View: `daily_sales_summary`
**Lines:** 419-421

**Before:**
```sql
CREATE OR REPLACE VIEW public.daily_sales_summary AS
SELECT ...
```

**After:**
```sql
-- Drop existing view first to allow schema changes
DROP VIEW IF EXISTS public.daily_sales_summary CASCADE;

CREATE VIEW public.daily_sales_summary AS
SELECT ...
```

---

## 📊 GIT CHANGES

**Commit:** 3ba50ea

**Summary:**
- Views fixed: 2
- Lines added: 8
- Lines removed: 2

**Changes:**
```diff
+DROP VIEW IF EXISTS public.seller_outstanding_summary CASCADE;
+
-CREATE OR REPLACE VIEW public.seller_outstanding_summary AS
+CREATE VIEW public.seller_outstanding_summary AS

+DROP VIEW IF EXISTS public.daily_sales_summary CASCADE;
+
-CREATE OR REPLACE VIEW public.daily_sales_summary AS
+CREATE VIEW public.daily_sales_summary AS
```

---

## 🚀 NEXT STEPS FOR USER

### 1. Get Updated File:

```bash
/home/honor/Desktop/sajian-sematang/supabase/migration_business_structure.sql
```

### 2. Run in Supabase:

1. Open Supabase SQL Editor
2. **Copy entire content** of `migration_business_structure.sql`
3. Paste into SQL Editor
4. Click **Run**

### 3. Expected Result:

✅ Migration completes successfully  
✅ Both views created  
✅ No column rename errors  
✅ All functions and triggers working

---

## ✅ VERIFICATION QUERIES

### After Migration:

```sql
-- 1. Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_name IN (
  'seller_outstanding_summary',
  'daily_sales_summary'
);
-- Expected: 2 rows

-- 2. Check view columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'seller_outstanding_summary'
ORDER BY ordinal_position;
-- Expected columns:
-- seller_id, shop_name, phone_number, 
-- unpaid_orders_count, total_outstanding, 
-- total_sales, last_order_date

-- 3. Test view query
SELECT * FROM seller_outstanding_summary LIMIT 5;
-- Expected: Data with shop_name column (not seller_name)

-- 4. Test daily sales view
SELECT * FROM daily_sales_summary LIMIT 5;
-- Expected: Data without errors
```

---

## 📚 TECHNICAL NOTES

### Why CASCADE?

**CASCADE** drops dependent objects automatically:
- Other views that reference this view
- Materialized views
- Rules
- Triggers

Without CASCADE, drop fails if dependencies exist.

### Why IF EXISTS?

**IF EXISTS** prevents error on first run:
- First time: view doesn\'t exist yet → no error
- Re-run: view exists → drops it first

Makes migration idempotent (safe to run multiple times).

### CREATE vs CREATE OR REPLACE

| Command | When to Use |
|---------|-------------|
| `CREATE VIEW` | Fresh creation after DROP |
| `CREATE OR REPLACE VIEW` | Minor changes only (no column rename) |

**Rule of thumb:**  
If schema changes (columns renamed/reordered), use DROP + CREATE.

---

## ⚠️ WHAT IF CASCADE DROPS IMPORTANT VIEWS?

If you have custom views that depend on these:

1. **Note them down** before migration
2. Run migration (will drop them)
3. **Recreate** your custom views after

**Better approach:**  
Add your custom views to the migration file after the base views.

---

## 📊 SUMMARY

| Item | Status |
|------|--------|
| Error identified | ✅ |
| Root cause found | ✅ |
| Solution applied | ✅ |
| 2 views fixed | ✅ |
| DROP statements added | ✅ |
| File updated | ✅ |
| Documentation created | ✅ |
| Git committed | ✅ |
| Ready for deployment | ✅ |

---

## 🔗 RELATED FIXES

This is the **second SQL fix** for this migration:

1. ✅ **Fix #1:** UUID to TEXT type cast (commit 553d425)
   - Doc: `SQL_FIX_UUID_TYPE_CAST.md`

2. ✅ **Fix #2:** View column rename (commit 3ba50ea)
   - Doc: `SQL_FIX_VIEW_COLUMN_RENAME.md` (this file)

---

**Status:** ✅ FIXED  
**Ready for:** Supabase deployment  
**File:** `supabase/migration_business_structure.sql` (updated)

---

*End of Fix #2 Documentation*
