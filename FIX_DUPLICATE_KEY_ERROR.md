# 🐛 Fix: ERROR 42704 - duplicate_key Exception

## Masalah

Semasa run `00_patch_all_missing_columns.sql` di Supabase, error ini muncul:

```
ERROR: 42704: unrecognized exception condition "duplicate_key"
```

## Punca

PostgreSQL tidak mengenali exception code `duplicate_key`. Exception code yang betul ialah:
- ✅ `duplicate_object` - untuk constraint yang sudah wujud
- ✅ `unique_violation` - untuk duplicate unique key values
- ❌ `duplicate_key` - **TIDAK WUJUD dalam PostgreSQL**

## Penyelesaian ✅

Script telah diperbaiki (v1.1):

### Before (v1.0 - ERROR):
```sql
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
EXCEPTION
  WHEN duplicate_key THEN NULL;  -- ❌ SALAH
END $$;
```

### After (v1.1 - FIXED):
```sql
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- ✅ BETUL
END $$;
```

## Impact

- ✅ **Line 45** - Fixed exception handler untuk `users_email_unique` constraint
- ✅ **All 11 blocks** - Semua exception handlers verified correct
- ✅ **Production safe** - Script boleh dirun tanpa ERROR 42704

## Verification

Untuk verify fix sudah betul:

```bash
# Command 1: Check all use duplicate_object (expected: 11)
grep -c 'duplicate_object' supabase/00_patch_all_missing_columns.sql

# Command 2: Check none use duplicate_key (expected: 0)
grep -c 'duplicate_key' supabase/00_patch_all_missing_columns.sql
```

Atau check line 45 dalam file:
```bash
sed -n '42,46p' supabase/00_patch_all_missing_columns.sql
```

Expected output:
```sql
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- ✅ Must say duplicate_object
END $$;
```

## Status

⚠️ **SUPERSEDED** - See v1.2 for additional fixes  
✅ Version 1.1 fixed `duplicate_key` exception (28/08/2026, 15:20)  
🔧 Version 1.2 fixed `paid_by` foreign key error (28/08/2026, 15:25)  

**Use Version 1.2 or later for production**  

## Deployment

Sekarang boleh run dengan selamat:

```sql
-- Run patch (ERROR 42704 sudah resolved)
\i supabase/00_patch_all_missing_columns.sql

-- Verify success
\i supabase/QUICK_TEST.sql

-- Run RLS
\i supabase/rls_policies_final.sql
```

## Files Updated

1. ✅ `supabase/00_patch_all_missing_columns.sql` (line 45 fixed)
2. ✅ `supabase/README_PATCH_COLUMNS.md` (troubleshooting section added)
3. ✅ `supabase/00_patch_all_missing_columns_CHANGELOG.md` (version history)
4. ✅ `QUICK_START.md` (fix note added)
5. ✅ `COLUMN_PATCH_SUMMARY.md` (update note added)
6. ✅ `FIX_DUPLICATE_KEY_ERROR.md` (this document)

---

**Fixed by:** Roo Code AI  
**Date:** 28/08/2026, 15:20  
**Version:** 1.0 → 1.1  
**Status:** ✅ Resolved
