# 🏢 Struktur Perniagaan Sajian Sematang

## 📋 Ringkasan Sistem

Sistem perniagaan baharu dengan:
- **Dual Pricing**: Harga kos (cost_price) dan harga jualan (price)
- **QR DuitNow**: Setiap seller mesti ada QR code untuk pembayaran
- **Peranan Pengguna**: Admin, Staf, Seller dengan akses berbeza
- **Sistem Kewangan**: Tracking tunggakan dan payout kepada seller
- **Audit Logs**: Rekod semua perubahan dalam sistem

---

## 🗄️ Struktur Pangkalan Data

### 1. Jadual `products` (Dikemas Kini)
```sql
- id (uuid, primary key)
- seller_id (uuid, foreign key)
- name (text)
- description (text)
- price (numeric) -- Harga jualan kepada customer
- cost_price (numeric) -- BARU: Harga kos kedai bayar ke seller
- image_url (text)
- category (text)
- is_available (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### 2. Jadual `sellers` (Dikemas Kini)
```sql
- id (uuid, primary key)
- shop_name (text)
- description (text)
- duitnow_qr_url (text) -- BARU: WAJIB - URL ke QR DuitNow
- phone_number (text)
- user_id (uuid) -- BARU: Link ke auth user
- created_at (timestamp)
- updated_at (timestamp)
```

### 3. Jadual `orders` (Dikemas Kini)
```sql
- id (uuid, primary key)
- customer_name (text)
- customer_phone (text)
- customer_address (text)
- customer_pin_location (text)
- seller_id (uuid, foreign key)
- total_price (numeric) -- Harga jualan
- total_cost (numeric) -- BARU: Jumlah kos (untuk payout)
- status (text) -- DIKEMAS KINI: 'New' -> 'Accepted' -> 'Preparing' -> 'Completed'
- is_custom_preorder (boolean)
- delivery_datetime (timestamp)
- special_notes (text)
- created_by (uuid) -- BARU: User yang buat order (null jika customer)
- created_at (timestamp)
- updated_at (timestamp)
```

### 4. Jadual `payouts` (BARU)
```sql
- id (uuid, primary key)
- seller_id (uuid, foreign key)
- amount (numeric) -- Jumlah dibayar
- payment_method (text) -- 'DuitNow', 'Cash', 'Bank Transfer'
- reference_number (text) -- Nombor rujukan bayaran
- paid_by (uuid) -- Admin yang buat bayaran
- notes (text)
- order_ids (text[]) -- Array order IDs yang dibayar
- created_at (timestamp)
```

### 5. Jadual `users` (BARU)
```sql
- id (uuid, primary key, link to auth.users)
- email (text)
- full_name (text)
- phone_number (text)
- address (text)
- role (text) -- 'admin', 'staff', 'seller'
- seller_id (uuid) -- Jika role = 'seller'
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### 6. Jadual `audit_logs` (BARU)
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- action (text) -- 'create', 'update', 'delete', 'status_change'
- table_name (text) -- 'products', 'orders', 'sellers', etc.
- record_id (uuid) -- ID rekod yang diubah
- old_values (jsonb) -- Nilai lama
- new_values (jsonb) -- Nilai baru
- ip_address (text)
- user_agent (text)
- created_at (timestamp)
```

---

## 👥 Peranan Pengguna

### 🔴 Admin (Akses Penuh)
- ✅ Lihat semua pesanan
- ✅ Ubah status pesanan
- ✅ Tambah/edit/delete produk semua seller
- ✅ Lihat dashboard kewangan
- ✅ Buat payout kepada seller
- ✅ Lihat audit logs
- ✅ Urus pengguna (admin, staf, seller)
- ✅ Buat pesanan untuk customer

### 🟡 Staf (Akses Terhad)
- ✅ Lihat semua pesanan
- ✅ Ubah status pesanan
- ✅ Tambah/edit produk seller
- ✅ Buat pesanan untuk customer
- ❌ TIADA akses kewangan
- ❌ TIADA akses audit logs
- ❌ TIADA akses urus pengguna

### 🟢 Seller (Akses Sendiri Sahaja)
- ✅ Lihat pesanan sendiri sahaja
- ✅ Ubah status pesanan sendiri
- ✅ Tambah/edit/delete produk sendiri
- ✅ Lihat tunggakan sendiri
- ❌ TIADA akses pesanan seller lain
- ❌ TIADA akses kewangan penuh
- ❌ TIADA akses audit logs

---

## 💰 Sistem Kewangan

### Pengiraan Tunggakan Seller

```typescript
// Untuk setiap seller
const tunggakan = await supabase
  .from('orders')
  .select('order_items(quantity, unit_price, product(cost_price))')
  .eq('seller_id', sellerId)
  .eq('status', 'Completed')
  .not('id', 'in', `(SELECT unnest(order_ids) FROM payouts WHERE seller_id = '${sellerId}')`)

