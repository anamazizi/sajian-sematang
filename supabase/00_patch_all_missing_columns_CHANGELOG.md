# Changelog - 00_patch_all_missing_columns.sql

## Version 1.2 (28/08/2026 - 15:25)

### 🐛 Critical Bug Fix
- **Fixed:** ERROR 42703: column "paid_by" referenced in foreign key constraint does not exist
- **Fixed:** Similar issues for `order_items` and `audit_logs` tables
- **Root cause:** ALTER TABLE ADD COLUMN statements incomplete for tables that already exist

### Changes Made

**PAYOUTS table (lines 259-266):**
```sql
-- Added all missing columns BEFORE foreign key constraints:
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS seller_id uuid;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS amount decimal(10, 2);
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'DuitNow';
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS paid_by uuid;  -- ← THIS WAS MISSING
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS order_ids text[];
```

**ORDER_ITEMS table (lines 207-214):**
```sql
-- Added all base columns BEFORE foreign key constraints:
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS order_id uuid;  -- ← NEW
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id uuid;  -- ← NEW
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity integer;  -- ← NEW
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price decimal(10, 2);  -- ← NEW
```

**AUDIT_LOGS table (lines 306-313):**
```sql
-- Added all base columns BEFORE foreign key constraints:
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id uuid;  -- ← NEW
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action text;  -- ← NEW
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS table_name text;  -- ← NEW
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id uuid;  -- ← NEW
```

### Why This Happened

`CREATE TABLE IF NOT EXISTS` only runs if table doesn't exist. If table **already exists**, the `CREATE TABLE` block is skipped entirely, and script relied on `ALTER TABLE ADD COLUMN` to add missing columns. But the script only added **some** columns (like `status`, `created_at`), not **all** columns. This caused foreign key constraints to fail when referencing columns that weren't explicitly added.

### Impact

✅ All 3 tables now have complete ALTER TABLE ADD COLUMN statements  
✅ Foreign key constraints will succeed even if tables already exist  
✅ Script is now truly idempotent for existing tables  

---

## Version 1.1 (28/08/2026 - 15:20)

### 🐛 Bug Fix
- **Fixed:** ERROR 42704: unrecognized exception condition "duplicate_key"
- **Changed:** `WHEN duplicate_key` → `WHEN duplicate_object`
- **Reason:** PostgreSQL correct exception code for constraint violations

### Details
Line 45: Exception handler untuk `users_email_unique` constraint
```sql
-- BEFORE (ERROR):
EXCEPTION
  WHEN duplicate_key THEN NULL;

-- AFTER (FIXED):
EXCEPTION
  WHEN duplicate_object THEN NULL;
```

### Impact
✅ All 11 exception blocks now use correct `duplicate_object` code  
✅ Script will run without ERROR 42704  
✅ Constraints will be added safely (skip if already exists)  

### Verification
```bash
# Check semua exception handlers betul
grep -A1 'EXCEPTION' supabase/00_patch_all_missing_columns.sql | grep 'WHEN'
```

Expected output: 11 lines, semua `WHEN duplicate_object THEN NULL;`

---

## Version 1.0 (28/08/2026 - 15:08)

### Initial Release
- Comprehensive column patch script
- 7 tables coverage
- 353 lines of SQL
- Idempotent and production-safe
