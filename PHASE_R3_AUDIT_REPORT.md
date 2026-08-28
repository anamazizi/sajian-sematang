# 🔍 PHASE R3 AUDIT: SELLER MANAGEMENT & ONBOARDING

**Audit Date:** 28/08/2026, 16:25  
**Status:** ⚠️ **PARTIALLY IMPLEMENTED - Needs Development**  
**Scope:** Seller Management, Seller Dashboard, Onboarding Flow

---

## 📊 Executive Summary

**Current Status:** 🟡 **40% COMPLETE**

### What Exists ✅
- ✅ Database schema (`sellers` table with all columns)
- ✅ RLS policies for sellers table
- ✅ TypeScript types defined (`Seller` interface)
- ✅ Seller listing page (`/sellers`) - Customer view
- ✅ Seller menu page (`/sellers/[id]`) - Customer view
- ✅ Basic seller dashboard (`/dashboard`) - Shows all orders

### What's Missing ❌
- ❌ **Seller Onboarding Flow** (CRITICAL)
- ❌ **Seller Profile Management** (HIGH)
- ❌ **Seller Product Management** (HIGH)
- ❌ **Seller-specific Order View** (MEDIUM)
- ❌ **DuitNow QR Upload** (HIGH)
- ❌ **Shop Information Editor** (HIGH)

---

## 🎯 Master Prompt Compliance

| Seksyen | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| 36 | Seller Concept | ✅ DONE | DB schema separates sellers |
| 37 | Seller Dashboard `/seller` | ❌ MISSING | Using `/dashboard` instead |
| 38 | Seller Product Access (RLS) | ✅ DONE | RLS policies exist |
| 39 | Stock History | ❌ MISSING | No UI |
| 40 | Admin/Staff Stock Adjust | ⚠️ PARTIAL | No UI |
| 51 | Seller QR DuitNow | ❌ MISSING | No upload UI |

**Compliance:** 30% (2/6 requirements fully met)

---

## 🔴 CRITICAL ISSUES

### Issue #1: No Seller Onboarding Flow

**Problem:**
- User gets `seller` role but no way to complete seller profile
- No shop name setup, no DuitNow QR upload

**Expected Flow (Seksyen 37):**
```
Login → Profile → Seller Onboarding → /seller Dashboard
             ↓
    - Shop Name (WAJIB)
    - Phone Number
    - Description
    - DuitNow QR Upload (WAJIB)
```

**Impact:** 🔴 **CRITICAL** - Sellers can't operate

---

### Issue #2: Wrong Dashboard Route

**Problem:**
- Master Prompt says `/seller` route
- Current: `/dashboard` (generic)

**Expected Routes:**
```
/ → Customer ordering
/admin → Admin dashboard
/staff → Staff dashboard
/seller → Seller dashboard  ← MISSING!
```

**Impact:** 🔴 **HIGH** - Not compliant

---

### Issue #3: Seller Sees ALL Orders (Security)

**Problem:** Line 46-50 in `/app/dashboard/page.tsx`:
```typescript
const { data: ordersData } = await supabase
  .from('orders')
  .select('*')
  // ❌ NO FILTER BY SELLER!
```

**Security Risk:** Seller A can see Seller B's orders

**Impact:** 🔴 **CRITICAL** - Violates Seksyen 38

---

### Issue #4: No Seller Product Management

**Problem:**
- Seller can't add/edit/delete products
- Seller can't manage stock
- Seller can't upload images

**Required Pages:**
- `/seller/products` - List
- `/seller/products/new` - Add
- `/seller/products/[id]/edit` - Edit

**Impact:** 🔴 **CRITICAL** - Core functionality missing

---

### Issue #5: No DuitNow QR Management

**Problem:**
- `sellers.duitnow_qr_url` column exists
- But no UI to upload/view/update QR

**Required:**
- Upload QR to Supabase Storage
- Display current QR
- Update/replace QR

**Impact:** 🔴 **HIGH** - Can't receive payments

---

## 📋 Development Plan

### PHASE R3A: Seller Onboarding (3 hours)

**Files to Create:**
1. `app/seller/onboarding/page.tsx`
2. `lib/storage/seller-qr.ts`

**Features:**
- Shop name input
- Description
- DuitNow QR upload
- Create seller record

---

### PHASE R3B: Dashboard Route Fix (1 hour)

**Actions:**
1. Move `/dashboard` → `/seller`
2. Filter orders by seller_id
3. Update middleware

---

### PHASE R3C: Product Management (4 hours)

**Files:**
1. `app/seller/products/page.tsx`
2. `app/seller/products/new/page.tsx`
3. `app/seller/products/[id]/edit/page.tsx`
4. `components/seller/ProductForm.tsx`

---

### PHASE R3D: Profile Management (2 hours)

**File:** `app/seller/profile/page.tsx`
- Edit shop info
- Update DuitNow QR

---

### PHASE R3E: Stock History (1.5 hours)

**File:** `app/seller/stock-history/page.tsx`
- View stock movements

---

## 📈 Estimated Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| R3A: Onboarding | 3h | 🔴 CRITICAL |
| R3B: Route Fix | 1h | 🔴 CRITICAL |
| R3C: Products | 4h | 🔴 HIGH |
| R3D: Profile | 2h | 🟡 MEDIUM |
| R3E: Stock History | 1.5h | 🟡 MEDIUM |
| **TOTAL** | **11.5h** | |

**Timeline:** 2 working days

---

## ✅ What's Working

1. Database schema complete
2. RLS policies active
3. TypeScript types defined
4. Customer-facing pages functional
5. Admin payout system working

---

**AUDIT COMPLETE.** Proceed with development?


# 🔍 PHASE R3 AUDIT: SELLER MANAGEMENT & ONBOARDING

**Audit Date:** 28/08/2026, 16:25  
**Status:** ⚠️ **PARTIALLY IMPLEMENTED - Needs Development**  
**Scope:** Seller Management, Seller Dashboard, Onboarding Flow

---

## 📊 Executive Summary

**Current Status:** 🟡 **40% COMPLETE**

### What Exists ✅
- ✅ Database schema (`sellers` table with all columns)
- ✅ RLS policies for sellers table
- ✅ TypeScript types defined (`Seller` interface)
- ✅ Seller listing page (`/sellers`) - Customer view
- ✅ Seller menu page (`/sellers/[id]`) - Customer view
- ✅ Basic seller dashboard (`/dashboard`) - Shows all orders

### What\'s Missing ❌
- ❌ **Seller Onboarding Flow** (CRITICAL)
- ❌ **Seller Profile Management** (HIGH)
- ❌ **Seller Product Management** (HIGH)
- ❌ **Seller-specific Order View** (MEDIUM)
- ❌ **DuitNow QR Upload** (HIGH)
- ❌ **Shop Information Editor** (HIGH)

---

## 🎯 Master Prompt Compliance Check

| Seksyen | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| 36 | Seller Concept | ✅ DONE | DB schema separates sellers |
| 37 | Seller Dashboard `/seller` route | ❌ MISSING | Using `/dashboard` instead |
| 38 | Seller Product Access (RLS) | ✅ DONE | RLS policies exist |
| 39 | Stock History | ❌ MISSING | No UI to track stock changes |
| 40 | Admin/Staff Stock Adjust | ⚠️ PARTIAL | No UI for adjustments |
| 51 | Seller QR DuitNow | ❌ MISSING | No upload/manage UI |

**Compliance:** 30% (2/6 requirements fully met)

