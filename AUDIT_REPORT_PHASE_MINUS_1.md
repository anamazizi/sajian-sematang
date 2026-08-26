# 📊 LAPORAN AUDIT PROJEK SAJIAN SEMATANG
## PHASE -1 — AUDIT PROJEK SEDIA ADA

**Tarikh Audit:** 26 Ogos 2026  
**Auditor:** Roo Code (Senior Full-Stack Engineer)  
**Status Projek:** Dalam Pembangunan (70% Siap mengikut PROJECT_SUMMARY.md)

---

## 🎯 RINGKASAN EKSEKUTIF

Projek Sajian Sematang adalah sistem tempahan makanan yang telah dibina menggunakan prompt lama yang **TIDAK LENGKAP** dan **TIDAK MENEPATI** standard master prompt baharu (.clinerules). Sistem sedia ada mempunyai **foundation yang baik** tetapi mengandungi **RISIKO KRITIKAL** dalam beberapa aspek keselamatan dan business logic.

### Keputusan Utama:
- ✅ **Stack teknologi betul** (Next.js 16, TypeScript, Supabase, Tailwind)
- ⚠️ **Database schema separuh siap** (ada migration tetapi tidak lengkap)
- 🔴 **RLS policies TIDAK MENCUKUPI** (banyak kebocoran keselamatan)
- 🔴 **Stock concurrency TIDAK SELAMAT** (tiada transaction/RPC)
- 🔴 **Order snapshot TIDAK WUJUD** (bergantung current product data)
- 🔴 **Price security LEMAH** (client-side calculation)
- ⚠️ **Authentication OK tetapi session management kurang optimum**

### Cadangan Keseluruhan:
**PATCH BERPERINGKAT** — Sistem boleh diselamatkan dengan pembaikan berperingkat mengikut keutamaan risiko. **JANGAN rebuild dari kosong** kerana banyak kod yang baik boleh dikekalkan.

---

## 📁 A. STRUKTUR PROJEK

### Status: 🟢 SELAMAT DIGUNAKAN SEMULA

**Struktur Sedia Ada:**
```
sajian-sematang/
├── app/                    ✅ Next.js App Router (betul)
│   ├── layout.tsx         ✅ Root layout
│   ├── page.tsx           ⚠️ Homepage (perlu refactor)
│   ├── auth/              ✅ Authentication pages
│   ├── admin/             ⚠️ Admin dashboard (separuh siap)
│   ├── sellers/           ✅ Seller listing & menu
│   ├── order/             ⚠️ Order flow (ada isu security)
│   ├── dashboard/         ⚠️ Seller dashboard (separuh siap)
│   └── preorder/          ⚠️ Pre-order (separuh siap)
├── components/            ✅ React components
│   ├── auth/              ✅ Auth components (baik)
│   ├── admin/             ⚠️ Admin components (separuh siap)
│   ├── products/          ⚠️ Product form (separuh siap)
│   └── ui/                ✅ UI components
├── lib/                   ✅ Utilities & configurations
│   ├── supabase/          🔴 Client setup (ada isu)
│   ├── auth/              ✅ Auth hooks & permissions (baik)
│   ├── financial/         ✅ Payout utilities (baik)
│   └── utils.ts           ⚠️ Utils (ada isu)
├── types/                 ✅ TypeScript types (baik)
├── supabase/              ⚠️ Database (ada isu)
│   ├── schema.sql         🔴 Schema lama (tidak lengkap)
│   └── migration_business_structure.sql ✅ Migration baru (baik)
└── public/                ✅ Static assets
```

**Stack Teknologi:**
- ✅ Next.js 16.3.1 (App Router) — **BETUL**
- ✅ React 19.2.8 — **BETUL**
- ✅ TypeScript 7.0.2 — **BETUL**
- ✅ Tailwind CSS 4.3.3 — **BETUL**
- ✅ Supabase JS 2.112.3 + SSR 0.12.4 — **BETUL**
- ✅ Deployment target: Vercel — **BETUL**

**Analisis:**
- Struktur folder mengikut Next.js App Router best practices ✅
- Tiada ORM tambahan (Prisma/Drizzle) — selaras dengan master prompt ✅
- Dokumentasi lengkap (10+ fail .md) ✅
- TypeScript digunakan secara konsisten ✅

**Isu:**
- Ada duplicate structure (`app/` dan `src/app/`) — perlu cleanup 🟡
- `next.config.ts` mengandungi kod Supabase client yang salah tempat 🔴
- `typescript.ignoreBuildErrors: true` — ini berbahaya untuk production 🔴

**Cadangan:**
1. 🟢 **Kekalkan struktur folder sedia ada** — sudah baik
2. 🟡 **Cleanup duplicate `src/app/`** — padam atau merge
3. 🔴 **Betulkan `next.config.ts`** — buang kod Supabase client
4. 🔴 **Disable `ignoreBuildErrors`** — fix TypeScript errors sebenar

---

## 🗄️ B. DATABASE & SCHEMA

### Status: 🟡 BOLEH DIBAIKI (PATCH)

### B.1 Schema Sedia Ada

**Dua Schema Wujud:**

1. **`supabase/schema.sql`** (Schema Lama — 229 baris)
   - ❌ Tiada `cost_price` dalam products
   - ❌ Tiada `total_cost` dalam orders
   - ❌ Tiada `created_by` dalam orders
   - ❌ Tiada table `payouts`
   - ❌ Tiada table `audit_logs`
   - ❌ Role hanya `customer` dan `seller` (tiada `admin`, `staff`)
   - ⚠️ RLS policies terlalu permissive

2. **`supabase/migration_business_structure.sql`** (Migration Baru — 463 baris)
   - ✅ Tambah `cost_price` ke products
   - ✅ Tambah `total_cost` dan `created_by` ke orders
   - ✅ Tambah table `payouts` (lengkap)
   - ✅ Tambah table `audit_logs` (lengkap)
   - ✅ Update role constraint untuk include `admin` dan `staff`
   - ✅ RLS policies lebih ketat
   - ✅ Functions & triggers untuk automation
   - ✅ Views untuk reporting

**Masalah:**
- 🔴 **Tidak jelas sama ada migration sudah dijalankan atau belum**
- 🔴 **Dua schema bercanggah** — boleh menyebabkan confusion
- 🔴 **Tiada migration tracking** — tidak tahu state database sebenar

### B.2 Table Analysis

#### Table: `users`
- ✅ Structure baik (id, name, email, role, phone_number, address, seller_id, is_active)
- ✅ Role constraint: `customer`, `seller`, `admin`, `staff`
- ⚠️ Tiada unique constraint pada `email` dalam migration
- ⚠️ Tiada validation untuk `phone_number` format

