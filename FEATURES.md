# 🎯 Sajian Sematang - Advanced Features

Dokumentasi lengkap untuk ciri-ciri lanjutan dalam Sajian Sematang.

## 📅 Automated Menu Scheduling

Produk boleh dikonfigurasi untuk muncul secara automatik dalam julat masa tertentu.

### Cara Kerja

Produk hanya akan dipaparkan kepada pelanggan jika:
- Masa semasa berada dalam julat `available_from` dan `available_until`
- Jika `available_from` adalah `null`, produk available dari sekarang
- Jika `available_until` adalah `null`, produk available selamanya

### Contoh Penggunaan

#### 1. Menu Sarapan (6 pagi - 11 pagi)

```sql
INSERT INTO products (
  seller_id, name, description, price, category,
  is_available, stock_quantity, is_preorder,
  available_from, available_until
) VALUES (
  'seller-uuid',
  'Roti Canai Set Pagi',
  'Roti canai dengan kuah dhal - Sarapan sahaja',
  3.50,
  'Makanan',
  true,
  50,
  false,
  timezone('utc', (current_date + interval '6 hours')::timestamp),
  timezone('utc', (current_date + interval '11 hours')::timestamp)
);
```

#### 2. Limited Time Offer (7 hari)

```sql
INSERT INTO products (
  seller_id, name, description, price, category,
  is_available, stock_quantity, is_preorder,
  available_from, available_until
) VALUES (
  'seller-uuid',
  'Promo Combo Meal',
  'Nasi + Ayam + Minuman (Tawaran Terhad 7 Hari)',
  15.00,
  'Makanan',
  true,
  100,
  false,
  now(),
  timezone('utc', (current_date + interval '7 days')::timestamp)
);
```

### Badge Display

Produk dengan scheduling akan show badge **⏰ Tawaran Terhad** di UI.

---

## 🛒 Pre-Order Mode

Mode pre-order membolehkan peniaga terima pesanan untuk produk yang akan disediakan pada masa hadapan.

### Cara Kerja

Apabila `is_preorder = true`:
- Produk tidak memerlukan stock (`stock_quantity` boleh 0)
- Kuantiti dianggap unlimited sepanjang tempoh aktif
- Produk akan auto-hide selepas `available_until` tamat
- Pelanggan boleh order dalam kuantiti besar tanpa had stock

### Contoh Penggunaan

#### Pre-Order untuk Esok

```sql
INSERT INTO products (
  seller_id, name, description, price, category,
  is_available, stock_quantity, is_preorder,
  available_from, available_until
) VALUES (
  'seller-uuid',
  'Nasi Ayam Set (Pre-Order)',
  'Set nasi ayam lengkap - Pre-order untuk esok',
  12.00,
  'Makanan',
  true,
  0,  -- Stock tidak penting untuk pre-order
  true,  -- Enable pre-order mode
  timezone('utc', (current_date + interval '1 day')::timestamp),
  timezone('utc', (current_date + interval '2 days')::timestamp)
);
```

#### Pre-Order untuk Event (Contoh: Majlis Kenduri)

```sql
INSERT INTO products (
  seller_id, name, description, price, category,
  is_available, stock_quantity, is_preorder,
  available_from, available_until
) VALUES (
  'seller-uuid',
  'Pakej Nasi Kotak (100 pax)',
  'Pre-order untuk majlis - minimum 3 hari notice',
  500.00,
  'Pakej',
  true,
  0,
  true,
  now(),
  timezone('utc', (current_date + interval '30 days')::timestamp)
);
```

### Badge Display

Produk pre-order akan show badge **📅 Pre-Order** di UI.

---

## 📦 Kawalan Stok Auto Show/Hide

Sistem automatik untuk hide/show produk berdasarkan stock availability.

### Cara Kerja

Untuk produk **BUKAN pre-order** (`is_preorder = false`):
- Produk hanya dipaparkan jika `stock_quantity > 0`
- Apabila stock = 0, produk auto-hide dari menu
- Apabila stock ≤ 5, badge **⚠️ Stok Terhad** akan muncul

Untuk produk **pre-order** (`is_preorder = true`):
- Stock quantity diabaikan
- Produk sentiasa show sepanjang tempoh available

### Contoh Penggunaan

#### Produk Biasa dengan Stock

```sql
INSERT INTO products (
  seller_id, name, description, price, category,
  is_available, stock_quantity, is_preorder
) VALUES (
  'seller-uuid',
  'Nasi Lemak Special',
  'Nasi lemak dengan ayam berempah',
  8.50,
  'Makanan',
  true,
  50,  -- Ada 50 unit stock
  false  -- Bukan pre-order, stock akan dikira
);
```

#### Update Stock Selepas Order

```sql
-- Reduce stock after order
UPDATE products 
SET stock_quantity = stock_quantity - 5 
WHERE id = 'product-uuid';

-- Jika stock jadi 0, produk auto-hide dari customer view
```

