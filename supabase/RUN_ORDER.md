# 📋 SQL Run Order - Quick Reference

Untuk elakkan error `column does not exist`, run dalam urutan INI sahaja:

## ✅ Urutan Yang BETUL

```bash
# 1️⃣ PATCH MISSING COLUMNS (WAJIB RUN DAHULU)
\i supabase/00_patch_all_missing_columns.sql

# 2️⃣ RLS POLICIES (RUN SELEPAS PATCH)
\i supabase/rls_policies_final.sql
```

## ❌ Jangan Run Urutan Ini

```bash
# INI SALAH - akan keluar error column not exists
\i supabase/rls_policies_final.sql  # ❌ Run policies dahulu = ERROR

# Ini baru betul
\i supabase/00_patch_all_missing_columns.sql  # ✅ Patch dahulu
\i supabase/rls_policies_final.sql            # ✅ Policies kemudian
```

## 🔍 Verify Selepas Run

```sql
-- Check user_id column exists in sellers table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sellers' AND column_name = 'user_id';

-- Check shop_name column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sellers' AND column_name = 'shop_name';

-- Check category column exists in products
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'category';
```

Jika query di atas return rows, bermakna column sudah wujud dan boleh proceed dengan RLS policies.

## 📚 Rujukan Penuh

Lihat `README_PATCH_COLUMNS.md` untuk penjelasan lengkap.