#### Table: `sellers`
- ✅ Structure baik
- ✅ `duitnow_qr_url` ditambah (untuk payment)
- ⚠️ `duitnow_qr_url` NOT NULL constraint di-comment — perlu enable
- ✅ `phone_number` ditambah

#### Table: `products`
- ✅ `cost_price` ditambah (WAJIB untuk dual pricing)
- ✅ Default cost_price = 70% of price untuk existing products
- ✅ `updated_at` ditambah
- ❌ **TIADA snapshot mechanism** — ini WAJIB mengikut Seksyen 28, 64
- ❌ **Tiada product_options table** — diperlukan mengikut Seksyen 17

#### Table: `orders`
- ✅ `total_cost` ditambah (untuk seller payout)
- ✅ `created_by` ditambah (untuk staff-created orders)
- ✅ Status updated: `New` → `Accepted` → `Preparing` → `Ready` → `Completed` → `Cancelled`
- ✅ `updated_at` ditambah
- ❌ **TIADA order snapshot fields** — customer_name_snapshot, address_snapshot, dll
- ❌ **TIADA distance_km snapshot** — diperlukan mengikut Seksyen 24

#### Table: `order_items`
- ✅ Basic structure OK
- ❌ **TIADA snapshot fields** — product_name_snapshot, selling_price_snapshot, cost_price_snapshot
- ❌ **Ini KRITIKAL** — mengikut Seksyen 28, 64

#### Table: `payouts` (BARU)
- ✅ Structure lengkap dan baik
- ✅ `order_ids` sebagai array — betul
- ✅ `payment_method` dengan constraint
- ✅ `paid_by` untuk audit trail

#### Table: `audit_logs` (BARU)
- ✅ Structure lengkap dan baik
- ✅ `old_values` dan `new_values` sebagai JSONB
- ✅ `ip_address` dan `user_agent` untuk tracking

### B.3 Missing Tables (Mengikut Master Prompt)

❌ **`product_options`** — Seksyen 17 (product options/add-ons)  
❌ **`product_likes`** — Seksyen 35 (customer likes)  
❌ **`order_status_history`** — Seksyen 32 (status change tracking)  
❌ **`stock_movements`** — Seksyen 39 (stock history)  
❌ **`seller_settlements`** — Seksyen 49 (settlement tracking)  
❌ **`seller_payment_adjustments`** — Seksyen 50 (payment adjustments)  
❌ **`expenses`** — Seksyen 56 (business expenses)  
❌ **`external_income`** — Seksyen 57 (external income)  
❌ **`store_settings`** — Seksyen 23 (store location, business hours)  
❌ **`delivery_settings`** — Seksyen 23 (delivery configuration)  
❌ **`categories`** — Seksyen 15 (product categories)

### B.4 Indexes

✅ Basic indexes wujud:
- `idx_products_seller_id`
- `idx_orders_seller_id`
- `idx_orders_status`
- `idx_order_items_order_id`
- `idx_payouts_seller_id`
- `idx_audit_logs_user_id`

⚠️ Missing indexes untuk performance:
- `idx_orders_created_at` (untuk reporting)
- `idx_orders_customer_phone` (untuk customer lookup)
- `idx_products_category` (untuk category filtering)

### B.5 Functions & Triggers

✅ Functions wujud dalam migration:
- `update_updated_at_column()` — auto-update timestamp
- `get_seller_outstanding()` — calculate outstanding balance
- `get_unpaid_orders()` — get unpaid orders for seller

✅ Triggers wujud:
- Auto-update `updated_at` pada users, sellers, products, orders

❌ **Missing critical functions:**
- **Stock deduction function** — untuk atomic stock update (Seksyen 19)
- **Order ID generation function** — untuk collision-safe ID (Seksyen 108)
- **Delivery fee calculation function** — untuk server-side calculation (Seksyen 24)

### B.6 Views

✅ View wujud dalam migration:
- `seller_outstanding_summary` — summary outstanding untuk semua sellers

⚠️ Missing views untuk reporting:
- `daily_sales_summary` — daily sales report
- `product_sales_summary` — product performance

**Tahap Risiko Database:** 🟡 **BOLEH DIBAIKI**

**Cadangan:**
1. 🔴 **WAJIB: Tambah order snapshot fields** — product_name_snapshot, selling_price_snapshot, cost_price_snapshot, customer_name_snapshot, address_snapshot, distance_km_snapshot
2. 🔴 **WAJIB: Buat stock deduction RPC function** — untuk atomic stock update
3. 🔴 **WAJIB: Buat order ID generation function** — untuk collision-safe ID
4. 🟡 **Tambah missing tables** — product_options, stock_movements, categories (keutamaan tinggi)
5. 🟡 **Tambah missing tables** — product_likes, expenses, external_income, store_settings (keutamaan sederhana)
6. 🟢 **Cleanup schema.sql lama** — archive atau padam untuk elak confusion

---

## 🔐 C. ROW LEVEL SECURITY (RLS)

### Status: 🔴 PERLU DIBINA SEMULA (KRITIKAL)

### C.1 RLS Enabled Status

✅ RLS enabled pada semua tables:
- `users` ✅
- `sellers` ✅
- `products` ✅
- `orders` ✅
- `order_items` ✅
- `payouts` ✅
- `audit_logs` ✅

### C.2 Policy Analysis — SCHEMA LAMA (schema.sql)

#### ❌ **KEBOCORAN KRITIKAL #1: Products**
```sql
-- Policy: "Anyone can view available products"
-- MASALAH: Customer boleh lihat SEMUA products termasuk cost_price!
```
**Risiko:** Customer boleh query `cost_price` dari database  
**Impak:** Business intelligence leak, competitor boleh tahu margin  
**Tahap:** 🔴 **KRITIKAL**

#### ❌ **KEBOCORAN KRITIKAL #2: Orders**
```sql
-- Policy: "Anyone can insert orders"
-- MASALAH: Tiada validation, boleh insert order untuk seller lain
```
**Risiko:** Customer boleh manipulate `seller_id`, `total_price`, `total_cost`  
**Impak:** Financial fraud, fake orders  
**Tahap:** 🔴 **KRITIKAL**

#### ❌ **KEBOCORAN KRITIKAL #3: Order Items**
```sql
-- Policy: "Anyone can insert order items"
-- MASALAH: Tiada validation, boleh insert arbitrary price
```
**Risiko:** Customer boleh set `unit_price` = RM0.01  
**Impak:** Financial loss  
**Tahap:** 🔴 **KRITIKAL**

#### ⚠️ **KEBOCORAN #4: Sellers**
```sql
-- Policy: "Anyone can view sellers"
-- MASALAH: Customer boleh lihat duitnow_qr_url seller lain
```
**Risiko:** Privacy leak, QR code exposure  
**Impak:** Seller privacy compromised  
**Tahap:** 🟡 **SEDERHANA**

### C.3 Policy Analysis — MIGRATION BARU (migration_business_structure.sql)