#### Restock Produk

```sql
-- Add stock back
UPDATE products 
SET stock_quantity = stock_quantity + 20 
WHERE id = 'product-uuid';

-- Produk akan auto-show semula di menu
```

### Badge Display

- **⚠️ Stok Terhad (X)**: Muncul bila stock ≤ 5 dan > 0
- Produk dengan stock = 0 tidak akan dipaparkan langsung

---

## 🔄 Kombinasi Features

Anda boleh combine features untuk use cases yang lebih kompleks:

### 1. Pre-Order dengan Time Limit

```sql
-- Pre-order yang hanya available untuk 3 hari
INSERT INTO products (
  seller_id, name, price,
  is_available, stock_quantity, is_preorder,
  available_from, available_until
) VALUES (
  'seller-uuid',
  'Special Raya Cookies (Pre-Order)',
  25.00,
  true,
  0,
  true,
  now(),
  timezone('utc', (current_date + interval '3 days')::timestamp)
);
```

### 2. Limited Stock dengan Time Window

```sql
-- Breakfast special dengan limited stock
INSERT INTO products (
  seller_id, name, price,
  is_available, stock_quantity, is_preorder,
  available_from, available_until
) VALUES (
  'seller-uuid',
  'Early Bird Breakfast Set',
  6.00,
  true,
  20,  -- Only 20 sets available
  false,
  timezone('utc', (current_date + interval '6 hours')::timestamp),
  timezone('utc', (current_date + interval '9 hours')::timestamp)
);
```

---

## 🎨 UI Indicators

Sistem akan automatically show badges untuk inform customers:

| Badge | Warna | Maksud |
|-------|-------|--------|
| 📅 Pre-Order | Purple | Produk adalah pre-order |
| ⚠️ Stok Terhad (X) | Red | Stock tinggal X unit sahaja |
| ⏰ Tawaran Terhad | Blue | Produk ada time limit |
| Category Badge | Orange | Kategori produk |

---

## 🔒 Database Security (RLS)

Row Level Security policy telah dikonfigurasi untuk ensure:

```sql
-- Hanya show produk yang:
-- 1. is_available = true
-- 2. Dalam time range (jika ada)
-- 3. Ada stock (jika bukan pre-order)

create policy "Anyone can view available products" 
  on public.products for select 
  using (
    is_available = true
    AND (
      (available_from is null OR available_from <= now())
      AND (available_until is null OR available_until >= now())
    )
    AND (
      is_preorder = true OR stock_quantity > 0
    )
  );
```

Ini bermakna:
- Customers hanya nampak produk yang sepatutnya available
- Filtering berlaku di database level (secure)
- Tidak perlu extra logic di frontend

---

## 📊 Best Practices

### 1. Stock Management

```sql
-- Selalu set stock_quantity untuk produk biasa
UPDATE products 
SET stock_quantity = 100 
WHERE is_preorder = false;

-- Untuk pre-order, set ke 0
UPDATE products 
SET stock_quantity = 0 
WHERE is_preorder = true;
```

### 2. Time Zone Handling

```sql
-- Gunakan timezone('utc', ...) untuk consistency
-- Supabase store semua timestamps dalam UTC

-- Contoh: Set available from 8am Malaysia time (UTC+8)
available_from = timezone('utc', (current_date + interval '0 hours')::timestamp)
-- Note: Adjust based on your timezone offset
```

### 3. Cleanup Expired Products

```sql
-- Optional: Auto-disable expired products
UPDATE products 
SET is_available = false 
WHERE available_until < now() 
  AND is_available = true;
```

---

## 🧪 Testing

### Test Scenario 1: Breakfast Menu

1. Create product dengan `available_from` = 6am, `available_until` = 11am
2. Check menu sebelum 6am → Produk tidak muncul
3. Check menu antara 6am-11am → Produk muncul
4. Check menu selepas 11am → Produk tidak muncul

### Test Scenario 2: Pre-Order

1. Create product dengan `is_preorder = true`, `stock_quantity = 0`
2. Produk sepatutnya muncul di menu
3. Customer boleh order dalam kuantiti besar
4. Selepas `available_until`, produk auto-hide

### Test Scenario 3: Stock Management

1. Create product dengan `stock_quantity = 3`
2. Badge "Stok Terhad" sepatutnya muncul
3. Order 3 units → stock jadi 0
4. Produk auto-hide dari menu
5. Restock → produk muncul semula

---

## 🚀 Future Enhancements

Possible improvements untuk future phases:

- [ ] Auto-restock scheduling
- [ ] Stock alerts untuk sellers
- [ ] Bulk pre-order management
- [ ] Analytics untuk popular time slots
- [ ] Dynamic pricing based on time
- [ ] Recurring schedules (daily/weekly patterns)

---

**Untuk soalan atau bantuan, rujuk [`SETUP.md`](./SETUP.md) atau [`README.md`](./README.md)**
