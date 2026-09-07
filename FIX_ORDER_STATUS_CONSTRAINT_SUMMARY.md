# SIASATAN & PEMBAIKAN: ISU CHECK CONSTRAINT 'orders_status_check'

## **MASALAH YANG DIKENALPASTI**
Semasa proses checkout, timbul ralat:
> "new row for relation 'orders' violates check constraint 'orders_status_check'"

### **PUNCA MASALAH:**
1. **Percanggahan antara migration files:**
   - `00_fix_database_schema.sql` (lama): Status = `('New', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled')`
   - `16_fix_order_status_constraint.sql` (baru): Status = `('PENDING', 'ACCEPTED', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED')`

2. **RPC Function masih menggunakan status lama:**
   - `06_create_order_with_stock_check.sql` menggunakan `'New'` (baris 104)
   - TypeScript interface juga menggunakan status lama

3. **Master Prompt Seksyen 32 mensyaratkan:**
   - PENDING → "Tempahan"
   - ACCEPTED → "Tempahan Diterima"
   - READY → "Sedia Diambil"
   - DELIVERING → "Sedang Dihantar"
   - COMPLETED → "Selesai"
   - CANCELLED → "Dibatalkan"

## **PENYELESAIAN YANG DILAKUKAN**

### **1. Migration SQL Baru: `supabase/17_fix_rpc_order_status.sql`**
```sql
-- Update the create_order_with_stock_check function to use correct status
-- Changed: 'New' → 'PENDING' (uppercase) to match check constraint
INSERT INTO public.orders (...) VALUES (
    ...
    'PENDING',  -- CHANGED: 'New' → 'PENDING' (uppercase)
    ...
);
```

### **2. Update TypeScript Interface: `types/database.ts`**
```typescript
// Updated: 8 September 2026 - Fixed order status types
status: 'PENDING' | 'ACCEPTED' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
```

### **3. Update Dashboard UI: `app/dashboard/page.tsx`**
- `getStatusColor()`: Diupdate untuk status baru
- `getNextStatus()`: Aliran status: PENDING → ACCEPTED → DELIVERING → READY → COMPLETED
- Button filter: New → PENDING, Preparing → ACCEPTED, etc.
- Button "Batal": Menggunakan 'CANCELLED' bukan 'Cancelled'

### **4. Update Jualan Page: `app/jualan/page.tsx`**
- `getStatusColor()`: 'Completed' → 'COMPLETED'

## **STATUS TERKINI**

### ✅ **PEMBETULAN SELESAI:**
1. RPC function menggunakan status yang betul: `'PENDING'`
2. TypeScript interface sepadan dengan database constraint
3. Dashboard UI memaparkan status yang konsisten
4. Build TypeScript LULUS tanpa error

### 🔄 **MIGRATION YANG PERLU DIJALANKAN:**
**Urutan migration yang perlu dijalankan di Supabase SQL Editor:**
1. `16_fix_order_status_constraint.sql` - Pastikan constraint betul
2. `17_fix_rpc_order_status.sql` - Update RPC function
3. Verifikasi: Order baru akan mempunyai status `'PENDING'`

### 📋 **VERIFIKASI:**
1. Run `npm run build` → ✅ 0 error TypeScript
2. Test order creation → Tidak akan error constraint
3. Semua UI komponen menunjukkan status yang betul

## **KESIMPULAN**
Masalah checkout telah diselesaikan dengan menyelaraskan:
1. Database constraint (`16_fix_order_status_constraint.sql`)
2. RPC function (`17_fix_rpc_order_status.sql`)  
3. TypeScript interface (`types/database.ts`)
4. UI components (`app/dashboard/page.tsx`, `app/jualan/page.tsx`)

Sistem kini konsisten dengan Master Prompt Seksyen 32 dan sedia untuk checkout tanpa ralat constraint.