✅ **Improvements dalam migration:**
- Admin dan Staff policies ditambah
- Seller policies lebih specific
- Payout policies restricted to admin only

⚠️ **Masih ada isu:**

#### ❌ **MASIH TIADA POLICY untuk cost_price protection**
```sql
-- Products SELECT policy masih allow semua orang view
-- Tiada explicit denial untuk cost_price column
```
**Risiko:** Customer masih boleh query `SELECT cost_price FROM products`  
**Tahap:** 🔴 **KRITIKAL**

#### ❌ **Orders INSERT policy masih terlalu permissive**
```sql
-- Policy: "Admin and Staff can create orders"
-- MASALAH: Customer masih boleh insert via "Anyone can insert orders" policy lama
```
**Risiko:** Jika policy lama tidak di-drop, masih ada kebocoran  
**Tahap:** 🔴 **KRITIKAL**

### C.4 Missing Policies

❌ **Customer order history** — Customer tidak boleh view order sendiri  
❌ **Seller QR protection** — Seller A boleh view QR Seller B  
❌ **Product options** — Tiada policy (table belum wujud)  
❌ **Stock movements** — Tiada policy (table belum wujud)

### C.5 RLS Testing

❌ **TIADA BUKTI RLS TESTING** — Tidak jumpa test scripts atau test results

**Mengikut Seksyen 67:**
> Jangan hanya create RLS — **TEST RLS**: Customer A→B, Seller A→B, Seller A→Product B, Customer→Cost Price, Staff→Seller Payment, Customer→Stock, Customer/Seller→Role. Semua unauthorized access mesti gagal.

**Tahap Risiko RLS:** 🔴 **PERLU DIBINA SEMULA**

**Cadangan:**
1. 🔴 **WAJIB: Drop semua policy lama dari schema.sql**
2. 🔴 **WAJIB: Buat policy baharu untuk protect cost_price** — gunakan column-level security atau separate view
3. 🔴 **WAJIB: Ketatkan orders INSERT policy** — validate seller_id, price, stock
4. 🔴 **WAJIB: Ketatkan order_items INSERT policy** — validate price against product
5. 🔴 **WAJIB: Tambah customer order history policy** — customer boleh view order sendiri sahaja
6. 🔴 **WAJIB: Protect seller QR** — seller hanya boleh view QR sendiri
7. 🔴 **WAJIB: Buat RLS test suite** — automated testing mengikut Seksyen 67
8. 🟡 **Pertimbangkan pgTAP** — untuk unit test RLS policies

---

## ⚙️ D. BUSINESS-CRITICAL LOGIC

### Status: 🔴 PERLU DIBINA SEMULA (KRITIKAL)

### D.1 Stock Concurrency (Seksyen 19)

**Implementasi Sedia Ada:** ❌ **TIDAK SELAMAT**

**Lokasi:** `app/sellers/[id]/page.tsx` (client-side cart)

```typescript
// Client-side cart management
function addToCart(product: Product) {
  setCart((prevCart) => {
    const existingItem = prevCart.find((item) => item.id === product.id);
    if (existingItem) {
      return prevCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }
    return [...prevCart, { ...product, quantity: 1 }];
  });
}
```

**Masalah:**
1. ❌ **Tiada stock validation** — customer boleh tambah unlimited quantity ke cart
2. ❌ **Tiada stock reservation** — dua customer boleh order stock yang sama
3. ❌ **Tiada atomic update** — race condition boleh berlaku
4. ❌ **Client-side sahaja** — tiada server-side validation

**Lokasi:** `app/order/[sellerId]/page.tsx` (order submission)

```typescript
// Order submission - TIADA STOCK VALIDATION
const { data: orderData, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_name: customerName.trim(),
    // ... other fields
  })
  .select()
  .single();

// Insert order items - TIADA STOCK CHECK
const orderItems = cart.map((item) => ({
  order_id: orderData.id,
  product_id: item.id,
  quantity: item.quantity,
  unit_price: item.price, // ❌ Percaya price dari client!
}));
```

**Risiko:**
- 🔴 **Race condition:** Customer A dan B order serentak, stock jadi negatif
- 🔴 **Overselling:** Jual lebih dari stock available
- 🔴 **No rollback:** Jika order gagal, stock tidak dikembalikan

**Mengikut Seksyen 19:**
> Gunakan PostgreSQL transaction / database function / RPC / atomic update untuk menentukan sama ada stock cukup, quantity boleh ditolak, dan order boleh diteruskan. Stock tidak boleh menjadi negatif.

**Tahap Risiko:** 🔴 **KRITIKAL**

**Cadangan:**
1. 🔴 **WAJIB: Buat RPC function `create_order_with_stock_check()`**
   - Validate stock availability
   - Deduct stock atomically
   - Create order + order items dalam satu transaction
   - Rollback jika stock tidak cukup
2. 🔴 **WAJIB: Tambah stock constraint** — `CHECK (stock_quantity >= 0)`
3. 🟡 **Pertimbangkan stock reservation** — reserve stock untuk 15 minit semasa checkout

### D.2 Order Snapshot (Seksyen 28, 64)

**Implementasi Sedia Ada:** ❌ **TIDAK WUJUD**

**Masalah:**
1. ❌ **Order items tiada snapshot** — bergantung current product data
2. ❌ **Order tiada customer snapshot** — bergantung current profile
3. ❌ **Tiada distance snapshot** — jika store location berubah, delivery fee calculation rosak

**Contoh Masalah:**

```typescript
// order_items table (sedia ada)
{
  order_id: "xxx",
  product_id: "yyy",
  quantity: 2,
  unit_price: 10.00  // ❌ Hanya price, tiada name/cost_price snapshot
}

// Jika product name berubah dari "Nasi Lemak" → "Nasi Lemak Special"
// Order lama akan papar nama baharu — SALAH!

// Jika cost_price berubah dari RM7 → RM8
// Seller payout calculation akan guna RM8 — SALAH!
```

**Mengikut Seksyen 28:**
> Order item snapshot: product name, selling price, cost price, option name, option price, quantity, dan distance_km/delivery fee yang digunakan pada masa itu.

**Mengikut Seksyen 64:**
> Wajib. Order item simpan data transaksi pada masa pembelian: product_name_snapshot, selling_price_snapshot, cost_price_snapshot, option_name_snapshot, option_price_snapshot, quantity.

**Tahap Risiko:** 🔴 **KRITIKAL**

**Cadangan:**
1. 🔴 **WAJIB: Tambah snapshot columns ke order_items:**
   - `product_name_snapshot TEXT NOT NULL`
   - `selling_price_snapshot DECIMAL(10,2) NOT NULL`
   - `cost_price_snapshot DECIMAL(10,2) NOT NULL`
   - `product_description_snapshot TEXT`
