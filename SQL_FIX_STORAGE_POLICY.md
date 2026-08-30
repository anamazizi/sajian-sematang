# 🔧 SQL MIGRATION FIX #3 - Storage Policy Already Exists

**Date:** 30 Ogos 2026  
**Status:** ✅ FIXED  
**Git Commit:** 9c4c436

---

## ⚠️ ERROR REPORTED

```
ERROR: 42710: policy "Admin can view all QR" for table "objects" already exists
```

**File:** `supabase/03_create_storage_buckets.sql`  
**Table:** `storage.objects`  
**Policy:** "Admin can view all QR"

---

## 🔍 ROOT CAUSE ANALYSIS

### Problem:

**Missing DROP Statement:**
- Policy "Admin can view all QR" was created on line 53
- NO corresponding `DROP POLICY IF EXISTS` statement
- Other 8 policies HAD drop statements
- This one policy was missing

**Why it happened:**
- Policy added later during development
- DROP statement not added at that time
- Other policies correctly had DROP statements

---

## ✅ SOLUTION APPLIED

### Fix: Add Missing DROP POLICY

**Added at line 26:**
```sql
DROP POLICY IF EXISTS "Admin can view all QR" ON storage.objects;
```

**Location:** With other seller-qr policy drops (lines 23-27)

---

## 📝 COMPLETE POLICY LIST

### Seller-QR Bucket (5 policies):

✅ "Sellers can upload own QR" (INSERT)  
✅ "Sellers can update own QR" (UPDATE)  
✅ "Sellers can delete own QR" (DELETE)  
✅ "Admin can view all QR" (SELECT) ← **FIXED**  
✅ "Anyone can view QR" (SELECT)

### Product-Images Bucket (4 policies):

✅ "Sellers can upload product images" (INSERT)  
✅ "Sellers can update product images" (UPDATE)  
✅ "Sellers can delete product images" (DELETE)  
✅ "Anyone can view product images" (SELECT)

**Total:** 9 policies, all with DROP statements ✅

---

## 📊 GIT CHANGES

**Commit:** 9c4c436

**Diff:**
```diff
@@ -23,6 +23,7 @@
 DROP POLICY IF EXISTS "Sellers can upload own QR" ON storage.objects;
 DROP POLICY IF EXISTS "Sellers can update own QR" ON storage.objects;
 DROP POLICY IF EXISTS "Sellers can delete own QR" ON storage.objects;
+DROP POLICY IF EXISTS "Admin can view all QR" ON storage.objects;
 DROP POLICY IF EXISTS "Anyone can view QR" ON storage.objects;
```

**Changes:**
- Files modified: 1
- Lines added: 1
- Policies fixed: 1

---

## 🚀 NEXT STEPS FOR USER

### 1. Get Updated File:

```bash
/home/honor/Desktop/sajian-sematang/supabase/03_create_storage_buckets.sql
```

### 2. Run in Supabase:

1. Open Supabase SQL Editor
2. Copy entire content of `03_create_storage_buckets.sql`
3. Paste into SQL Editor
4. Click **Run**

### 3. Expected Result:

✅ Migration completes successfully  
✅ Both storage buckets created  
✅ All 9 policies created  
✅ No "policy already exists" errors  
✅ Migration is idempotent (can run multiple times)

---

## ✅ VERIFICATION QUERIES

### After Migration:

```sql
-- 1. Check buckets exist
SELECT id, name, public 
FROM storage.buckets
WHERE id IN ('seller-qr', 'product-images');
-- Expected: 2 rows

-- 2. Check policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND (policyname LIKE '%QR%' OR policyname LIKE '%product%');
-- Expected: 9 rows

-- 3. Check "Admin can view all QR" policy
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname = 'Admin can view all QR';
-- Expected: 1 row with cmd = 'SELECT'

-- 4. Test policy (as admin)
-- Login as admin user, then:
SELECT name FROM storage.objects WHERE bucket_id = 'seller-qr';
-- Expected: Can see QR files
```

---

## 📚 TECHNICAL NOTES

### Why Idempotent Migrations Matter

**Idempotent** = Safe to run multiple times

**Without DROP IF EXISTS:**
- First run: ✅ Creates policies
- Second run: ❌ Error - policies already exist
- Cannot re-run migration

**With DROP IF EXISTS:**
- First run: ✅ Creates policies (no existing to drop)
- Second run: ✅ Drops then recreates (safe)
- Can re-run migration anytime

### Storage Policies vs Table Policies

**Same syntax, different target:**

```sql
-- Table policies
CREATE POLICY "policy_name" 
ON schema.table_name ...

-- Storage policies  
CREATE POLICY "policy_name" 
ON storage.objects ...
```

Storage policies apply to `storage.objects` table managed by Supabase Storage.

---

## 📊 SUMMARY

| Item | Status |
|------|--------|
| Error identified | ✅ |
| Root cause found | ✅ |
| Missing DROP added | ✅ |
| All 9 policies have DROP | ✅ |
| Migration idempotent | ✅ |
| File updated | ✅ |
| Documentation created | ✅ |
| Git committed | ✅ |
| Ready for deployment | ✅ |

---

## 🔗 RELATED FIXES

This is the **third SQL fix** for migrations:

1. ✅ **Fix #1:** UUID to TEXT type cast
   - File: `migration_business_structure.sql`
   - Commit: 553d425
   - Doc: `SQL_FIX_UUID_TYPE_CAST.md`

2. ✅ **Fix #2:** View column rename
   - File: `migration_business_structure.sql`
   - Commit: 3ba50ea
   - Doc: `SQL_FIX_VIEW_COLUMN_RENAME.md`

3. ✅ **Fix #3:** Storage policy duplicate
   - File: `03_create_storage_buckets.sql`
   - Commit: 9c4c436
   - Doc: `SQL_FIX_STORAGE_POLICY.md` (this file)

---

**Status:** ✅ FIXED  
**Ready for:** Supabase deployment  
**File:** `supabase/03_create_storage_buckets.sql` (updated)

---

*End of Fix #3 Documentation*
