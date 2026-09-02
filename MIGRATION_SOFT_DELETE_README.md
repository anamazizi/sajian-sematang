# MIGRATION: Soft Delete untuk Produk (is_archived)

## 📋 Ringkasan Perubahan

**Tarikh:** 3 September 2026  
**Status:** ✅ READY untuk deployment  
**Urutan Run:** Selepas migration sedia ada

## 🎯 Matlamat
- Implement SOFT DELETE untuk produk (bukannya hard delete)
- Pastikan produk yang di-archive tidak muncul di mana-mana senarai customer
- Kekalkan rekod jualan lama yang berkaitan dengan produk
- Tiada data historical hilang

## 📦 Perubahan Database

### 1. Table `products` - Column Baru:
```sql
-- ✅ Added column: is_archived (boolean, default false)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- ✅ Added column: deleted_at (optional timestamp tracking)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- ✅ Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);

-- ✅ Set default value for existing records
UPDATE public.products SET is_archived = false WHERE is_archived IS NULL;
```

### 2. Migration SQL File:
File: `/supabase/15_add_soft_delete_column.sql`

## 🔧 Perubahan Aplikasi

### 1. Types & Interfaces (`types/database.ts`)
- ✅ Added `is_archived?: boolean` ke `Product` interface
- ✅ Added `is_archived?: boolean` ke `CustomerProduct` interface  
- ✅ Added `is_archived?: boolean` ke `ProductFormData` interface

### 2. Halaman Seller (`/app/jualan/products/page.tsx`)
- ✅ Updated query untuk include `is_archived` column
- ✅ Added filter `.eq('is_archived', false)` dalam fetching
- ✅ Updated `handleDelete()` untuk soft delete:
  - Set `is_available = false`
  - Set `is_archived = true`
  - Remove dari state (kerana filter `is_archived = false`)
- ✅ Gantikan render kod langsung dengan komponen `SellerProductCard`
- ✅ Buang bekas gambar/emoji (kotak kelabu dengan 🍚)

### 3. Halaman Customer (`/app/page.tsx`)
- ✅ Updated query untuk include `is_archived` column
- ✅ Added filter `.eq('is_archived', false)`
- ✅ Pastikan produk archived tidak muncul kepada customer

### 4. Halaman Pre-order (`/app/preorder/page.tsx`)
- ✅ Updated query untuk include `is_archived` column
- ✅ Added filter `.eq('is_archived', false)`

### 5. Halaman Admin (`/app/kawalan/products/page.tsx`)
- ✅ Updated query untuk include `is_archived` column
- ✅ Added filter `.eq('is_archived', false)`
- ✅ Updated `handleDelete()` untuk soft delete

## 🧪 Test Cases

### TEST 1: Soft Delete Flow
```
1. Seller login → /jualan/products
2. Pilih produk → Klik 🗑️ (Delete)
3. Confirm dengan mesej archive
4. Verify: Produk hilang dari senarai seller
5. Customer login → / 
6. Verify: Produk archived TIDAK kelihatan
7. Customer → /preorder
8. Verify: Produk archived TIDAK kelihatan
```

### TEST 2: Data Preservation
```
1. Cari order history yang ada produk yang di-delete
2. Verify: Order items masih kekal dengan snapshot data
3. Verify: Stock movements history masih utuh
4. Verify: Product tidak boleh di-delete kalau ada active orders?
```

## ⚠️ Nota Penting

### RLS Policies
Column `is_archived` TIDAK memerlukan RLS policy khusus kerana:
- Seller hanya boleh access produk sendiri (`seller_id = auth.user_seller_id()`)
- Customer view sudah filter `is_archived = false`
- Admin boleh lihat semua produk (termasuk archived jika perlu)

### Performance
Index `idx_products_is_archived` akan mempercepatkan query filtering.

### Rollback Plan
Jika perlu rollback:
1. Remove `is_archived` filter dari semua queries
2. Set `is_archived = false` untuk semua records
3. Optional: Drop column `is_archived` dan `deleted_at`

## 🚀 Deployment Steps

1. **Run Migration SQL:**
   ```bash
   psql -h [supabase-host] -U postgres -d postgres -f supabase/15_add_soft_delete_column.sql
   ```

2. **Deploy Code:**
   ```bash
   git add .
   git commit -m "feat: implement soft delete for products with is_archived column"
   git push origin main
   ```

3. **Verify Deployment:**
   - ✅ Build success: `npm run build`
   - ✅ TypeScript: No errors
   - ✅ Runtime: Test soft delete flow

## 📈 Impact Analysis

| Aspek | Status | Kesan |
|-------|--------|-------|
| Data Historical | ✅ SELAMAT | Order items snapshot kekal |
| Customer Experience | ✅ BAIK | Hanya produk aktif kelihatan |
| Seller Experience | ✅ BAIK | Delete = Archive (bukan hilang) |
| Performance | ✅ NEUTRAL | Index membantu query |
| Security | ✅ SELAMAT | RLS masih berfungsi |
| Audit Trail | ✅ BAIK | Archive timestamp (jika gunakan deleted_at) |

## 🔮 Future Improvements

1. **Admin Unarchive Feature:** Interface untuk admin pulihkan produk archived
2. **Bulk Archive:** Archive multiple products sekaligus
3. **Archive Reason:** Field optional untuk simpan sebab archive
4. **Retention Policy:** Auto-delete produk archived selepas X tahun (jika diperlukan)

---

**✅ SEMUA PERUBAHAN READY UNTUK DEPLOYMENT**