2. 🔴 **WAJIB: Tambah snapshot columns ke orders:**
   - `customer_name_snapshot TEXT NOT NULL`
   - `customer_phone_snapshot TEXT NOT NULL`
   - `customer_address_snapshot TEXT`
   - `distance_km_snapshot DECIMAL(10,2)`
   - `delivery_fee_snapshot DECIMAL(10,2) NOT NULL`
3. 🔴 **WAJIB: Update order creation logic** — populate snapshot fields
4. 🔴 **WAJIB: Update reporting queries** — guna snapshot fields, bukan current data

### D.3 Price Security (Seksyen 29)

**Implementasi Sedia Ada:** ❌ **TIDAK SELAMAT**

**Lokasi:** `app/order/[sellerId]/page.tsx`

```typescript
// Client-side price calculation
function getSubtotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getTotalPrice() {
  return getSubtotal() + deliveryFee;
}

// Order submission - PERCAYA CLIENT DATA
const { data: orderData, error: orderError } = await supabase
  .from('orders')
  .insert({
    subtotal: subtotal,           // ❌ Dari client
    delivery_fee: deliveryFee,    // ❌ Dari client
    total_price: totalPrice,      // ❌ Dari client
    // ...
  });

// Order items - PERCAYA CLIENT PRICE
const orderItems = cart.map((item) => ({
  order_id: orderData.id,
  product_id: item.id,
  quantity: item.quantity,
  unit_price: item.price,  // ❌ Dari client!
}));
```

**Risiko:**
- 🔴 **Price manipulation:** Customer boleh ubah `item.price` dalam browser console
- 🔴 **Delivery fee manipulation:** Customer boleh set `deliveryFee = 0`
- 🔴 **Total manipulation:** Customer boleh set `totalPrice = 1`

**Contoh Serangan:**
```javascript
// Dalam browser console:
cart[0].price = 0.01;  // Ubah RM10 jadi RM0.01
// Submit order → Dapat Nasi Lemak RM0.01!
```

**Mengikut Seksyen 29:**
> Jangan percaya price, quantity, discount, delivery fee, total yang datang daripada browser. Server/database mesti kira semula.

**Tahap Risiko:** 🔴 **KRITIKAL**

**Cadangan:**
1. 🔴 **WAJIB: Buat RPC function `create_order_validated()`**
   - Terima hanya `product_ids[]` dan `quantities[]` dari client
   - Server query current price dari database
   - Server calculate subtotal, delivery fee, total
   - Server validate semua calculation
   - Server create order dengan validated data
2. 🔴 **WAJIB: Jangan terima price dari client** — query dari database
3. 🔴 **WAJIB: Validate delivery fee** — kira semula di server

### D.4 Delivery Fee Calculation (Seksyen 24)

**Implementasi Sedia Ada:** ⚠️ **SEPARUH BETUL**

**Lokasi:** `lib/utils.ts`

```typescript
export function calculateDeliveryFee(googleMapsUrl: string, storeCoords = DEFAULT_STORE_COORDS): { distance: number; fee: number } {
  const customerCoords = extractCoordinatesFromUrl(googleMapsUrl);
  
  let distance = 5; // ❌ Default 5km jika tak boleh parse
  
  if (customerCoords) {
    distance = calculateDistance(
      storeCoords.lat,
      storeCoords.lng,
      customerCoords.lat,
      customerCoords.lng
    );
  }
  
  // Pricing logic:
  let fee = 0;
  if (distance < 1) {
    fee = 1;  // ✅ Minimum RM1
  } else {
    fee = Math.floor(distance);  // ✅ Floor (6.9km = RM6)
  }
  
  return { distance, fee };
}
```

**Masalah:**
1. ⚠️ **Store coordinates hard-coded** — `DEFAULT_STORE_COORDS` (Seksyen 23: mesti dalam database)
2. ⚠️ **Client-side calculation** — dipanggil dalam browser (Seksyen 24: mesti di server)
3. ⚠️ **Default 5km jika gagal parse** — tidak selamat, patut reject order
4. ⚠️ **Tiada maximum distance cap** — customer boleh order dari 100km jauh?

**Lokasi:** `app/order/[sellerId]/page.tsx`

```typescript
// Client-side delivery fee calculation
useEffect(() => {
  if (deliveryMode === 'Delivery' && customerPinLocation) {
    const { distance, fee } = calculateDeliveryFee(customerPinLocation);
    setCalculatedDistance(distance);
    setDeliveryFee(fee);  // ❌ Client set delivery fee
  } else {
    setDeliveryFee(0);
  }
}, [deliveryMode, customerPinLocation]);
```

**Risiko:**
- 🟡 **Client manipulation:** Customer boleh ubah `deliveryFee` sebelum submit
- 🟡 **Inconsistent calculation:** Jika store location berubah, old orders calculation rosak
- 🟡 **No validation:** Tiada server-side validation untuk delivery fee

**Mengikut Seksyen 24:**
> Rounding mesti dilakukan **di server/database**, bukan di frontend, supaya nilai konsisten dan tidak boleh dimanipulasi oleh browser.

**Tahap Risiko:** 🟡 **SEDERHANA** (sudah ada formula betul, cuma perlu move ke server)

**Cadangan:**
1. 🔴 **WAJIB: Pindah calculation ke server** — buat RPC function `calculate_delivery_fee(customer_lat, customer_lng)`
2. 🔴 **WAJIB: Store location dalam database** — table `store_settings`
3. 🟡 **Tambah maximum distance cap** — contoh: reject jika > 50km
4. 🟡 **Tambah minimum fee configuration** — dalam database, bukan hard-code
5. 🟡 **Reject order jika coordinates gagal parse** — jangan guna default 5km

### D.5 Order ID Generation (Seksyen 108)

**Implementasi Sedia Ada:** ✅ **OK (UUID)**

**Lokasi:** Database schema

```sql
CREATE TABLE orders (
  id uuid default uuid_generate_v4() primary key,
  -- ...
);
```

**Analisis:**
- ✅ Guna UUID v4 — collision-safe
- ✅ Generated di database — atomic
- ⚠️ Format `SS-XXXX` tidak diimplement — hanya UUID

**Mengikut Seksyen 108:**
> Order ID (`SS-XXXX`) mesti dijana secara **atomic dan collision-safe** di bawah concurrent request.

**Tahap Risiko:** 🟢 **SELAMAT** (UUID sudah collision-safe)

**Cadangan:**
1. 🟡 **Pertimbangkan format `SS-XXXX`** — jika diperlukan untuk business (lebih user-friendly)
2. 🟡 **Jika guna `SS-XXXX`** — buat sequence atau RPC function untuk generate

### D.6 WhatsApp Integration

**Implementasi Sedia Ada:** ✅ **BAIK**

**Lokasi:** `lib/utils.ts`

