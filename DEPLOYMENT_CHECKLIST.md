# ✅ Deployment Checklist - Column Patch

## 📋 Pre-Deployment

- [ ] Baca `COLUMN_PATCH_SUMMARY.md` untuk memahami perubahan
- [ ] Backup database semasa (optional tapi disyorkan)

## 🚀 Deployment Steps

### Step 1: Verify Current State
```sql
\i supabase/verify_columns_before_rls.sql
```
**Expected:** Beberapa ❌ (column missing)

### Step 2: Run Patch Script
```sql
\i supabase/00_patch_all_missing_columns.sql
```
**Expected:** ✅ Success messages (~10-30 sec)

### Step 3: Verify Patch Success
```sql
\i supabase/verify_columns_before_rls.sql
```
**Expected:** Semua ✅

### Step 4: Quick Test
```sql
\i supabase/QUICK_TEST.sql
```
**Expected:** 10/10 tests PASS

### Step 5: Run RLS Policies
```sql
\i supabase/rls_policies_final.sql
```
**Expected:** ✅ No "column does not exist" errors

## 🧪 Post-Deployment Tests

### Manual Verification

```sql
-- Test critical columns
SELECT p.id, p.name, p.category, p.cost_price, s.shop_name, s.user_id
FROM products p
LEFT JOIN sellers s ON p.seller_id = s.id
LIMIT 5;
```

### RLS Functions Test
```sql
SELECT is_admin();
SELECT is_staff();
SELECT is_admin_or_staff();
```

## 🔍 Health Checks

```sql
-- Column counts
SELECT table_name, COUNT(*) as cols
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'sellers', 'products', 'orders')
GROUP BY table_name;
```

**Expected minimum:**
- users: 9+ | sellers: 7+ | products: 14+ | orders: 19+

```sql
-- RLS enabled check
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

## 🐛 Troubleshooting

**Error: "relation does not exist"**
```sql
-- Run schema first
\i supabase/schema.sql
\i supabase/00_patch_all_missing_columns.sql
```

**Error: "foreign key violation"**
```sql
-- Check orphaned data
SELECT p.* FROM products p
LEFT JOIN sellers s ON p.seller_id = s.id
WHERE s.id IS NULL;
```

## ✅ Success Criteria

- [ ] All verification checks pass (✅)
- [ ] All quick tests pass (10/10)
- [ ] RLS policies run without errors
- [ ] App loads without console errors

## 📝 Git Commit

```bash
git add supabase/*.sql supabase/*.md *.md
git commit -m "fix: resolve column missing errors (user_id, shop_name, category)"
```

---
**Estimated Time:** 5-10 minit  
**Status:** Ready ✅
