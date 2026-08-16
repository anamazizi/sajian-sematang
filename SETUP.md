# 🚀 Panduan Setup Sajian Sematang

Panduan lengkap untuk setup dan menjalankan aplikasi Sajian Sematang.

## 📋 Prasyarat

Pastikan anda telah install:
- Node.js (versi 18 atau lebih tinggi)
- npm atau yarn
- Akaun Supabase (percuma di [supabase.com](https://supabase.com))

## 🔧 Langkah-langkah Setup

### 1. Setup Projek Next.js

Projek ini sudah dikonfigurasi dengan Next.js 14 App Router. Pastikan semua dependencies telah diinstall:

```bash
cd sajian-sematang
npm install
```

### 2. Setup Supabase Project

#### 2.1 Buat Projek Baru di Supabase

1. Pergi ke [supabase.com](https://supabase.com)
2. Sign in atau buat akaun baru
3. Klik "New Project"
4. Isi maklumat projek:
   - **Name**: Sajian Sematang
   - **Database Password**: Simpan password ini dengan selamat
   - **Region**: Pilih region terdekat (contoh: Southeast Asia)
5. Klik "Create new project" dan tunggu beberapa minit

#### 2.2 Dapatkan API Credentials

1. Dalam Supabase Dashboard, pergi ke **Settings** → **API**
2. Copy nilai berikut:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon/public key** (key yang panjang bermula dengan `eyJ...`)

#### 2.3 Configure Environment Variables

1. Buka fail `.env.local` dalam folder `sajian-sematang`
2. Replace placeholder values dengan credentials anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ PENTING**: Jangan commit fail `.env.local` ke Git!

### 3. Setup Database Schema

#### 3.1 Run SQL Script

1. Dalam Supabase Dashboard, pergi ke **SQL Editor**
2. Klik "New query"
3. Buka fail `supabase/schema.sql` dalam projek ini
4. Copy SEMUA kandungan fail tersebut
5. Paste ke SQL Editor di Supabase
6. Klik "Run" atau tekan `Ctrl+Enter`

Script ini akan:
- Create semua tables (users, sellers, products, orders, order_items)
- Setup Row Level Security (RLS) policies
- Create indexes untuk performance
- Setup trigger untuk auto-create user profile

#### 3.2 Verify Tables Created

1. Pergi ke **Table Editor** dalam Supabase Dashboard
2. Anda sepatutnya nampak tables berikut:
   - users
   - sellers
   - products
   - orders
   - order_items

### 4. (Optional) Insert Sample Data

Untuk testing, anda boleh insert sample data. Uncomment bahagian sample data dalam `supabase/schema.sql` (baris 111-130) dan run semula script tersebut.

Atau run SQL berikut secara manual dalam SQL Editor:

```sql
-- Sample seller
INSERT INTO public.sellers (id, shop_name, description) VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Kedai Makan Sedap', 'Menyediakan pelbagai jenis makanan tradisional');

-- Sample products
INSERT INTO public.products (seller_id, name, description, price, category, is_available) VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Nasi Lemak Special', 'Nasi lemak dengan ayam berempah, sambal dan telur', 8.50, 'Makanan', true),
  ('22222222-2222-2222-2222-222222222222', 'Mee Goreng', 'Mee goreng mamak dengan telur dan sayur', 7.00, 'Makanan', true),
  ('22222222-2222-2222-2222-222222222222', 'Teh Tarik', 'Teh tarik panas', 2.50, 'Minuman', true),
  ('22222222-2222-2222-2222-222222222222', 'Roti Canai', 'Roti canai dengan kuah dhal', 3.00, 'Makanan', true);
```

### 5. Run Development Server

```bash
npm run dev
```

Aplikasi akan running di [http://localhost:3000](http://localhost:3000)

## 🧪 Testing Aplikasi

### Test Customer Flow

1. Buka [http://localhost:3000](http://localhost:3000)
2. Klik "Lihat Menu" pada card Pelanggan
3. Pilih peniaga dari senarai
4. Browse products dan tambah ke cart
5. Klik "Teruskan Pesanan"
6. Isi borang dengan nama dan nombor telefon
7. Submit pesanan
8. Anda akan dibawa ke halaman success

### Test Seller Dashboard

1. Dari homepage, klik "Dashboard Peniaga" pada card Peniaga
2. Anda akan nampak semua pesanan yang masuk
3. Filter pesanan mengikut status
4. Klik button untuk tukar status pesanan:
   - New → Preparing
   - Preparing → Ready
   - Ready → Completed
5. Atau klik "Batal" untuk cancel pesanan

## 📱 Features Fasa 1

### ✅ Completed

- [x] Homepage dengan navigation
- [x] Senarai peniaga
- [x] Product catalog dengan cart functionality
- [x] Order form dengan validation
- [x] Order success page
- [x] Seller dashboard dengan real-time updates
- [x] Order status management
- [x] Database schema dengan RLS
- [x] Mobile-responsive design

### 🔄 Untuk Fasa 2 (Future)

- [ ] User authentication (login/register)
- [ ] User profiles
- [ ] Seller product management
- [ ] Order history untuk customers
- [ ] Real-time notifications
- [ ] Image upload untuk products
- [ ] Payment integration
- [ ] Order tracking

## 🐛 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js
```

### Error: Database connection failed

- Pastikan `.env.local` ada dan credentials betul
- Check Supabase project masih active
- Verify API keys tidak expired

### Error: "No rows returned" atau empty data

- Pastikan SQL schema sudah di-run
- Check RLS policies enable
- Insert sample data untuk testing

### Port 3000 already in use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or run on different port
npm run dev -- -p 3001
```

## 📚 Struktur Folder

```
sajian-sematang/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   ├── sellers/                 # Customer pages
│   │   ├── page.tsx            # Sellers list
│   │   └── [id]/page.tsx       # Product menu
│   ├── order/                   # Order pages
│   │   ├── [sellerId]/page.tsx # Order form
│   │   └── success/[orderId]/  # Success page
│   └── dashboard/               # Seller dashboard
│       └── page.tsx
├── components/                   # React components
│   └── ui/
│       └── ProductCard.tsx
├── lib/                         # Utilities
│   └── supabase/
│       └── client.ts           # Supabase client config
├── types/                       # TypeScript types
│   └── database.ts
├── supabase/                    # Supabase files
│   └── schema.sql              # Database schema
├── .env.local                   # Environment variables
├── package.json
└── README.md
```

## 🔐 Security Notes

- RLS (Row Level Security) sudah dikonfigurasi
- Anon key selamat untuk client-side usage
- Jangan expose service_role key
- Untuk production, implement proper authentication

## 📞 Support

Jika ada masalah atau soalan, rujuk:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Selamat mencuba! 🎉**
