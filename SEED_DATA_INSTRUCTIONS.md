# 🌱 SEED DATA INSTRUCTIONS

## 🎯 **Purpose**

Create sample sellers and products in Supabase for testing **Phase R4C: Cart Context**.

---

## 📊 **What Will Be Created**

- **3 Sample Sellers:**
  1. Warung Kak Siti (8 products)
  2. Restoran Pak Ahmad (8 products)
  3. Kedai Makan Azizah (10 products)

- **26 Total Products:**
  - 16 Makanan (food items)
  - 10 Minuman (beverages)
  - Realistic Malaysian food menu
  - Prices: RM2.00 - RM10.00
  - Stock: 20 - 100 units

---

## 🚀 **HOW TO RUN**

### **Step 1: Open Supabase SQL Editor**

1. Go to https://supabase.com
2. Select your project: **Sajian Sematang**
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

---

### **Step 2: Copy & Paste Seed Script**

1. Open file: `supabase/08_seed_sample_data.sql`
2. **Copy entire content** (all 200+ lines)
3. **Paste** into Supabase SQL Editor

---

### **Step 3: Execute**

1. Click **Run** button (or press Ctrl/Cmd + Enter)
2. Wait 2-3 seconds for completion

---

### **Step 4: Verify Success**

**Expected Output in Messages panel:**

```
✅ Sample users created
✅ Sample sellers created
✅ Warung Kak Siti products created (8 items)
✅ Restoran Pak Ahmad products created (8 items)
✅ Kedai Makan Azizah products created (10 items)

========================================
✅ SEED DATA CREATED SUCCESSFULLY!
========================================

Summary:
- 3 Sample Users (Sellers)
- 3 Sellers with shop details
- 26 Products across 3 sellers

You can now:
1. Visit http://localhost:3000/sellers
2. Browse products from each seller
3. Test Cart Context functionality
```

**Verification tables will also appear below showing:**
- Seller list with product counts
- Products grouped by seller and category
- Total counts (Users, Sellers, Products)

---

## 👀 **VIEW DATA IN SUPABASE**

### **Check Sellers:**
1. Go to **Table Editor** → `sellers` table
2. You should see 3 sellers

### **Check Products:**
1. Go to **Table Editor** → `products` table
2. You should see 26 products
3. Filter by `seller_id` to see products per seller

---

## ✅ **TEST IN APP**

### **Step 1: Start Dev Server**
```bash
cd /home/honor/Desktop/sajian-sematang
npm run dev
```

### **Step 2: Browse Sellers**
```
http://localhost:3000/sellers
```

**Expected:**
- ✅ See 3 seller cards
- ✅ Each card shows shop name and description
- ✅ "Lihat Menu" button on each card

### **Step 3: View Products**
Click "Lihat Menu" on any seller

**Expected:**
- ✅ See product list (5-10 items per seller)
- ✅ Product names, prices, descriptions
- ✅ Category badges (Makanan/Minuman)
- ✅ Stock info displayed
- ✅ "Tambah ke Pesanan" buttons

### **Step 4: Test Cart Context**
1. Click "Tambah ke Pesanan" on 2-3 products
2. ✅ Quantity buttons appear
3. ✅ Cart summary shows at bottom
4. ✅ Total price calculated
5. Click "Teruskan Pesanan"
6. ✅ Navigate to order page
7. ✅ Cart items displayed
8. ✅ Can complete checkout flow

---

## 🗑️ **CLEAN UP (OPTIONAL)**

If you want to remove seed data:

```sql
-- Delete all seed data
DELETE FROM products WHERE seller_id IN (
  SELECT id FROM sellers WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
  )
);

DELETE FROM sellers WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

DELETE FROM users WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);
```

---

## 💡 **SAMPLE DATA DETAILS**

### **Warung Kak Siti** 🍛
**Description:** "Nasi lemak dan lauk-pauk tradisional. Sedap macam masakan mak!"

**Makanan:**
- Nasi Lemak Biasa - RM5.00
- Nasi Lemak Ayam Goreng - RM8.00
- Nasi Lemak Rendang - RM10.00
- Lontong - RM6.50
- Mee Goreng Mamak - RM7.00

**Minuman:**
- Teh Tarik - RM2.50
- Kopi O - RM2.00
- Milo Ais - RM3.50

---

### **Restoran Pak Ahmad** 🍚
**Description:** "Nasi ayam, nasi goreng, dan minuman segar. Murah dan sedap!"

**Makanan:**
- Nasi Ayam Goreng - RM7.50
- Nasi Goreng Kampung - RM6.00
- Nasi Goreng Ayam - RM8.00
- Mee Goreng Basah - RM7.50
- Kuey Teow Goreng - RM8.50

**Minuman:**
- Air Limau Ais - RM3.00
- Teh O Ais Limau - RM3.50
- Sirap Bandung - RM3.50

---

### **Kedai Makan Azizah** ☕
**Description:** "Kafe & minuman. Kopi, teh, dan kudap-kudapan. Best untuk lepak!"

**Makanan:**
- Roti Bakar Kaya - RM4.00
- Roti Telur Bawang - RM5.50
- Sandwich Sardin - RM6.00
- Nasi Goreng USA - RM10.00

**Minuman:**
- Kopi Panas - RM3.00
- Kopi Ais - RM3.50
- Teh Tarik Special - RM4.00
- Milo Panas - RM3.50
- Nescafe Ais - RM3.50
- Air Mata Kucing - RM4.00

---

## ⚠️ **TROUBLESHOOTING**

### **Error: "relation 'users' does not exist"**
**Cause:** Main schema not created yet

**Fix:**
1. Run `supabase/schema.sql` first
2. Then run seed data script

---

### **Error: "duplicate key value violates unique constraint"**
**Cause:** Seed data already exists

**Fix:** Script uses `ON CONFLICT DO NOTHING`, so this shouldn't happen. If it does, clean up first (see Clean Up section above).

---

### **No sellers showing at /sellers**
**Possible causes:**
1. Seed script didn't run successfully
2. RLS policies blocking access
3. App not fetching correctly

**Debug:**
```sql
-- Check if data exists
SELECT COUNT(*) FROM sellers;
-- Expected: 3

SELECT COUNT(*) FROM products;
-- Expected: 26
```

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Seed script ran without errors
- [ ] Supabase shows 3 sellers in table editor
- [ ] Supabase shows 26 products in table editor
- [ ] `/sellers` page shows 3 seller cards
- [ ] Clicking seller shows 5-10 products
- [ ] Can add products to cart
- [ ] Cart context updates reactively
- [ ] Can proceed to checkout

---

**Ready to test Cart Context! 🚀**

*Generated: 29 Aug 2026*
