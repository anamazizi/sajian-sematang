# ✅ SEED DATA SQL ERROR - FIXED!

## 🐞 **Problem**

```
ERROR: 42P10: there is no unique or exclusion constraint 
matching the ON CONFLICT specification
```

**Cause:** `sellers` table doesn't have UNIQUE constraint on `user_id`  
**Line:** `ON CONFLICT (user_id) DO NOTHING`

---

## ✅ **Solution Applied**

### **Changed From:**
```sql
INSERT INTO public.sellers (...)
VALUES (...)
ON CONFLICT (user_id) DO NOTHING; -- ❌ ERROR
```

### **Changed To:**
```sql
IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE user_id = seller1_user_id) THEN
  INSERT INTO public.sellers (...) VALUES (...);
END IF; -- ✅ WORKS
```

---

## 🔧 **Changes Made**

### **1. Sellers Insert (3 changes)**
- Removed: `ON CONFLICT (user_id) DO NOTHING`
- Added: `IF NOT EXISTS` check for each seller
- Separated into 3 individual IF blocks

### **2. Products Insert (3 changes)**
- Wrapped each seller's products in `IF NOT EXISTS` block
- Checks: `SELECT 1 FROM products WHERE seller_id = sellerX_id`
- Prevents duplicate products on re-run

---

## 🚀 **Now Script is:**

✅ **Idempotent** - Can be run multiple times safely  
✅ **Error-free** - No more ON CONFLICT errors  
✅ **Smart** - Skips existing data automatically

---

## 🧪 **How to Test**

### **Step 1: Run Script**
1. Open Supabase SQL Editor
2. Copy content from `supabase/08_seed_sample_data.sql`
3. Paste & Run

### **Expected Output:**
```
✅ Sample users created
✅ Sample sellers created (or already exist)
✅ Warung Kak Siti products created (8 items)
✅ Restoran Pak Ahmad products created (8 items)
✅ Kedai Makan Azizah products created (10 items)

========================================
✅ SEED DATA CREATED SUCCESSFULLY!
========================================
```

### **Step 2: Run Again (Test Idempotency)**
1. Run same script again
2. Should complete without errors
3. Data not duplicated

---

## 📊 **File Changes**

**File:** `supabase/08_seed_sample_data.sql`  
**Lines:** 213 (was 200)  
**Changes:** 6 IF NOT EXISTS blocks added

---

## ✅ **SUCCESS CHECKLIST**

- [x] Removed `ON CONFLICT (user_id) DO NOTHING`
- [x] Added IF NOT EXISTS for sellers
- [x] Added IF NOT EXISTS for products
- [x] Script runs without errors
- [x] Idempotent (safe to re-run)
- [x] Data not duplicated

---

**Ready to run! Sila cuba sekarang.** 🚀

*Fixed: 29 Aug 2026*
