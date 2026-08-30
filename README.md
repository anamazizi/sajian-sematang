# 🍽️ Sajian Sematang - Platform Tempahan Makanan

**Production-Ready Food Ordering Platform**

Platform tempahan makanan lengkap dengan sistem kewangan, audit trail, dan role-based access control. Dibangunkan mengikut Master Development Prompt untuk memastikan security, scalability, dan maintainability.

---

## ✨ Status Projek

**Version:** 2.0 (Production Ready)  
**Last Updated:** 30 Ogos 2026  
**Build Status:** ✅ Passing  
**Security:** ✅ Phase R5 Complete (RLS + Price Protection)  
**Data Integrity:** ✅ Phase R6 Complete (Snapshots + Timezone)

---

## 🎯 Features Lengkap

### 👤 Customer (Pelanggan)
- ✅ Google OAuth login (Supabase Auth)
- ✅ Profile management (database-driven)
- ✅ Product browsing dengan categories
- ✅ Product options (Hot/Iced, Add-ons, Sizes)
- ✅ Shopping cart dengan real-time pricing
- ✅ Delivery / Self-Pickup selection
- ✅ Automatic delivery fee calculation (Haversine formula)
- ✅ WhatsApp order integration
- ✅ Order history
- ✅ Mobile-first responsive design

### 🏪 Seller (Peniaga)
- ✅ Seller dashboard
- ✅ Product management (CRUD)
- ✅ Dual pricing (selling price + cost price)
- ✅ Stock management with audit trail
- ✅ Pre-order mode support
- ✅ Automated menu scheduling
- ✅ Product options management
- ✅ Order queue and status updates
- ✅ Sales and payout tracking
- ✅ DuitNow QR upload

### 👨‍💼 Admin
- ✅ Admin dashboard
- ✅ User and role management (4 roles)
- ✅ Order management (all sellers)
- ✅ Seller payout system
- ✅ Financial reporting
- ✅ Audit logs
- ✅ Stock oversight

### 👷 Staff
- ✅ Staff dashboard
- ✅ Order operations
- ✅ Stock assistance
- ✅ Customer-assisted orders
- ✅ Delivery coordination

---

## 🛠️ Tech Stack

**Framework & Language:**
- Next.js 16.3.1 (App Router)
- TypeScript 7.0.2
- React 19.2.8

**Styling:**
- Tailwind CSS 4.3.3

**Backend & Database:**
- Supabase (PostgreSQL + Auth + Storage + RLS)
- @supabase/supabase-js 2.112.3
- @supabase/ssr 0.12.4

**Deployment:**
- Vercel (GitHub integration)
- Automatic deployments

**Security:**
- Row Level Security (RLS)
- Server-side validation
- Google OAuth
- Session management (7-day)

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

### Core Tables

1. **users** - User profiles + roles (customer, seller, admin, staff)
2. **sellers** - Seller/shop information + DuitNow QR
3. **products** - Catalog dengan dual pricing + stock + options
4. **product_options** - Product variants (Hot/Iced, Add-ons)
5. **orders** - Orders dengan snapshot fields
6. **order_items** - Line items dengan price/options snapshot
7. **payouts** - Seller payment records
8. **stock_movements** - Stock audit trail
9. **audit_logs** - System audit log

### Key Features

- ✅ Order snapshots (historical data integrity)
- ✅ Stock movements tracking
- ✅ Dual pricing (selling + cost)
- ✅ Product options support
- ✅ Delivery fee snapshots
- ✅ Customer data snapshots

**Migration Guide:** [`supabase/00_DEPLOYMENT_MIGRATION_GUIDE.md`](supabase/00_DEPLOYMENT_MIGRATION_GUIDE.md)

## 🌟 Advanced Features

### 📅 Automated Menu Scheduling
Produk boleh dikonfigurasi untuk muncul automatik dalam time range tertentu (contoh: breakfast menu 6am-11am).

### 🛒 Pre-Order Mode
Support untuk pre-order items dengan unlimited quantity sepanjang tempoh aktif.

### 📦 Auto Show/Hide Stock Control
Produk automatically hide bila stock habis dan show semula bila restock.

**Lihat [`FEATURES.md`](FEATURES.md) untuk dokumentasi lengkap dan contoh penggunaan.**

## 🔐 Security & RLS

**Row Level Security (Phase R5):**
- ✅ Users: Own profile only
- ✅ Sellers: Own products + orders only
- ✅ Products: Public read, **cost_price HIDDEN** from customers
- ✅ Orders: Customer own, Seller own, Admin all
- ✅ Payouts: Admin only
- ✅ Audit logs: Admin only

**Server-Side Validation:**
- ✅ Price calculation via RPC (cannot manipulate)
- ✅ Stock concurrency with database locks
- ✅ Order validation before insertion

**Two-Layer Protection:**
1. RLS controls row access
2. Application enforces column selection (no `SELECT *` for customers)

## 🌍 Timezone & Locale

**Malaysia Timezone (Phase R6):**
- All date/time operations use Asia/Kuala_Lumpur (UTC+8)
- Utility functions: `getMalaysiaTime()`, `isTodayInMalaysia()`
- Reports calculated in Malaysia timezone
- No UTC confusion in "today's sales"

## 📦 Deployment

**Production Checklist:** [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)

**Quick Deploy:**
```bash
# 1. Setup environment variables in Vercel
# 2. Run database migrations (see guide)
# 3. Push to GitHub
git push origin main

# Vercel auto-deploys
```

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

## 📚 Documentation

- **Master Prompt:** `.clinerules` (complete development guide)
- **Phase R5:** `PHASE_R5_SECURITY_FIXES_SUMMARY.md` (cost_price protection)
- **Phase R6:** `PHASE_R6_DATA_LOGIC_FIXES_SUMMARY.md` (timezone + snapshots)
- **Migration Guide:** `supabase/00_DEPLOYMENT_MIGRATION_GUIDE.md`
- **Deployment Checklist:** `PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Testing Guide:** `QUICK_TEST_GUIDE.txt`

## 🏗️ Architecture Compliance

**Master Prompt Compliance:**
- ✅ Seksyen 12: Database source of truth (not localStorage)
- ✅ Seksyen 17: Product options support
- ✅ Seksyen 19: Stock concurrency (atomic RPC)
- ✅ Seksyen 28/64: Order & item snapshots
- ✅ Seksyen 29: Server-side price validation
- ✅ Seksyen 39: Stock movement audit trail
- ✅ Seksyen 66: RLS policies per role
- ✅ Seksyen 88: Data privacy (cost_price protected)
- ✅ Seksyen 107: Asia/Kuala_Lumpur timezone

## 🤝 Contributing

Development workflow:
1. Create feature branch
2. Make changes
3. Run `npm run build` (must pass)
4. Test functionality
5. Commit with clear message
6. Push for review

## 📄 License

MIT License - Gunakan sesuka hati untuk pembelajaran dan projek.

---

## 🎉 Achievements

**Phase R5 (Security):** ✅ Complete
- cost_price protection
- RLS policies tightened
- Server-side validation verified

**Phase R6 (Data Logic):** ✅ Complete
- Database-driven profiles
- Malaysia timezone support
- Order snapshots verified

**Phase R7 (Deployment):** ✅ Ready
- Migration guide complete
- Deployment checklist ready
- Documentation updated

---

**Dicipta dengan ❤️ untuk Sajian Sematang**

**Version 2.0 - Production Ready**
