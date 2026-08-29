# 📋 PHASE R4: CUSTOMER EXPERIENCE & ORDERING FLOW - AUDIT REPORT

**Audit Date:** 29/08/2026  
**Audited By:** Roo Code  
**Focus:** Customer-facing pages, product catalog, cart management, order flow

---

## 🎯 AUDIT SCOPE

**Phase R4 Requirements (from Master Prompt):**
- Homepage dengan menu produk
- Product browsing by category
- Cart management (localStorage/Context)
- Customer profile management
- Delivery / Self-Pickup selection
- Order creation with server validation
- WhatsApp integration
- Order history

---

## 📊 CURRENT CUSTOMER PAGES INVENTORY

### **Existing Customer Routes:**

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `/` | `app/page.tsx` | Homepage & product list | ✅ EXISTS |
| `/sellers` | `app/sellers/page.tsx` | Seller directory | ✅ EXISTS |
| `/sellers/[id]` | `app/sellers/[id]/page.tsx` | Seller's menu | ✅ EXISTS |
| `/order/[sellerId]` | `app/order/[sellerId]/page.tsx` | Order form | ✅ EXISTS |
| `/order/success/[orderId]` | `app/order/success/[orderId]/page.tsx` | Order success | ✅ EXISTS |
| `/preorder` | `app/preorder/page.tsx` | Pre-order flow | ✅ EXISTS |
| `/dashboard` | `app/dashboard/page.tsx` | Old dashboard | ⚠️ LEGACY |

---

## 🔍 CRITICAL FINDINGS

### 🔴 **SECURITY ISSUE #1: NO SERVER PRICE VALIDATION**

**Master Prompt Seksyen 29:**
> "Jangan percaya price, quantity, discount, delivery fee, total yang datang daripada browser. Server/database mesti kira semula."

**Current Implementation:**
```typescript
// app/order/[sellerId]/page.tsx
const subtotal = cart.reduce((total, item) => 
  total + item.price * item.quantity, 0);

// Submit order with client-calculated total
await supabase.from('orders').insert({
  total_price: getTotalPrice() // ❌ Client value, not validated
});
```

**Risk:** Customer can manipulate cart data:
- Change price to RM0.01 in sessionStorage
- Order 100 items for RM1 total
- System accepts without validation

**Required Fix:** Server-side validation (Server Action or RPC)

---

### 🔴 **SECURITY ISSUE #2: NO STOCK CONCURRENCY CONTROL**

**Master Prompt Seksyen 19:**
> "Gunakan PostgreSQL transaction / database function / RPC / atomic update untuk menentukan sama ada stock cukup"

**Current Implementation:**
```typescript
// No stock check before creating order
await supabase.from('orders').insert({...});
await supabase.from('order_items').insert(orderItems);
// ❌ Two customers can order same last item
```

**Risk:** 
- Overselling
- Negative stock
- Customer disappointment

**Required Fix:** Atomic stock check + deduction in PostgreSQL RPC

---

### 🔴 **SECURITY ISSUE #3: NO ORDER SNAPSHOT**

**Master Prompt Seksyen 28:**
> "Order item snapshot: product name, selling price, cost price, option name, option price"

**Current order_items:**
```typescript
{
  product_id: string,
  quantity: number,
  unit_price: number // ✅ Has this
  // ❌ Missing: product_name_snapshot
  // ❌ Missing: cost_price_snapshot
}
```

**Risk:**
- If product renamed/repriced, old orders show wrong data
- Audit trail incomplete
- Cannot reconstruct historical transactions

---

### 🟡 **ISSUE #4: PROFILE IN localStorage ONLY**

**Master Prompt Seksyen 12:**
> "Supabase database ialah source of truth. Customer update address di Phone A, kemudian login di Phone B — Phone B mesti dapat profile terkini"

**Current:** `lib/utils.ts` uses localStorage only

**Problem:** Profile not synced across devices

---

### 🟡 **ISSUE #5: NO PRODUCT OPTIONS**

**Master Prompt Seksyen 17:**
> "Sistem mesti menyokong options/add-ons (contoh: Coffee Hot = RM3, Iced = RM4)"

**Current:** No options system exists

---

### 🟡 **ISSUE #6: NO CATEGORY FILTERING**

**Master Prompt Seksyen 15:**
> "Customer memilih category dahulu (Makanan, Minuman, Combo, Lain-lain)"

**Current:** All products in one list

---

## 📈 MASTER PROMPT COMPLIANCE

| Requirement | Seksyen | Status |
|-------------|---------|--------|
| Server price validation | 29 | ❌ 0% |
| Stock concurrency | 19 | ❌ 0% |
| Order snapshot | 28 | 🟡 40% |
| Product options | 17 | ❌ 0% |
| Category filtering | 15 | ❌ 0% |
| Profile in database | 12 | 🟡 50% |
| Cart system | 20 | 🟡 70% |
| WhatsApp integration | 31 | ✅ 100% |
| Delivery fee calc | 24 | 🟡 80% |

**Overall R4 Compliance:** 🟡 **45%**

---

## 🛠️ RECOMMENDED FIXES

### **PRIORITY 1: Critical Security** 🔴

#### **R4A: Server-Side Order Validation (4-6 hours)**
1. Create Server Action: `app/actions/create-order.ts`
2. Validate auth
3. Fetch fresh prices from database
4. Check stock atomically
5. Create order with snapshot
6. Deduct stock in transaction

#### **R4B: Order Snapshot Fields (1-2 hours)**
1. Migration: Add `product_name_snapshot`, `cost_price_snapshot`
2. Update order creation logic
3. Update order display

---

### **PRIORITY 2: Architecture Improvements** 🟡

#### **R4C: Cart Context (2-3 hours)**
1. Create `app/contexts/CartContext.tsx`
2. Replace sessionStorage with Context + localStorage cache
3. Floating cart icon
4. Cart drawer component

#### **R4D: Product Options (3-4 hours)**
1. Create `product_options` table
2. Seller UI: Manage options
3. Customer UI: Select options
4. Save option snapshot in order

#### **R4E: Category Filtering (1-2 hours)**
1. Add category tabs on homepage
2. Filter products
3. Category icons

#### **R4F: Profile in Database (2 hours)**
1. Save profile to `users` table
2. Use localStorage as cache
3. Sync on login

---

## 🎯 TOTAL PHASE R4 ESTIMATE

| Sub-Phase | Duration | Priority |
|-----------|----------|----------|
| R4A: Server validation | 4-6h | 🔴 CRITICAL |
| R4B: Order snapshot | 1-2h | 🔴 CRITICAL |
| R4C: Cart Context | 2-3h | 🟡 HIGH |
| R4D: Product options | 3-4h | 🟡 MEDIUM |
| R4E: Category filter | 1-2h | 🟢 LOW |
| R4F: Profile DB | 2h | 🟡 MEDIUM |
| R4G: Order history | 2-3h | 🟡 MEDIUM |
| R4H: Testing | 2-3h | 🟢 ALWAYS |

**Total:** 18-25 hours

---

## 🚀 NEXT STEPS

**Recommendation:** Start with **R4A + R4B** (Server Validation + Snapshot)

**Why:**
- Fixes critical security vulnerabilities
- Prevents price manipulation
- Prevents overselling
- Makes system production-safe

**Time:** 5-8 hours

---

**Ready to proceed?** 🚀