```typescript
export function generateWhatsAppLink(orderDetails: {...}): string {
  const adminNumber = '601110890100';
  let message = `🍽️ *PESANAN BARU - SAJIAN SEMATANG*\n\n`;
  // ... build message
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${adminNumber}?text=${encodedMessage}`;
}
```

**Analisis:**
- ✅ Message formatting baik
- ✅ URL encoding betul (`encodeURIComponent`)
- ✅ Admin number configured
- ✅ Separate function untuk payout WhatsApp

**Mengikut Seksyen 31:**
> Mesej WhatsApp mesti di-URL-encode dengan betul (`encodeURIComponent`) sebelum dimasukkan ke dalam `wa.me` link.

**Tahap Risiko:** 🟢 **SELAMAT**

**Cadangan:**
1. 🟢 **Kekalkan implementation sedia ada** — sudah baik
2. 🟡 **Pertimbangkan move admin number ke database** — untuk flexibility

### D.7 Timezone Handling (Seksyen 107)

**Implementasi Sedia Ada:** ⚠️ **TIDAK LENGKAP**

**Lokasi:** Database schema

```sql
created_at timestamp with time zone default timezone('utc'::text, now())
```

**Masalah:**
1. ⚠️ **Semua timestamp dalam UTC** — betul untuk storage
2. ❌ **Tiada conversion ke Asia/Kuala_Lumpur** — untuk reporting
3. ❌ **"Today" reports akan salah** — jika guna UTC untuk filter

**Contoh Masalah:**
```sql
-- Query "orders hari ini" (salah)
SELECT * FROM orders 
WHERE created_at::date = CURRENT_DATE;  -- ❌ Guna UTC date

-- Jam 11pm Malaysia (UTC+8) = 3pm UTC
-- Order akan tersalah kira sebagai "esok" dalam UTC
```

**Mengikut Seksyen 107:**
> Semua timestamp operasi (order created_at, status change, reporting "hari ini") mesti dikira berdasarkan timezone **Asia/Kuala_Lumpur (UTC+8)**.

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🔴 **WAJIB: Buat helper function untuk timezone conversion**
   ```sql
   CREATE FUNCTION to_malaysia_time(ts timestamptz) 
   RETURNS timestamp AS $$
     SELECT ts AT TIME ZONE 'Asia/Kuala_Lumpur';
   $$ LANGUAGE SQL IMMUTABLE;
   ```
2. 🔴 **WAJIB: Update reporting queries** — guna Malaysia timezone untuk date filtering
3. 🟡 **Update display formatting** — guna `toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur' })`

**Tahap Risiko Business Logic:** 🔴 **PERLU DIBINA SEMULA**

**Ringkasan Cadangan:**
1. 🔴 **KRITIKAL: Stock concurrency** — buat RPC function dengan transaction
2. 🔴 **KRITIKAL: Order snapshot** — tambah snapshot columns
3. 🔴 **KRITIKAL: Price security** — validate di server, jangan percaya client
4. 🟡 **PENTING: Delivery fee** — pindah calculation ke server
5. 🟡 **PENTING: Timezone** — handle Asia/Kuala_Lumpur untuk reporting

---

## 🔑 E. AUTHENTICATION & SESSION

### Status: 🟢 SELAMAT DIGUNAKAN SEMULA (dengan minor fixes)

### E.1 Authentication Implementation

**Lokasi:** `lib/auth/hooks.ts`, `lib/auth/permissions.ts`

**Analisis:**
- ✅ Guna Supabase Auth + Google OAuth — betul mengikut Seksyen 9
- ✅ Tiada custom password system — betul
- ✅ Tiada manual token storage — betul
- ✅ Session management via Supabase — betul

**Lokasi:** `app/auth/login/page.tsx`

```typescript
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  // ...
}
```

**Analisis:**
- ✅ OAuth flow betul
- ✅ Callback URL configured
- ✅ `access_type: 'offline'` untuk refresh token

### E.2 Session Management

**Lokasi:** `lib/auth/hooks.ts`

```typescript
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // ...
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // ...
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  // ...
}
```

**Analisis:**
- ✅ Session persistence via Supabase — betul
- ✅ Auth state listener — betul
- ✅ Cleanup subscription — betul
- ⚠️ **Tiada explicit session expiry handling** — bergantung Supabase default

**Mengikut Seksyen 10:**
> User hanya perlu login untuk tempoh sekitar 7 hari. Jika user tidak kembali selepas tempoh tersebut → minta login Google semula.

**Masalah:**
- ⚠️ **Tiada explicit 7-day expiry** — Supabase default adalah 1 jam (access token) + 7 hari (refresh token)
- ⚠️ **Tiada explicit refresh logic** — bergantung Supabase auto-refresh

**Tahap Risiko:** 🟢 **SELAMAT** (Supabase handle automatically)

**Cadangan:**
1. 🟢 **Kekalkan implementation sedia ada** — Supabase default sudah sesuai
2. 🟡 **Dokumentasikan session behavior** — untuk clarity

### E.3 Role-Based Access Control (RBAC)

