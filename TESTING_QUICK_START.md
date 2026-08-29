# 🚀 QUICK START: Testing Phase R4A+R4B

## 📝 Git Commit Status

✅ **COMMITTED:** Phase R4A+R4B Server-Side Validation & Stock Concurrency

```bash
Commit: aeb97ab
Message: feat(orders): implement server-side validation & stock concurrency
Files: 7 (5 new, 2 modified, ~1,164 lines)
```

---

## 🧪 Testing Checklist

### 🟢 **Quick Test (15 minutes)**

1. **Start Server**
   ```bash
   cd /home/honor/Desktop/sajian-sematang
   npm run dev
   ```

2. **Test Normal Order** (✅ Most Important)
   - Login as customer
   - Add product to cart
   - Submit order
   - Verify success page
   - Check database: order created + stock deducted

3. **Test Price Manipulation** (🔴 Critical Security)
   - Add product to cart (e.g., RM10)
   - Open DevTools Console (F12)
   - Run:
   ```javascript
   const cart = JSON.parse(sessionStorage.getItem('cart'));
   cart[0].price = 0.01; // Manipulate to RM0.01
   sessionStorage.setItem('cart', JSON.stringify(cart));
   location.reload();
   ```
   - Submit order
   - **Expected:** Error "Harga tidak sepadan"
   - **Expected:** Order NOT created

4. **Test Stock Concurrency** (🔴 Critical Security)
   - Set product stock = 1 (in Supabase)
   - Open 2 browser tabs
   - Both add same product
   - Customer A submits → Success
   - Customer B submits → Error "Stok tidak mencukupi"
   - **Expected:** Stock = 0 (not -1)

---

### 🟡 **Full Test (1-2 hours)**

Refer to complete guide:
```
TESTING_GUIDE_R4AB.md (322 lines)
```

Includes:
- ✅ TEST 1: Normal Order Flow
- 🔴 TEST 2: Price Manipulation Attack
- ⚡ TEST 3: Stock Concurrency (Multiple Tabs)
- 📸 TEST 4: Snapshot Preservation
- SQL verification queries
- Bug report template

---

## ✅ Success Criteria

**Phase R4A+R4B is COMPLETE if:**
- ✅ Normal orders work
- ✅ Price manipulation blocked
- ✅ Stock concurrency prevented
- ✅ Snapshot fields populated
- ✅ No critical bugs

---

## 🐞 If Tests Fail

1. Note which test failed
2. Check error message in:
   - Browser Console (F12)
   - Server Terminal (npm run dev output)
   - Supabase Dashboard → Logs
3. Use bug report template in `TESTING_GUIDE_R4AB.md`
4. Share findings with developer

---

## 🎯 After Testing

**If ALL PASS:**
🎉 Proceed to **Phase R4C: Cart Context Architecture**

**If ANY FAIL:**
🐞 Developer will fix → Retest → Then proceed

---

## 📊 Current Progress

| Phase | Status |
|-------|--------|
| R3: Seller Management | ✅ 100% Complete |
| R4-Audit | ✅ 100% Complete |
| **R4A+R4B: Server Security** | **✅ READY FOR TESTING** |
| R4C: Cart Context | ⏳ Next (2-3h) |
| R4D: Product Options | ⏳ Upcoming (3-4h) |

---

**Happy Testing! 🧪**

*Generated: 29 Aug 2026*
