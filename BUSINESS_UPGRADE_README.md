# 🚀 Sajian Sematang - Business Structure Upgrade

## 📖 Ringkasan

Upgrade sistem kepada platform perniagaan lengkap dengan sistem kewangan, peranan pengguna, dan audit logging.

---

## 📁 Fail-Fail Penting

### 📋 Dokumentasi
1. **[`BUSINESS_STRUCTURE.md`](BUSINESS_STRUCTURE.md)** - Struktur perniagaan lengkap
2. **[`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md)** - Roadmap implementasi 8 fasa
3. **[`BUSINESS_UPGRADE_README.md`](BUSINESS_UPGRADE_README.md)** - Fail ini

### 🗄️ Database
1. **[`supabase/migration_business_structure.sql`](supabase/migration_business_structure.sql)** - Migration script
2. **[`supabase/schema.sql`](supabase/schema.sql)** - Original schema
3. **[`types/database.ts`](types/database.ts)** - TypeScript types (updated)

---

## 🎯 Feature Baharu

### 1. 💰 Dual Pricing System
- **`price`** - Harga jualan kepada customer
- **`cost_price`** - Harga kos kedai bayar ke seller
- **Margin** = price - cost_price

### 2. 💳 QR DuitNow
- Setiap seller WAJIB ada `duitnow_qr_url`
- Untuk pembayaran payout dari admin

### 3. 👥 Peranan Pengguna
| Peranan | Akses |
|---------|-------|
| **Admin** | ✅ Semua akses + kewangan + audit logs |
| **Staf** | ✅ Orders + Products (TIADA kewangan) |
| **Seller** | ✅ Orders sendiri + Products sendiri |
| **Customer** | ✅ Browse + Order sahaja |

### 4. 💸 Sistem Payout
- Track tunggakan setiap seller
- Admin boleh buat payout
- Generate WhatsApp receipt
- Rekod dalam jadual `payouts`

### 5. 📝 Audit Logging
- Log semua perubahan (create/update/delete)
- Track siapa buat apa bila
- Admin boleh view audit logs

### 6. 🔄 Status Pesanan Baharu
```
New → Accepted → Preparing → Completed
```
(Tambah status "Accepted")

---

## 🚀 Quick Start

### Step 1: Backup Data
```bash
# Export semua table dari Supabase Dashboard
# Table Editor > Export to CSV
```

### Step 2: Run Migration
1. Buka Supabase Dashboard
2. SQL Editor
3. Copy paste [`migration_business_structure.sql`](supabase/migration_business_structure.sql)
4. Execute

### Step 3: Update Sellers
```sql
-- Update setiap seller dengan QR DuitNow
UPDATE public.sellers 
SET duitnow_qr_url = 'https://example.com/qr/seller1.png',
    phone_number = '0123456789'
WHERE shop_name = 'Kedai Mak Cik';
```

### Step 4: Create Admin User
```sql
-- Selepas create di Auth, update role
UPDATE public.users 
SET role = 'admin',
    phone_number = '0111234567',
    is_active = true
WHERE email = 'admin@example.com';
```

### Step 5: Setup Google OAuth
1. Google Cloud Console
2. Create OAuth credentials
3. Supabase > Authentication > Providers > Google
4. Paste Client ID & Secret

---

## 📊 Struktur Database Baharu

### Jadual Dikemas Kini
- ✅ `users` - Tambah role admin/staff, phone, address
- ✅ `sellers` - Tambah duitnow_qr_url, phone_number
- ✅ `products` - Tambah cost_price
- ✅ `orders` - Tambah total_cost, created_by, status "Accepted"

### Jadual Baharu
- ✅ `payouts` - Rekod pembayaran ke seller
- ✅ `audit_logs` - Log semua aktiviti

### Views Baharu
- ✅ `seller_outstanding_summary` - Ringkasan tunggakan
- ✅ `daily_sales_summary` - Ringkasan jualan harian

### Functions Baharu
- ✅ `get_seller_outstanding(uuid)` - Kira tunggakan seller
- ✅ `get_unpaid_orders(uuid)` - List order belum bayar

---

## 💡 Contoh Penggunaan

### Kira Tunggakan Seller
```sql
SELECT public.get_seller_outstanding('seller-uuid-here');
-- Returns: 450.00
```

### List Order Belum Bayar
```sql
SELECT * FROM public.get_unpaid_orders('seller-uuid-here');
```

### View Ringkasan Tunggakan
```sql
SELECT * FROM public.seller_outstanding_summary
ORDER BY total_outstanding DESC;
```

### Create Payout
```typescript
const { data, error } = await supabase
  .from('payouts')
  .insert({
    seller_id: 'seller-uuid',
    amount: 450.00,
    payment_method: 'DuitNow',
    reference_number: 'REF123456',
    paid_by: adminUserId,
    order_ids: ['order-1', 'order-2', 'order-3'],
    notes: 'Bayaran untuk 3 pesanan'
  });
```

### Log Audit
```typescript
await supabase
  .from('audit_logs')
  .insert({
    user_id: userId,
    action: 'update',
    table_name: 'products',
    record_id: productId,
    old_values: { price: 10.00 },
    new_values: { price: 12.00 }
  });
```

---

## 🔐 Security (RLS Policies)

### Admin
- ✅ View & manage semua data
- ✅ Create payouts
- ✅ View audit logs

### Staff
- ✅ View & manage orders
- ✅ View & manage products
- ❌ NO financial access
- ❌ NO audit logs

### Seller
- ✅ View own orders only
- ✅ Manage own products only
- ✅ View own payouts
- ❌ NO other sellers' data

---

## 📱 WhatsApp Integration

### Payout Receipt Format
```
🏦 RESIT PEMBAYARAN - SAJIAN SEMATANG

📋 Maklumat Pembayaran:
Penerima: Kedai Mak Cik
Jumlah: RM 450.00
Kaedah: DuitNow
Rujukan: REF123456
Tarikh: 16/08/2026

📦 Pesanan Dibayar:
1. #12345678
2. #23456789
3. #34567890

Jumlah Pesanan: 3

---
Terima kasih atas perkhidmatan anda!
Sajian Sematang
```

---

## 🧪 Testing Checklist

### Database
- [ ] Migration run successfully
- [ ] All tables created
- [ ] Indexes created
- [ ] RLS policies working
- [ ] Functions working

### Authentication
- [ ] Google OAuth working
- [ ] Role assignment working
- [ ] Permissions enforced

### Financial
- [ ] Outstanding calculation correct
- [ ] Payout creation working
- [ ] WhatsApp receipt generated

### Audit
- [ ] Logs created on changes
- [ ] Admin can view logs
- [ ] Non-admin cannot view logs

---

## 📞 Support

Jika ada masalah:
1. Check [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) untuk details
2. Check [`BUSINESS_STRUCTURE.md`](BUSINESS_STRUCTURE.md) untuk struktur
3. Review migration script untuk SQL issues
4. Check Supabase logs untuk errors

---

## 🎓 Next Steps

Ikut roadmap dalam [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md):

1. ✅ **Fasa 0**: Persiapan (DONE)
2. 🔄 **Fasa 1**: Database Migration (NEXT)
3. ⏳ **Fasa 2**: Authentication & Authorization
4. ⏳ **Fasa 3**: Financial System
5. ⏳ **Fasa 4**: Audit Logging
6. ⏳ **Fasa 5**: Update Order Flow
7. ⏳ **Fasa 6**: UI/UX Updates
8. ⏳ **Fasa 7**: Testing
9. ⏳ **Fasa 8**: Deployment

---

**Tarikh**: 16 Ogos 2026  
**Versi**: 2.0  
**Status**: Ready for Migration  
**Estimated Time**: 4-6 minggu untuk full implementation
