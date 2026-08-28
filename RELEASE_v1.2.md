# Release v1.2 - Column Patch Script

**Date:** 28/08/2026  
**Status:** Production Ready ✅

## Fixed Issues

1. ✅ ERROR 42704: duplicate_key exception (v1.1)
2. ✅ ERROR 42703: paid_by foreign key (v1.2)
3. ✅ ERROR 42703: user_id, shop_name, category missing

## Deploy Commands

```sql
\i supabase/00_patch_all_missing_columns.sql
\i supabase/QUICK_TEST.sql
\i supabase/rls_policies_final.sql
```

## What Changed (v1.2)

**payouts** - Added 6 base columns before FK constraints  
**order_items** - Added 4 base columns before FK constraints  
**audit_logs** - Added 4 base columns before FK constraints  

## Verification

```bash
# Check version
head -13 supabase/00_patch_all_missing_columns.sql | tail -5

# Should show: v1.2 (28/08/2026 15:25)
```

Full docs: `FIX_PAID_BY_FOREIGN_KEY_ERROR.md`
