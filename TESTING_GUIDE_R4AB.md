# 🧪 TESTING GUIDE: PHASE R4A+R4B
## Server-Side Validation & Stock Concurrency

**Tarikh:** 29 Ogos 2026  
**Environment:** Local Development (`npm run dev`)  
**Phase:** R4A+R4B - Critical Security Fixes

---

## 📋 PRE-TEST CHECKLIST

### **1. Environment Setup**
```bash
# Start development server
cd /home/honor/Desktop/sajian-sematang
npm run dev

# Expected: Server running on http://localhost:3000
```

### **2. Database Verification**
In Supabase SQL Editor, verify:

```sql
-- Check snapshot fields exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
  AND column_name LIKE '%snapshot%';
-- Expected: product_name_snapshot, cost_price_snapshot

-- Check RPC function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'create_order_with_stock_check';
-- Expected: 1 row
```

### **3. Test Data Required**
- ✅ At least 1 seller account
- ✅ At least 2 products with stock > 5
- ✅ 1 product with stock = 1 (for concurrency test)
- ✅ Customer account with complete profile

---

## 🧪 TEST SUITE

---

## ✅ **TEST 1: NORMAL ORDER FLOW**

**Objective:** Verify basic order creation works

**Steps:**

1. Login as customer → `http://localhost:3000`
2. Browse products → Navigate to `/sellers` → Select seller
3. Add 2-3 products to cart
4. Click "Teruskan Pesanan" → Navigate to `/order/[sellerId]`
5. Fill delivery details (Delivery or Self Pickup)
6. Add optional note: "Kurang pedas"
7. Click "Hantar Pesanan"

**Expected Results:**
- ✅ Loading indicator appears
- ✅ Redirect to `/order/success/[orderId]`
- ✅ Order ID displayed (format: SS-XXXX)
- ✅ WhatsApp button visible
- ✅ No console errors

**Database Verification:**
```sql
-- Check order created with snapshot
SELECT o.id, o.total_price, o.customer_name_snapshot,
       oi.product_name_snapshot, oi.cost_price_snapshot
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
ORDER BY o.created_at DESC 
LIMIT 1;
-- Expected: All snapshot fields populated ✅

-- Check stock deducted
SELECT name, stock_quantity 
FROM products 
WHERE id IN (SELECT product_id FROM order_items 
             WHERE order_id = '[latest_order_id]');
-- Expected: Stock reduced by ordered quantity ✅

-- Check stock movement logged (Phase R3E trigger)
SELECT product_id, previous_quantity, adjustment_quantity, new_quantity
FROM stock_movements 
ORDER BY created_at DESC 
LIMIT 3;
-- Expected: Negative adjustment logged ✅
```

**Status:** [ ] PASS  [ ] FAIL  
**Notes:** _________________________________

---

## 🔴 **TEST 2: PRICE MANIPULATION ATTACK**

**Objective:** Verify server rejects manipulated prices

**Steps:**

1. Login as customer
2. Add product to cart (e.g., "Nasi Lemak RM10")
3. Proceed to checkout page
4. **Open Browser DevTools (F12) → Console**
5. **Manipulate cart price:**

```javascript
// In Browser Console:
const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
if (cart.length > 0) {
  cart[0].price = 0.01; // Change RM10 to RM0.01
  sessionStorage.setItem('cart', JSON.stringify(cart));
  console.log('✅ Price manipulated to RM0.01');
  location.reload(); // Refresh to see change
}
```

6. Submit order → Click "Hantar Pesanan"

**Expected Results:**
- ✅ Error message displayed
- ✅ Error text: "Harga tidak sepadan - Server: RM10.00, Client: RM0.01"
- ✅ Order NOT created
- ✅ Stock NOT deducted
- ✅ User stays on order page

**Database Verification:**
```sql
-- Verify NO order with manipulated price
SELECT id, total_price, created_at 
FROM orders 
WHERE total_price < 1.00 
ORDER BY created_at DESC 
LIMIT 1;
-- Expected: No recent orders with RM0.01 ✅
```

**Status:** [ ] PASS  [ ] FAIL  
**Notes:** _________________________________

---

## ⚡ **TEST 3: STOCK CONCURRENCY (Two Customers)**

**Objective:** Only one customer can buy the last item

**Setup:**
```sql
-- Set product stock to 1
UPDATE products 
SET stock_quantity = 1 
WHERE name = 'Test Concurrency';

-- Verify
SELECT name, stock_quantity FROM products WHERE name = 'Test Concurrency';
-- Expected: 1
```