**Lokasi:** `lib/auth/permissions.ts`

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_all_orders', 'create_order', 'update_order', 'delete_order',
    'view_all_products', 'create_product', 'update_product', 'delete_product',
    'view_all_users', 'create_user', 'update_user', 'delete_user',
    'view_financial', 'create_payout',
    'view_audit_logs',
    'view_all_sellers', 'manage_sellers',
  ],
  staff: [
    'view_all_orders', 'create_order', 'update_order',
    'view_all_products', 'create_product', 'update_product',
    'view_all_sellers',
  ],
  seller: [
    'view_own_orders', 'update_order',
    'view_own_products', 'create_product', 'update_product', 'delete_product',
    'view_own_user', 'update_user',
    'view_financial',
  ],
  customer: [
    'create_order',
    'view_all_products',
    'view_own_user', 'update_user',
  ],
};
```

**Analisis:**
- ✅ 4 roles defined: admin, staff, seller, customer — betul mengikut Seksyen 8
- ✅ Permission matrix comprehensive — baik
- ✅ Helper functions: `hasPermission()`, `canAccessRoute()` — baik
- ✅ Route protection logic — baik

**Masalah:**
- ⚠️ **Permission enforcement hanya di client-side** — tiada server-side enforcement
- ⚠️ **RLS policies tidak sync dengan permission matrix** — boleh bercanggah

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🔴 **WAJIB: Enforce permissions di server-side** — jangan bergantung client sahaja
2. 🟡 **Sync RLS policies dengan permission matrix** — ensure consistency
3. 🟡 **Tambah permission audit** — log permission checks

### E.4 Profile Management

**Lokasi:** `app/auth/profile/page.tsx`, `lib/auth/hooks.ts`

**Analisis:**
- ✅ Profile completion flow — betul
- ✅ Profile update function — betul
- ✅ Validation logic — betul

**Masalah:**
- ⚠️ **Profile data dalam localStorage** — `lib/utils.ts` `saveCustomerProfile()`

**Lokasi:** `lib/utils.ts`

```typescript
export function saveCustomerProfile(profile: CustomerProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
  }
}
```

**Mengikut Seksyen 12:**
> Supabase database ialah source of truth. Browser storage hanya boleh digunakan untuk cart sementara, UI preference, cache tidak sensitif, temporary state.

**Masalah:**
- ⚠️ **Profile disimpan dalam localStorage** — tidak sync dengan database
- ⚠️ **Customer update address di Phone A, login di Phone B** → Phone B dapat data lama

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🔴 **WAJIB: Guna database sebagai source of truth** — query dari `users` table
2. 🟡 **localStorage hanya untuk cache** — dengan expiry time
3. 🟡 **Sync profile on login** — fetch latest dari database

### E.5 Logout

**Lokasi:** `lib/auth/hooks.ts`

```typescript
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  // Redirect to home
  window.location.href = '/';
}
```

**Analisis:**
- ✅ Supabase session logout — betul
- ⚠️ **Tiada explicit localStorage clear** — profile data masih tinggal

**Mengikut Seksyen 13:**
> Apabila user logout: Supabase session logout, clear temporary local state, clear sensitive cached profile data jika ada, redirect kepada login.

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🟡 **Tambah localStorage.clear()** — atau clear specific keys
2. 🟡 **Clear sessionStorage** — untuk cart data

**Tahap Risiko Authentication:** 🟢 **SELAMAT DIGUNAKAN SEMULA**

**Ringkasan Cadangan:**
1. 🔴 **PENTING: Profile source of truth** — guna database, bukan localStorage
2. 🟡 **Tambah server-side permission enforcement**
3. 🟡 **Clear storage on logout**

---

## 💻 F. KUALITI KOD AM

### Status: 🟡 BOLEH DIBAIKI

### F.1 Client vs Server Components

**Analisis:**
- ⚠️ **Terlalu banyak Client Components** — hampir semua page guna `'use client'`
- ⚠️ **Business logic dalam Client Components** — price calculation, delivery fee, cart

**Contoh:**
```typescript
// app/page.tsx
'use client';  // ❌ Homepage tidak perlu client component

// app/order/[sellerId]/page.tsx
'use client';  // ⚠️ Boleh split: Server Component + Client Component untuk form
```

**Mengikut Seksyen 75:**
> Server Components secara default. Client Components hanya apabila perlu (cart, quantity selector, interactive category, map picker, like button, modal, dynamic dashboard controls).

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🟡 **Refactor homepage** — guna Server Component untuk fetch products
2. 🟡 **Split order page** — Server Component untuk validation + Client Component untuk form
3. 🟡 **Move business logic ke server** — price calculation, delivery fee

### F.2 Validation

**Implementasi Sedia Ada:** ⚠️ **TIDAK LENGKAP**

**Lokasi:** `app/order/[sellerId]/page.tsx`

```typescript
// Client-side validation sahaja
if (!customerName.trim() || !customerPhone.trim()) {
  throw new Error('Sila isi nama dan nombor telefon');
}

if (deliveryMode === 'Delivery' && !customerAddress.trim()) {
  throw new Error('Sila isi alamat untuk penghantaran');
}
```

**Masalah:**
- ⚠️ **Hanya client-side validation** — tiada server-side validation
- ⚠️ **Tiada schema validation** — tiada Zod atau library lain
- ⚠️ **Tiada phone number format validation**
- ⚠️ **Tiada email validation**

**Mengikut Seksyen 77:**
> Cadangan: guna **Zod** (ringan, TypeScript-first, sesuai untuk validate form + server action input dengan schema yang sama).

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🔴 **WAJIB: Tambah Zod** — untuk schema validation
2. 🔴 **WAJIB: Server-side validation** — dalam RPC functions
3. 🟡 **Share validation schema** — antara client dan server

### F.3 Error Handling

**Implementasi Sedia Ada:** ⚠️ **TIDAK KONSISTEN**

**Contoh Baik:**
```typescript
// app/order/[sellerId]/page.tsx
try {
  // ... order submission
} catch (err: any) {
  console.error('Error submitting order:', err);
  setError(err.message || 'Ralat semasa menghantar pesanan. Sila cuba lagi.');
}
```

**Contoh Kurang Baik:**
```typescript
// app/page.tsx
async function fetchProducts() {
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error) throw error;
    // ...
  } catch (err) {
    console.error('Ralat memuatkan produk:', err);
    // ❌ Tiada user feedback
  } finally {
    setLoading(false);
  }
}
```

**Mengikut Seksyen 78:**
> Customer tidak boleh melihat error teknikal. Developer/server logs boleh mempunyai maklumat teknikal.

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🟡 **Standardize error messages** — user-friendly untuk customer
2. 🟡 **Tambah error logging service** — Sentry atau similar (Seksyen 111)
3. 🟡 **Error boundaries** — untuk catch React errors

### F.4 TypeScript Configuration

**Lokasi:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ❌ BERBAHAYA!
  },
};
```

**Masalah:**
- 🔴 **`ignoreBuildErrors: true`** — ini sangat berbahaya untuk production
- 🔴 **TypeScript errors diabaikan** — boleh menyebabkan runtime errors

**Tahap Risiko:** 🔴 **KRITIKAL**

**Cadangan:**
1. 🔴 **WAJIB: Set `ignoreBuildErrors: false`**
2. 🔴 **WAJIB: Fix semua TypeScript errors**
3. 🔴 **WAJIB: Enable strict mode** — dalam `tsconfig.json`

### F.5 Environment Variables

**Lokasi:** `.env.local` (wujud tetapi tidak dibaca)

**Analisis:**
- ✅ `.env.local` dalam `.gitignore` — betul
- ✅ `.env*` dalam `.gitignore` — betul
- ⚠️ **Tiada `.env.example`** — untuk documentation

**Lokasi:** `lib/supabase/client.ts`

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
```

**Analisis:**
- ✅ Guna environment variables — betul
- ✅ Fallback values — betul untuk development
- ⚠️ **Placeholder values** — perlu update untuk production

**Mengikut Seksyen 70:**
> Gunakan environment variables. Asingkan Development/Preview/Production. Jangan commit `.env.local`. Sediakan `.env.example` tanpa secret sebenar.

**Tahap Risiko:** 🟢 **SELAMAT**

**Cadangan:**
1. 🟡 **Buat `.env.example`** — untuk documentation
2. 🟡 **Dokumentasikan required env vars** — dalam README

### F.6 Code Duplication

**Masalah:**
- ⚠️ **Duplicate structure:** `app/` dan `src/app/`
- ⚠️ **Duplicate Supabase client:** dalam `next.config.ts` (salah tempat)

**Lokasi:** `next.config.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);  // ❌ Salah tempat!

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🟡 **Cleanup duplicate `src/app/`** — padam atau merge
2. 🔴 **Buang Supabase client dari `next.config.ts`** — guna `lib/supabase/client.ts` sahaja

