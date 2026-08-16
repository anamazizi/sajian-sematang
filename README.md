# 🍽️ Sajian Sematang - Platform Tempahan Makanan

Platform tempahan makanan yang membolehkan pelanggan melihat menu dari peniaga dan membuat tempahan dengan mudah.

## 📋 Fasa 1 - Fungsi Asas

### Pelanggan (Customer)
- ✅ Antaramuka mesra peranti mudah alih (mobile-first)
- ✅ Katalog menu mengikut peniaga
- ✅ Borang tempahan asas
- ✅ Real-time product availability
- ✅ Visual indicators (Pre-order, Limited Stock, Time-limited offers)

### Peniaga (Seller)
- ✅ Dashboard untuk melihat pesanan masuk
- ✅ Menukar status pesanan (Baru → Sedang Disediakan → Siap)
- ✅ Automated menu scheduling
- ✅ Pre-order mode support
- ✅ Auto show/hide based on stock

## 🛠️ Teknologi

- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Backend/Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth

## 📁 Struktur Projek

```
sajian-sematang/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Halaman utama
├── components/            # React components
│   └── ui/               # UI components
│       └── ProductCard.tsx
├── lib/                   # Utilities & configurations
│   └── supabase/
│       └── client.ts     # Supabase client
├── types/                 # TypeScript type definitions
│   └── database.ts       # Database types
├── supabase/             # Supabase configuration
│   └── schema.sql        # Database schema
└── .env.local            # Environment variables
```

## 🚀 Setup & Installation

### 1. Clone atau Download Projek

```bash
cd sajian-sematang
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Pergi ke [supabase.com](https://supabase.com) dan buat projek baru
2. Dalam Supabase Dashboard, pergi ke **SQL Editor**
3. Copy dan paste kandungan dari `supabase/schema.sql`
4. Run script tersebut untuk create tables dan setup RLS

### 4. Configure Environment Variables

Edit fail `.env.local` dan masukkan credentials Supabase anda:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Cara dapatkan credentials:**
- Pergi ke Supabase Dashboard → Settings → API
- Copy **Project URL** dan **anon/public key**

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dalam browser.

## 📊 Database Schema

### Tables

1. **users** - User profiles (linked to Supabase Auth)
2. **sellers** - Seller/shop information
3. **products** - Product catalog with advanced features:
   - `stock_quantity` - Stock management
   - `is_preorder` - Pre-order mode flag
   - `available_from` / `available_until` - Automated scheduling
4. **orders** - Customer orders
5. **order_items** - Order line items

Lihat [`supabase/schema.sql`](supabase/schema.sql) untuk details lengkap.

## 🌟 Advanced Features

### 📅 Automated Menu Scheduling
Produk boleh dikonfigurasi untuk muncul automatik dalam time range tertentu (contoh: breakfast menu 6am-11am).

### 🛒 Pre-Order Mode
Support untuk pre-order items dengan unlimited quantity sepanjang tempoh aktif.

### 📦 Auto Show/Hide Stock Control
Produk automatically hide bila stock habis dan show semula bila restock.

**Lihat [`FEATURES.md`](FEATURES.md) untuk dokumentasi lengkap dan contoh penggunaan.**

## 🔐 Row Level Security (RLS)

RLS policies telah dikonfigurasi untuk:
- Users hanya boleh view/update profile sendiri
- Semua orang boleh view products yang available
- Sellers boleh manage products dan orders mereka sendiri
- Customers boleh create orders

## 📝 Next Steps (Fasa 1)

- [ ] Implement authentication pages (login/register)
- [ ] Build seller listing page
- [ ] Build product catalog by seller
- [ ] Create order form
- [ ] Build seller dashboard
- [ ] Add order status management

## 🤝 Contributing

Projek ini adalah untuk pembelajaran dan development. Sila buat branch baru untuk setiap feature.

## 📄 License

MIT License - Gunakan sesuka hati untuk pembelajaran dan projek peribadi.

---

**Dicipta dengan ❤️ untuk Sajian Sematang**