**Steps:**

1. **Open TWO browser tabs/windows**
   - Tab A: `http://localhost:3000` (Customer A)
   - Tab B: `http://localhost:3000` (Customer B)
   - Both login as customer

2. **Both add same product**
   - Tab A: Add "Test Concurrency" to cart
   - Tab B: Add "Test Concurrency" to cart

3. **Both proceed to checkout**
   - Tab A: Navigate to order page
   - Tab B: Navigate to order page

4. **Customer A submits FIRST**
   - Tab A: Click "Hantar Pesanan"
   - Expected: ✅ Success → Redirect to success page

5. **Customer B submits SECOND (within 5 seconds)**
   - Tab B: Click "Hantar Pesanan"
   - Expected: ❌ Error message

**Expected Results:**
- ✅ First order succeeds
- ✅ Second order fails with error
- ✅ Error: "Stok tidak mencukupi: Test Concurrency (Tersedia: 0, Diminta: 1)"
- ✅ Stock = 0 (never negative)
- ✅ Only 1 order created

**Database Verification:**
```sql
-- Check stock is 0 (not -1)
SELECT name, stock_quantity 
FROM products 
WHERE name = 'Test Concurrency';
-- Expected: 0 ✅

-- Check only 1 order created
SELECT COUNT(*) 
FROM order_items 
WHERE product_id = (SELECT id FROM products WHERE name = 'Test Concurrency')
AND created_at > NOW() - INTERVAL '5 minutes';
-- Expected: 1 ✅
```

**Status:** [ ] PASS  [ ] FAIL  
**Notes:** _________________________________

---

## 📸 **TEST 4: SNAPSHOT PRESERVATION**

**Objective:** Historical data doesn't change when product updated

**Steps:**

1. **Create order** with product "Nasi Lemak" (RM5.00)
2. Note Order ID from success page

3. **Check snapshot saved:**
```sql
SELECT 
  oi.product_name_snapshot,
  oi.unit_price,
  oi.cost_price_snapshot
FROM order_items oi
WHERE order_id = '[your_order_id]';
-- Expected: "Nasi Lemak", 5.00, [cost_price]
```

4. **Modify product** (as seller):
   - Login as seller
   - Edit "Nasi Lemak"
   - Change name to: "Nasi Lemak Special"
   - Change price to: RM7.00
   - Save

5. **Check historical order unchanged:**
```sql
SELECT 
  oi.product_name_snapshot,
  oi.unit_price
FROM order_items oi
WHERE order_id = '[your_order_id]';
-- Expected: STILL "Nasi Lemak", 5.00 ✅ (not "Special", 7.00)
```

**Expected Results:**
- ✅ Snapshot populated on order creation
- ✅ Snapshot NEVER changes
- ✅ Old orders show old data
- ✅ New orders use new data

**Status:** [ ] PASS  [ ] FAIL  
**Notes:** _________________________________

---

## 📊 **TEST RESULTS SUMMARY**

| Test | Status | Critical? | Notes |
|------|--------|-----------|-------|
| TEST 1: Normal Order | [ ] PASS [ ] FAIL | 🔴 YES | |
| TEST 2: Price Manipulation | [ ] PASS [ ] FAIL | 🔴 YES | |
| TEST 3: Stock Concurrency | [ ] PASS [ ] FAIL | 🔴 YES | |
| TEST 4: Snapshot | [ ] PASS [ ] FAIL | 🟡 MEDIUM | |

**Overall:** [ ] ALL PASS [ ] SOME FAIL

---

## 🐞 **BUG REPORT TEMPLATE**

If any test fails:

```
Test: [Name]
Status: FAIL
Expected: [What should happen]
Actual: [What happened]

Steps to Reproduce:
1. ...
2. ...

Error Messages:
[Paste console errors / screenshots]

Database State:
[SQL query showing unexpected data]
```

---

## ✅ **SUCCESS CRITERIA**

**Phase R4A+R4B COMPLETE if:**
- ✅ All critical tests (1, 2, 3) PASS
- ✅ No critical bugs found
- ✅ System ready for Phase R4C

---

## 🎯 **AFTER TESTING**

**If ALL PASS:**
🎉 Proceed to **Phase R4C: Cart Context Architecture**

**If ANY FAIL:**
🐞 Report bugs → Developer fixes → Retest

---

*Generated: 29 Aug 2026*  
*Phase: R4A+R4B Critical Security*