### F.7 Performance

**Analisis:**
- ⚠️ **Tiada image optimization** — product images tidak guna Next.js Image
- ⚠️ **Tiada code splitting** — semua dalam Client Components
- ⚠️ **Tiada caching strategy** — setiap page load fetch dari database

**Mengikut Seksyen 79, 80:**
> Manfaatkan server rendering, code splitting, optimized images, efficient data fetching.

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🟡 **Guna Next.js Image component** — untuk product images
2. 🟡 **Implement caching** — untuk product list, seller list
3. 🟡 **Code splitting** — split large Client Components

### F.8 Accessibility

**Analisis:**
- ⚠️ **Semantic HTML OK** — guna proper tags
- ⚠️ **Labels OK** — form inputs ada labels
- ⚠️ **Contrast OK** — color scheme readable
- ⚠️ **Keyboard support** — tidak diuji
- ⚠️ **Screen reader support** — tidak diuji

**Tahap Risiko:** 🟡 **SEDERHANA**

**Cadangan:**
1. 🟡 **Test keyboard navigation**
2. 🟡 **Test screen reader**
3. 🟡 **Add ARIA labels** — untuk interactive elements

**Tahap Risiko Kualiti Kod:** 🟡 **BOLEH DIBAIKI**

**Ringkasan Cadangan:**
1. 🔴 **KRITIKAL: Fix TypeScript config** — disable `ignoreBuildErrors`
2. 🔴 **KRITIKAL: Cleanup `next.config.ts`** — buang Supabase client
3. 🔴 **PENTING: Tambah Zod validation**
4. 🟡 **Refactor Client Components** — guna Server Components where possible
5. 🟡 **Cleanup duplicate structure**

---

## 📊 G. RUMUSAN KESELURUHAN

### G.1 Boleh Dikekalkan Sepenuhnya 🟢

1. ✅ **Stack teknologi** — Next.js, TypeScript, Supabase, Tailwind (100% betul)
2. ✅ **Folder structure** — mengikut Next.js best practices
3. ✅ **Authentication system** — Supabase Auth + Google OAuth
4. ✅ **Permission matrix** — RBAC implementation baik
5. ✅ **Financial utilities** — payout calculation functions baik
6. ✅ **WhatsApp integration** — message generation baik
7. ✅ **Delivery fee formula** — Haversine calculation betul
8. ✅ **Documentation** — 10+ fail markdown lengkap

### G.2 Boleh Dikekalkan dengan Pembaikan (Patch) 🟡

1. ⚠️ **Database migration** — perlu verify sama ada sudah run atau belum
2. ⚠️ **Order snapshot** — perlu tambah columns (major patch)
3. ⚠️ **Timezone handling** — perlu tambah conversion functions
4. ⚠️ **Profile management** — perlu ubah dari localStorage ke database
5. ⚠️ **Client Components** — perlu refactor ke Server Components
6. ⚠️ **Validation** — perlu tambah Zod + server-side validation
7. ⚠️ **Error handling** — perlu standardize
8. ⚠️ **Code duplication** — perlu cleanup

### G.3 Perlu Dibina Semula 🔴

1. 🔴 **RLS Policies** — kebocoran kritikal, perlu rebuild semua policies
2. 🔴 **Stock concurrency** — perlu buat RPC function dengan transaction
3. 🔴 **Price security** — perlu validate di server, jangan percaya client
4. 🔴 **Order creation flow** — perlu rebuild dengan proper validation
5. 🔴 **TypeScript config** — perlu fix `ignoreBuildErrors`
6. 🔴 **`next.config.ts`** — perlu cleanup kod salah

### G.4 Tahap Risiko Mengikut Kategori

| Kategori | Tahap Risiko | Impak | Usaha Pembaikan |
|----------|--------------|-------|-----------------|
| **Stack Teknologi** | 🟢 Selamat | Rendah | Tiada |
| **Database Schema** | 🟡 Sederhana | Tinggi | 2-3 hari |
| **RLS Policies** | 🔴 Kritikal | Sangat Tinggi | 3-4 hari |
| **Stock Concurrency** | 🔴 Kritikal | Sangat Tinggi | 2-3 hari |
| **Order Snapshot** | 🔴 Kritikal | Tinggi | 2-3 hari |
| **Price Security** | 🔴 Kritikal | Sangat Tinggi | 2-3 hari |
| **Authentication** | 🟢 Selamat | Rendah | 0.5 hari |
| **Delivery Fee** | 🟡 Sederhana | Sederhana | 1 hari |
| **Timezone** | 🟡 Sederhana | Sederhana | 1 hari |
| **Kualiti Kod** | 🟡 Sederhana | Sederhana | 2-3 hari |

**Total Anggaran Usaha Pembaikan:** 16-23 hari kerja

### G.5 Perbandingan: Patch vs Rebuild

#### Pilihan A: PATCH BERPERINGKAT (DISYORKAN)

**Kelebihan:**
- ✅ Jimat masa — 16-23 hari vs 40-50 hari (rebuild penuh)
- ✅ Jimat kos — ~RM5,000-7,000 vs RM12,000-15,000
- ✅ Kekalkan kod baik — authentication, financial utilities, WhatsApp
- ✅ Kekalkan dokumentasi — 10+ fail markdown
- ✅ Progressive improvement — boleh deploy berperingkat

**Kekurangan:**
- ⚠️ Perlu berhati-hati — jangan rosakkan kod baik
- ⚠️ Perlu testing menyeluruh — setiap patch
- ⚠️ Technical debt — beberapa design decisions tidak optimum

**Urutan Patch (Mengikut Keutamaan):**

**PHASE 1: SECURITY CRITICAL (5-6 hari)**
1. 🔴 Fix RLS policies — protect cost_price, ketatkan orders/order_items
2. 🔴 Buat stock deduction RPC — atomic transaction
3. 🔴 Buat order validation RPC — server-side price validation
4. 🔴 Fix TypeScript config — disable `ignoreBuildErrors`
5. 🔴 Cleanup `next.config.ts` — buang kod salah

**PHASE 2: DATA INTEGRITY (4-5 hari)**
6. 🔴 Tambah order snapshot columns — product_name_snapshot, price_snapshot, dll
7. 🔴 Update order creation logic — populate snapshots
8. 🟡 Tambah missing tables — product_options, stock_movements, categories
9. 🟡 Verify database migration — ensure migration sudah run