// Jumlah tunggakan = SUM(quantity × cost_price) untuk semua order yang belum dibayar
```

### Proses Payout

1. Admin klik butang **[Sahkan Sudah Bayar]**
2. Sistem generate payout record
3. Sistem generate WhatsApp message dengan:
   - Jumlah dibayar
   - Senarai order IDs
   - Tarikh bayaran
   - Nombor rujukan
4. Buka WhatsApp ke nombor seller
5. Tunggakan seller jadi RM0.00

---

## 🔄 Aliran Status Pesanan

### Status Lama (Sebelum)
```
New → Preparing → Ready → Completed
```

### Status Baru (Selepas)
```
New → Accepted → Preparing → Completed
```

**Penting**: Hanya pesanan dengan status **'Completed'** yang dikira dalam rekod kewangan!

---

## 🔐 Pengesahan Google OAuth

### Setup Required
1. Enable Google OAuth di Supabase
2. Configure Google Cloud Console
3. Set redirect URLs
4. Tambah borang profil selepas login pertama

### Borang Profil Tambahan
- Nama Penuh (wajib)
- Nombor Telefon (wajib)
- Alamat (wajib untuk seller)
- Peranan (dipilih oleh admin)

---

## 📊 Admin Dashboard - Paparan Kewangan

### Ringkasan Keseluruhan
- Total Jualan Hari Ini
- Total Pesanan Hari Ini
- Total Tunggakan Semua Seller
- Pesanan Pending

### Senarai Seller dengan Tunggakan
```
┌─────────────────────────────────────────────────┐
│ Kedai Mak Cik Kiah                              │
│ Tunggakan: RM 450.00                            │
│ Pesanan Selesai: 15                             │
│ [Lihat Detail] [Sahkan Sudah Bayar]             │
└─────────────────────────────────────────────────┘
```

### Detail Tunggakan Seller
```
Order ID        | Tarikh      | Jumlah Kos
─────────────────────────────────────────
#12345678      | 15/08/2026  | RM 30.00
#23456789      | 15/08/2026  | RM 45.00
#34567890      | 16/08/2026  | RM 25.00
─────────────────────────────────────────
JUMLAH                        | RM 100.00
```

---

## 📝 Audit Logs

### Contoh Log Entry
```json
{
  "id": "uuid",
  "user_id": "admin-uuid",
  "action": "update",
  "table_name": "products",
  "record_id": "product-uuid",
  "old_values": {
    "price": 10.00,
    "is_available": true
  },
  "new_values": {
    "price": 12.00,
    "is_available": false
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2026-08-16T15:30:00Z"
}
```

### Aktiviti Yang Dilog
- ✅ Tambah/edit/delete produk
- ✅ Ubah status pesanan
- ✅ Buat payout
- ✅ Ubah maklumat seller
- ✅ Ubah stok produk

---

## 🚀 Fasa Implementasi

### Fasa 1: Database Schema
- [ ] Kemas kini schema.sql
- [ ] Run migration di Supabase
- [ ] Test semua foreign keys

### Fasa 2: Authentication & Users
- [ ] Setup Google OAuth
- [ ] Buat user management system
- [ ] Buat role-based access control

### Fasa 3: Dual Pricing
- [ ] Kemas kini product forms
- [ ] Kemas kini order calculations
- [ ] Test pricing logic

### Fasa 4: Financial System
- [ ] Buat payout tracking
- [ ] Buat admin financial dashboard
- [ ] Buat WhatsApp payout receipt

### Fasa 5: Audit Logs
- [ ] Implement logging middleware
- [ ] Buat audit log viewer
- [ ] Test all logged actions

### Fasa 6: Testing & Deployment
- [ ] Test semua peranan
- [ ] Test financial calculations
- [ ] Deploy to production

---

## ⚠️ Nota Penting

1. **Backup Data**: Backup semua data sebelum migration
2. **Test Thoroughly**: Test semua calculation dengan teliti
3. **Security**: Pastikan RLS policies betul untuk setiap role
4. **Documentation**: Update user manual untuk admin/staf/seller
5. **Training**: Beri training kepada admin dan staf sebelum go-live

---

**Tarikh Dokumen**: 16 Ogos 2026
**Versi**: 1.0
**Status**: Perancangan
