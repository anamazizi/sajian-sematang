# 🔧 Patch Missing Columns - Panduan

## Masalah Yang Diselesaikan

Error semasa run RLS policies:
```
ERROR: 42703: column "user_id" does not exist
ERROR: 42703: column "shop_name" does not exist  
ERROR: 42703: column "category" does not exist
```

## Punca Masalah

Schema definition dalam `schema.sql` tidak sync dengan database sebenar. Column yang sepatutnya wujud ternyata tidak dicipta atau terlepas semasa migration sebelumnya.

## Penyelesaian

Skrip `00_patch_all_missing_columns.sql` akan:

✅ Tambah **SEMUA** column terlepas secara automatik menggunakan `ADD COLUMN IF NOT EXISTS`  
✅ Set default values yang sesuai untuk data sedia ada  
✅ Tambah constraints dan foreign keys  
✅ Enable Row Level Security  
✅ Create indexes untuk performance  
✅ Selamat untuk run berkali-kali (idempotent)  

## Cara Penggunaan

### 1️⃣ Run Patch Script Dahulu

Di Supabase SQL Editor, run dalam urutan ini:

```sql
-- STEP 1: Run patch missing columns
\i supabase/00_patch_all_missing_columns.sql
```

⏱️ Tunggu sehingga selesai (around 10-30 saat bergantung pada data size)

### 2️⃣ Run RLS Policies Selepas Itu

```sql
-- STEP 2: Sekarang baru run RLS policies
\i supabase/rls_policies_final.sql
```

## Urutan Yang BETUL

```
┌─────────────────────────────────────┐
│ 00_patch_all_missing_columns.sql    │  ← RUN INI DAHULU
├─────────────────────────────────────┤
│ ✓ Tambah semua column terlepas      │
│ ✓ Set default values                │
│ ✓ Tambah foreign keys               │
│ ✓ Enable RLS                        │
│ ✓ Create indexes                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ rls_policies_final.sql              │  ← KEMUDIAN BARU INI
├─────────────────────────────────────┤
│ ✓ Create helper functions           │
│ ✓ Create RLS policies               │
│ ✓ Create views                      │
└─────────────────────────────────────┘
```

## Verification

Selepas run patch script, anda boleh verify columns dengan query ini:

```sql
-- Check USERS table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Check SELLERS table columns  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sellers'
ORDER BY ordinal_position;

-- Check PRODUCTS table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
ORDER BY ordinal_position;

-- Check ORDERS table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;
```

## Apa Yang Ditambah

### USERS table
- `name`, `email`, `role`, `is_active`
- `phone_number`, `address`, `seller_id`
- `created_at`, `updated_at`

### SELLERS table  
- `user_id` ⚠️ (ini yang missing sebabkan error)
- `shop_name` ⚠️ (ini juga)
- `description`, `duitnow_qr_url`, `phone_number`
- `created_at`, `updated_at`

### PRODUCTS table
- `seller_id`, `name`, `description`, `price`
- `cost_price`, `category` ⚠️ (ini yang missing)
- `image_url`, `is_available`, `stock_quantity`
- `is_preorder`, `available_from`, `available_until`
- `created_at`, `updated_at`

### ORDERS table
- Semua customer fields (name, phone, email, address, pin_location)
- Semua pricing fields (subtotal, delivery_fee, total_price, total_cost)
- Status, delivery mode, timestamps

### ORDER_ITEMS, PAYOUTS, AUDIT_LOGS
- Dicipta sekiranya belum wujud
- Ditambah missing columns jika table sudah ada

## Selamat untuk Production?

✅ **YA** - Skrip ini menggunakan:
- `CREATE TABLE IF NOT EXISTS` - hanya create jika belum ada
- `ADD COLUMN IF NOT EXISTS` - hanya tambah jika belum ada  
- `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object` - skip jika constraint/FK sudah wujud
- `UPDATE ... WHERE ... IS NULL` - hanya update row yang memerlukan default value

❌ **TIADA data yang akan dihapus atau overwrite**

## Troubleshooting

### Error: "unrecognized exception condition duplicate_key"

**Problem:** Versi lama script (v1.0) guna exception code yang salah  
**Status:** ✅ FIXED dalam version 1.1 (line 45: `duplicate_object`)  
**Action:** Ensure guna latest version dari repository

### Error: relation "public.users" does not exist

Maksudnya table `users` belum dicipta. Run `schema.sql` terlebih dahulu:

```sql
\i supabase/schema.sql
```

Kemudian run patch:

```sql
\i supabase/00_patch_all_missing_columns.sql
```

### Error: foreign key violation

Ada data orphaned (contoh: product merujuk seller yang tidak wujud). Bersihkan data dulu:

```sql
-- Check orphaned products
SELECT p.id, p.name, p.seller_id 
FROM public.products p
LEFT JOIN public.sellers s ON p.seller_id = s.id
WHERE s.id IS NULL;

-- Delete atau fix seller_id yang invalid
DELETE FROM public.products WHERE seller_id NOT IN (SELECT id FROM public.sellers);
```

## Bila Perlu Run Lagi?

Run semula patch script ini apabila:
- Ada error "column does not exist" selepas pull code terbaru
- Selepas reset database dan run schema dari kosong
- Ada table/column baru ditambah dalam schema tetapi tidak auto-created

---

**Nota Penting:** Selepas patch ini siap, semua RLS policies dalam `rls_policies_final.sql` sepatutnya run tanpa error.