**PHASE 3: BUSINESS LOGIC (3-4 hari)**
10. 🟡 Pindah delivery fee calculation ke server — RPC function
11. 🟡 Tambah timezone handling — Asia/Kuala_Lumpur
12. 🟡 Profile source of truth — guna database, bukan localStorage
13. 🟡 Tambah Zod validation — client + server

**PHASE 4: CODE QUALITY (2-3 hari)**
14. 🟡 Refactor Client Components — ke Server Components
15. 🟡 Cleanup duplicate structure — `src/app/`
16. 🟡 Standardize error handling
17. 🟡 Add error logging — Sentry atau similar

**PHASE 5: TESTING & DEPLOYMENT (2-3 hari)**
18. 🔴 RLS testing — automated test suite
19. 🟡 Integration testing — order flow, payment flow
20. 🟡 Performance testing
21. 🟡 Production deployment

#### Pilihan B: REBUILD PENUH (TIDAK DISYORKAN)

**Kelebihan:**
- ✅ Clean slate — tiada technical debt
- ✅ Optimum architecture — design dari awal dengan master prompt
- ✅ Consistent patterns — semua kod ikut standard yang sama

**Kekurangan:**
- ❌ Masa lebih lama — 40-50 hari
- ❌ Kos lebih tinggi — RM12,000-15,000
- ❌ Buang kod baik — authentication, financial utilities perlu rebuild
- ❌ Buang dokumentasi — perlu tulis semula
- ❌ Higher risk — banyak perkara boleh salah

**Justifikasi Kenapa TIDAK Rebuild:**
1. ❌ **Foundation tidak rosak sepenuhnya** — stack betul, structure OK
2. ❌ **Banyak kod baik** — authentication (100% OK), financial utilities (90% OK), WhatsApp (100% OK)
3. ❌ **Dokumentasi lengkap** — 10+ fail markdown, setup guides
4. ❌ **Isu boleh dipatch** — tiada fundamental design flaw yang memerlukan rebuild
5. ❌ **ROI tidak berbaloi** — 2-3x kos untuk improvement marginal

### G.6 Cadangan Pendekatan Keseluruhan

**KEPUTUSAN: PATCH BERPERINGKAT MENGIKUT 5 PHASE**

**Sebab:**
1. ✅ **Jimat masa dan kos** — 16-23 hari vs 40-50 hari
2. ✅ **Kekalkan kod baik** — authentication, financial, WhatsApp
3. ✅ **Progressive deployment** — boleh deploy selepas setiap phase
4. ✅ **Lower risk** — patch satu-satu, test, deploy
5. ✅ **Practical** — business boleh mula guna sistem lebih awal

**Prinsip Patch:**
1. 🔴 **Utamakan security** — RLS, stock, price validation (Phase 1)
2. 🔴 **Kemudian data integrity** — snapshots, missing tables (Phase 2)
3. 🟡 **Kemudian business logic** — delivery fee, timezone (Phase 3)
4. 🟡 **Kemudian code quality** — refactor, cleanup (Phase 4)
5. 🟡 **Akhir sekali testing** — automated tests, deployment (Phase 5)

**Jangan:**
- ❌ Rebuild dari kosong — buang masa dan wang
- ❌ Patch semua sekaligus — terlalu berisiko
- ❌ Deploy tanpa testing — RLS mesti diuji
- ❌ Abaikan documentation — update setiap patch

---

## 📋 H. CHECKLIST UNTUK PHASE 0

Sebelum mula Phase 0 (Discovery & Architecture), pastikan:

### H.1 Verify Database State

- [ ] Semak sama ada `migration_business_structure.sql` sudah run atau belum
- [ ] Jika belum run, backup data sedia ada
- [ ] Run migration dalam staging environment dahulu
- [ ] Verify semua tables wujud dengan columns betul
- [ ] Verify RLS enabled pada semua tables

### H.2 Verify Environment

- [ ] `.env.local` configured dengan Supabase credentials betul
- [ ] Google OAuth configured dalam Supabase
- [ ] Vercel project setup (jika deploy)
- [ ] Git repository clean (tiada uncommitted changes)

### H.3 Backup

- [ ] Backup database sedia ada (export dari Supabase)
- [ ] Backup codebase (Git commit + tag)
- [ ] Backup environment variables
- [ ] Dokumentasikan current state

### H.4 Team Alignment

- [ ] Review audit report dengan team
- [ ] Agree pada patch approach (bukan rebuild)
- [ ] Agree pada 5-phase roadmap
- [ ] Assign responsibilities untuk setiap phase
- [ ] Set timeline untuk setiap phase

---

## 🎯 I. KESIMPULAN

### Status Projek: 🟡 **BOLEH DISELAMATKAN DENGAN PATCH BERPERINGKAT**

**Projek Sajian Sematang mempunyai foundation yang baik** tetapi mengandungi **beberapa risiko kritikal** yang mesti diperbaiki sebelum production. Sistem **TIDAK PERLU rebuild dari kosong** — patch berperingkat adalah pendekatan yang paling praktikal dan cost-effective.

### Keutamaan Tertinggi (WAJIB sebelum production):

1. 🔴 **RLS Policies** — kebocoran cost_price, orders, order_items
2. 🔴 **Stock Concurrency** — race condition, overselling
3. 🔴 **Price Security** — client manipulation
4. 🔴 **Order Snapshot** — data integrity untuk historical orders
5. 🔴 **TypeScript Config** — `ignoreBuildErrors: true` berbahaya

### Anggaran Usaha:

- **Phase 1 (Security Critical):** 5-6 hari — **WAJIB**
- **Phase 2 (Data Integrity):** 4-5 hari — **WAJIB**
- **Phase 3 (Business Logic):** 3-4 hari — **PENTING**
- **Phase 4 (Code Quality):** 2-3 hari — **BAIK ADA**
- **Phase 5 (Testing & Deployment):** 2-3 hari — **WAJIB**

**Total:** 16-23 hari kerja

### Anggaran Kos:

- **Patch Approach:** RM5,000 - RM7,000
- **Rebuild Approach:** RM12,000 - RM15,000

**Savings:** RM5,000 - RM8,000 (40-50% jimat)

### Recommendation:

**PROCEED WITH PATCH BERPERINGKAT** — Mulakan dengan Phase 1 (Security Critical), kemudian Phase 2 (Data Integrity). Selepas Phase 2 selesai, sistem sudah boleh digunakan untuk soft launch dengan monitoring ketat. Phase 3-5 boleh dilakukan secara berperingkat sambil sistem running.

---

**Laporan ini disediakan mengikut Seksyen 108A — PHASE -1 AUDIT PROJEK SEDIA ADA**

**Tarikh:** 26 Ogos 2026  
**Auditor:** Roo Code  
**Status:** SELESAI — Menunggu keputusan untuk proceed ke Phase 0

---

*END OF AUDIT REPORT*
