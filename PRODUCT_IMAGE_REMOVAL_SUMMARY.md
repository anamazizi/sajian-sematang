# ✅ RINGKASAN - PEMBUANGAN GAMBAR PRODUK

**Date:** 30 Ogos 2026, 8:00 PM  
**Status:** SEBAHAGIAN SELESAI  

---

## 📝 APA YANG SUDAH DILAKUKAN

### ✅ 1. ProductForm Component
**File:** `components/seller/ProductForm.tsx`

**Removed:**
- ✅ `image?: File` from ProductFormData interface
- ✅ `imagePreview` state
- ✅ `handleImageChange()` function (30 lines)
- ✅ Image upload JSX section (50 lines)

**Result:** Form now only has Name, Description, Category, Price, Cost, Stock

### ✅ 2. Add Product Page (Jualan)
**File:** `app/jualan/products/new/page.tsx`

**Removed:**
- ✅ `import { uploadProductImage }` 
- ✅ Image upload logic
- ✅ `image_url` from insert statement

---

## ⏳ PERLU DISELESAIKAN

### 1. Edit Product Pages
**Files:**
- `app/jualan/products/[id]/edit/page.tsx` - Lines 106, 111
- `app/seller/products/new/page.tsx` - Lines 66, 68
- `app/seller/products/[id]/edit/page.tsx` - Lines 106, 111

**Action:** Remove:
- `import { uploadProductImage }`
- `if (formData.image)` blocks
- `image_url` references

### 2. Product Display UI
**Files to check:**
- `app/page.tsx` - Homepage product list
- `components/ui/ProductCard.tsx` (if exists)
- `app/jualan/products/page.tsx` - Seller product list
- `app/kawalan/products/page.tsx` - Admin product list

**Action:** Remove `<img>` tags showing product images

### 3. Quantity Button Fix
**Files:**
- `app/page.tsx` - Find where `removeFromCart()` is called
- Check cart display components

**Action:** Add conditional rendering:
```tsx
{item.quantity > 1 ? (
  <button onClick={() => removeFromCart(item.id)}>
    ➖
  </button>
) : (
  <button 
    onClick={() => {
      if (confirm('🗑️ Buang?')) removeFromCart(item.id);
    }}
    className="text-red-600"
  >
    🗑️
  </button>
)}
```

### 4. Text Contrast - All Forms
**Files:**
- `components/seller/ProductForm.tsx` - All input fields
- `app/jualan/profile/page.tsx` - Profile inputs
- Any other seller dashboard forms

**Action:** Add to ALL inputs:
```
text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400
```

---

## 🔧 QUICK FIX COMMANDS

```bash
# Fix edit pages - remove image imports
find app/jualan/products app/seller/products -name '*.tsx' -exec sed -i '/uploadProductImage/d' {} \;

# Comment out image conditionals  
find app/jualan/products app/seller/products -name '*.tsx' -exec sed -i 's/if (formData\.image)/\/\/ REMOVED: if (formData.image)/g' {} \;

# Build to see remaining errors
npm run build
```

---

## 📊 BUILD STATUS

**Current Errors:**
```
app/jualan/products/[id]/edit/page.tsx(106,20): error TS2339
app/jualan/products/[id]/edit/page.tsx(111,20): error TS2339
app/seller/products/new/page.tsx(66,20): error TS2339  
app/seller/products/new/page.tsx(68,64): error TS2339
app/seller/products/[id]/edit/page.tsx(106,20): error TS2339
app/seller/products/[id]/edit/page.tsx(111,20): error TS2339
```

**All errors:** Property 'image' does not exist on type 'ProductFormData'

**Fix:** Remove/comment out those lines referencing `formData.image`

---

## 📝 ESTIMATED WORK REMAINING

- Fix 4 edit/new product pages: **30 mins**
- Remove product images from UI: **30 mins**  
- Fix quantity button (trash icon): **30 mins**
- Fix text contrast all forms: **1 hour**

**Total:** ~2.5 hours

---

**Dikemaskini:** 30 Ogos 2026, 8:00 PM  
**ProductForm:** ✅ SELESAI  
**Add Product (Jualan):** ✅ SELESAI  
**Remaining:** ⏳ 2.5 hours

