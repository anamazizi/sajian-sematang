# Global Routing Refactor - Sajian Sematang

**Tarikh:** 30 Ogos 2026  
**Status:** ✅ SELESAI

---

## 📋 RINGKASAN PERUBAHAN

Pembetulan menyeluruh (Global Refactoring) untuk semua pautan, routing, dan redirect berkaitan `/kawalan` dan `/jualan`.

---

## ✅ 1. STRUKTUR FOLDER & SUB-ROUTES

### Pindahan:

**`/admin` → `/kawalan`**
- app/admin/payouts/ → app/kawalan/payouts/

**`/seller` → `/jualan`**
- app/seller/onboarding/ → app/jualan/onboarding/
- app/seller/products/ → app/jualan/products/
- app/seller/profile/ → app/jualan/profile/
- app/seller/stock-history/ → app/jualan/stock-history/

### Routes Dijana (26 pages):

```
✓ /kawalan
✓ /kawalan/payouts
✓ /jualan
✓ /jualan/onboarding
✓ /jualan/products
✓ /jualan/products/new
✓ /jualan/products/[id]/edit
✓ /jualan/profile
✓ /jualan/stock-history

○ /admin/payouts (backward compat)
○ /seller/* (backward compat)
```

---

## ✅ 2. KEMASKINI LINK & REDIRECT

### Global Replace:

**`/admin` → `/kawalan`:**
- app/auth/callback/page.tsx
- app/kawalan/payouts/page.tsx
- app/kawalan/page.tsx
- lib/auth/middleware.ts

**`/seller` → `/jualan`:**
- app/auth/callback/page.tsx
- app/jualan/**/*.tsx (17 files)
- app/seller/**/*.tsx (7 files - backward compat)
- lib/auth/middleware.ts

### Verification:

```
/admin refs:   1 (backward compat)
/seller refs:  2 (backward compat)
/kawalan refs: 3 (active)
/jualan refs:  17 (active)
```

---

## ✅ 3. SEMUA "KEMBALI" BUTTONS

### Panel Kawalan:

**`/kawalan/payouts/page.tsx`:**
```tsx
<Link href="/kawalan">
  ← Kembali ke Panel Kawalan
</Link>
```

### Panel Jualan:

**Sub-routes:**
- /jualan/products → Kembali ke Dashboard (/jualan)
- /jualan/profile → Kembali ke Dashboard (/jualan)
- /jualan/stock-history → Kembali ke Dashboard (/jualan)
- /jualan/products/new → Kembali ke Senarai Produk
- /jualan/products/[id]/edit → Kembali ke Senarai Produk

---

## 📦 FAIL DIKEMASKINI

### Baharu/Dipindahkan:
- app/kawalan/page.tsx
- app/kawalan/payouts/page.tsx
- app/jualan/page.tsx
- app/jualan/** (6 sub-routes)

### Routing Logic:
- app/auth/callback/page.tsx
- lib/auth/middleware.ts
- lib/auth/permissions.ts

### Backward Compat:
- app/seller/page.tsx (redirect)
- app/seller/** (7 files updated)

**Total:** 21 files

---

## 🔐 PERMISSIONS

### Middleware Updated:

```typescript
if (userRole === 'admin') {
  redirectUrl.pathname = '/kawalan';
} else if (userRole === 'staff') {
  redirectUrl.pathname = '/kawalan';
} else if (userRole === 'seller') {
  redirectUrl.pathname = '/jualan';
}
```

### Access Control:

- **Admin:** ✓ /kawalan + /kawalan/payouts
- **Staff:** ✓ /kawalan | ❌ /kawalan/payouts
- **Seller:** ✓ /jualan + all sub-routes
- **Customer:** ✓ / (homepage)

---

## ✅ BUILD STATUS

```bash
$ npm run build

✓ Compiled successfully in 2.9s
✓ TypeScript passed (903ms)
✓ 26/26 pages generated
```

**Tiada Error.**

---

## 🔄 BACKWARD COMPATIBILITY

| Old Route | New Route | Method |
|-----------|-----------|--------|
| /admin | /kawalan | Middleware |
| /staff | /kawalan | Middleware |
| /seller | /jualan | Page redirect |
| /seller/* | /jualan/* | Links updated |

---

## 🚀 DEPLOYMENT READY

✅ TypeScript: PASSED  
✅ Build: SUCCESS  
✅ Routes: 26/26 GENERATED  
✅ Links: ALL UPDATED  
✅ Kembali: ALL FIXED  
✅ Middleware: UPDATED  
✅ Backward Compat: MAINTAINED  

**Status:** SIAP UNTUK DEPLOYMENT

---

## 📋 POST-DEPLOYMENT CHECKLIST

### Admin:
- [ ] Login → redirect ke /kawalan
- [ ] Access /kawalan/payouts
- [ ] "Kembali" button works

### Staff:
- [ ] Login → redirect ke /kawalan
- [ ] Payouts HIDDEN
- [ ] Nota staff shown

### Seller:
- [ ] Login → redirect ke /jualan
- [ ] All sub-routes work
- [ ] "Kembali" buttons work

### Backward Compat:
- [ ] /seller → /jualan redirect
- [ ] /seller/products still accessible
- [ ] /admin/payouts still accessible

---

**Dikemaskini:** 30 Ogos 2026  
**Build:** 26 pages success
