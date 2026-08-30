# 🛠️ PANDUAN PENAMBAHBAIKAN FEATURE

**Date:** 30 Ogos 2026, 7:30 PM  
**Status:** IMPLEMENTATION GUIDE READY  
**Build:** SUCCESS (28 pages)

---

## 📝 3 ISU UTAMA

### 1. ✅ IMAGE URL ALTERNATIVE (Google Drive Support)
### 2. ✅ QUANTITY DECREASE BUTTON FIX
### 3. ✅ TEXT CONTRAST FIX - SELLER DASHBOARD

---

## 1️⃣ IMAGE URL ALTERNATIVE & GOOGLE DRIVE CONVERSION

### ✅ SUDAH DIBUAT: Helper Function

**File:** `lib/utils/image-helpers.ts` (BAHARU)

**Functions:**
1. `convertGoogleDriveUrl(url)` - Convert Google Drive links
2. `getFallbackImageUrl()` - Placeholder image
3. `handleImageError(event)` - Error handler

**Google Drive Conversion:**
```typescript
// Input:
https://drive.google.com/file/d/{FILE_ID}/view

// Output:
https://lh3.googleusercontent.com/d/{FILE_ID}
```

### ⏳ PERLU DIIMPLEMENTASI:

#### A. ProductForm Component
**File:** `components/seller/ProductForm.tsx`

**Add State:**
```typescript
const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
const [imageUrl, setImageUrl] = useState('');
```

**Add Toggle:**
```jsx
<div className="mb-4">
  <div className="flex gap-4 mb-2">
    <button
      type="button"
      onClick={() => setImageMode('upload')}
      className={imageMode === 'upload' ? 'active' : 'inactive'}
    >
      📄 Muat Naik Fail
    </button>
    <button
      type="button"
      onClick={() => setImageMode('url')}
      className={imageMode === 'url' ? 'active' : 'inactive'}
    >
      🔗 Pautan URL
    </button>
  </div>
  
  {imageMode === 'upload' ? (
    <input type="file" onChange={handleImageChange} />
  ) : (
    <input
      type="url"
      placeholder="https://drive.google.com/file/d/.../view atau URL imej lain"
      value={imageUrl}
      onChange={(e) => {
        const converted = convertGoogleDriveUrl(e.target.value);
        setImageUrl(converted);
        setImagePreview(converted);
      }}
      className="w-full px-4 py-2 border text-slate-900 dark:text-slate-900"
    />
  )}
</div>
```

**Add Preview with Fallback:**
```jsx
{imagePreview && (
  <img
    src={imagePreview}
    alt="Preview"
    onError={handleImageError}
    className="max-w-xs"
  />
)}
```

#### B. Seller Profile QR Upload
**File:** `app/jualan/profile/page.tsx`

Same pattern - add toggle between file upload and URL input for QR DuitNow.

---

## 2️⃣ QUANTITY DECREASE BUTTON FIX

### ✅ BACKEND LOGIC SUDAH BETUL

**File:** `contexts/CartContext.tsx`

**Function `removeFromCart` already handles correctly:**
```typescript
if (existingItem && existingItem.quantity > 1) {
  // Decrement quantity
  return item.quantity - 1;
}

// Remove item completely if quantity is 1
return prevCart.filter(item => item.id !== productId);
```

### ⏳ PERLU DISEMAK: UI Implementation

**Files to check:**
- `app/page.tsx` (Homepage cart)
- `components/OptionSelector.tsx`
- Any custom cart display components

**Expected UI Pattern:**
```jsx
<button
  onClick={() => {
    if (item.quantity === 1) {
      if (confirm('❌ Buang item ini dari cart?')) {
        removeFromCart(item.id);
      }
    } else {
      removeFromCart(item.id); // Auto decrease
    }
  }}
  disabled={updating}
>
  ➖ Kurang
</button>
```

**Better UX: Show different button at quantity = 1:**
```jsx
{item.quantity > 1 ? (
  <button onClick={() => removeFromCart(item.id)}>
    ➖
  </button>
) : (
  <button
    onClick={() => {
      if (confirm('Buang item?')) removeFromCart(item.id);
    }}
    className="text-red-600"
  >
    🗑️
  </button>
)}
```

---

## 3️⃣ TEXT CONTRAST FIX - SELLER DASHBOARD

### 🎯 TARGET: All Input Fields in `/jualan`

**Required Classes:**
```css
text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400
```

### Files to Update:

#### ✅ SUDAH DIKEMASKINI:
- `app/jualan/onboarding/page.tsx` (from previous fix)

#### ⏳ PERLU DIKEMASKINI:

**1. ProductForm Component**
**File:** `components/seller/ProductForm.tsx`

**Update ALL inputs:**
```tsx
// Name
<input
  type="text"
  value={formData.name}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
    text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
/>

// Description
<textarea
  value={formData.description}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
    text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
/>

// Category
<select
  value={formData.category}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
    text-slate-900 dark:text-slate-900 bg-white"
>
  {/* options */}
</select>

// Price, Cost Price, Stock - same pattern
<input
  type="number"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
    text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
/>
```

**2. Seller Profile**
**File:** `app/jualan/profile/page.tsx`

**Check and update:**
- Shop name input
- Description textarea
- Phone number input
- Bank info inputs (if editable in profile)

**3. Products List Page**
**File:** `app/jualan/products/page.tsx`

Check search/filter inputs if any.

**4. Stock History**
**File:** `app/jualan/stock-history/page.tsx`

Check any filter inputs.

---

## 📝 IMPLEMENTATION CHECKLIST

### Phase 1: Image URL Feature
- [x] Create helper functions (`lib/utils/image-helpers.ts`)
- [ ] Update ProductForm - add toggle
- [ ] Update ProductForm - handle URL mode
- [ ] Update ProductForm - add preview fallback
- [ ] Update Seller Profile - QR URL option
- [ ] Test Google Drive conversion
- [ ] Test image error fallback

### Phase 2: Quantity Button
- [x] Verify CartContext logic (already correct)
- [ ] Check homepage cart UI
- [ ] Add confirmation for quantity = 1
- [ ] Add visual distinction (trash icon)
- [ ] Test decrease behavior
- [ ] Test remove behavior

### Phase 3: Text Contrast
- [x] Onboarding form (already done)
- [ ] ProductForm component
- [ ] Seller profile page
- [ ] Products list page (if has inputs)
- [ ] Stock history (if has inputs)
- [ ] Verify all inputs visible in dark mode
- [ ] Verify all inputs visible in light mode

---

## 🛠️ UTILITY FUNCTIONS AVAILABLE

### Image Helpers
```typescript
import { 
  convertGoogleDriveUrl, 
  getFallbackImageUrl, 
  handleImageError 
} from '@/lib/utils/image-helpers';

// Usage:
const directUrl = convertGoogleDriveUrl(userInput);

<img 
  src={directUrl || getFallbackImageUrl()} 
  onError={handleImageError}
/>
```

### Cart Functions
```typescript
import { useCart } from '@/contexts/CartContext';

const { removeFromCart, updateQuantity } = useCart();

// Decrease or remove:
removeFromCart(productId); // Auto handles qty > 1 vs qty = 1

// Set specific quantity:
updateQuantity(productId, newQty); // If newQty = 0, removes item
```

---

## 📊 TESTING GUIDE

### Test 1: Google Drive Image
1. Go to `/jualan/products/new`
2. Toggle to "Pautan URL"
3. Paste Google Drive link: `https://drive.google.com/file/d/1abc.../view`
4. Should convert to: `https://lh3.googleusercontent.com/d/1abc...`
5. Preview should show image
6. Save product
7. Check homepage - image should display

### Test 2: Image Fallback
1. Enter invalid URL
2. Fallback placeholder should show
3. Product should still save
4. Homepage should show placeholder

### Test 3: Quantity Decrease
1. Add product to cart (qty = 1)
2. Click "-" button
3. Should ask confirmation OR show trash icon
4. Confirm - item removed
5. Add product again, increase to qty = 3
6. Click "-" - should decrease to 2 (no confirmation)
7. Click "-" again - decrease to 1
8. Click "-" - confirmation or direct remove

### Test 4: Text Visibility
1. Go to `/jualan/products/new`
2. Type in all fields
3. Text should be DARK and VISIBLE
4. Toggle dark mode (if supported)
5. Text should still be DARK and VISIBLE
6. Check placeholder text - should be gray

---

## 🚨 IMPORTANT NOTES

### Google Drive Permissions
- User must set Google Drive file to "Anyone with the link can view"
- If file is private, image won't load
- Show warning/hint to user

### Image Security
- Always validate URL format
- Use `onError` handler for fallback
- Consider CSP (Content Security Policy) implications

### Performance
- Google Drive CDN is fast
- Fallback image is lightweight placeholder
- No impact on build size

---

## 📝 SAMPLE CODE SNIPPETS

### Complete Image Input Component
```tsx
<div className="mb-4">
  <label className="block font-medium mb-2">Gambar Produk</label>
  
  {/* Toggle */}
  <div className="flex gap-2 mb-3">
    <button
      type="button"
      onClick={() => setImageMode('upload')}
      className={`px-4 py-2 rounded ${
        imageMode === 'upload'
          ? 'bg-green-500 text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      📄 Muat Naik
    </button>
    <button
      type="button"
      onClick={() => setImageMode('url')}
      className={`px-4 py-2 rounded ${
        imageMode === 'url'
          ? 'bg-green-500 text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      🔗 Pautan URL
    </button>
  </div>
  
  {/* Input */}
  {imageMode === 'upload' ? (
    <input
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      className="w-full"
    />
  ) : (
    <div>
      <input
        type="url"
        placeholder="Google Drive link atau URL imej"
        value={imageUrl}
        onChange={(e) => {
          const url = e.target.value;
          const converted = convertGoogleDriveUrl(url);
          setImageUrl(converted);
          setImagePreview(converted);
        }}
        className="w-full px-4 py-2 border rounded
          text-slate-900 dark:text-slate-900 bg-white
          placeholder:text-gray-400"
      />
      <p className="text-xs text-gray-500 mt-1">
        💡 Tip: Untuk Google Drive, pastikan fail di-set "Anyone with link can view"
      </p>
    </div>
  )}
  
  {/* Preview */}
  {imagePreview && (
    <div className="mt-3">
      <img
        src={imagePreview}
        alt="Preview"
        onError={handleImageError}
        className="max-w-xs rounded shadow"
      />
    </div>
  )}
</div>
```

### Complete Quantity Selector
```tsx
<div className="flex items-center gap-2">
  {item.quantity > 1 ? (
    <button
      onClick={() => removeFromCart(item.id)}
      className="w-8 h-8 rounded border bg-white hover:bg-gray-100"
      title="Kurangkan"
    >
      ➖
    </button>
  ) : (
    <button
      onClick={() => {
        if (confirm('🗑️ Buang item dari cart?')) {
          removeFromCart(item.id);
        }
      }}
      className="w-8 h-8 rounded border bg-red-50 text-red-600 hover:bg-red-100"
      title="Buang"
    >
      🗑️
    </button>
  )}
  
  <span className="w-12 text-center font-medium">
    {item.quantity}
  </span>
  
  <button
    onClick={() => addToCart(item)}
    className="w-8 h-8 rounded border bg-white hover:bg-gray-100"
    title="Tambah"
  >
    ➕
  </button>
</div>
```

---

## ✅ BUILD STATUS

```bash
$ npm run build

✓ Compiled successfully in 1816ms
✓ Running TypeScript ... Finished in 665ms
✓ Generating static pages (28/28)

Status: SUCCESS ✅
```

---

## 📝 SUMMARY

### What's Ready:
1. ✅ Image helper functions created
2. ✅ CartContext logic verified (already correct)
3. ✅ Onboarding form text contrast fixed
4. ✅ Build successful
5. ✅ Implementation guide complete

### What's Needed:
1. ⏳ Implement image URL toggle in ProductForm
2. ⏳ Implement image URL toggle in Profile QR
3. ⏳ Add confirmation UI for quantity = 1
4. ⏳ Fix text contrast in remaining forms

### Estimated Work:
- Image URL feature: 2-3 hours
- Quantity button UX: 1 hour
- Text contrast fix: 1-2 hours
- Testing: 1 hour

**Total:** 5-7 hours implementation

---

**Dikemaskini:** 30 Ogos 2026, 7:30 PM  
**Helper Functions:** READY ✅  
**Guide:** COMPLETE ✅  
**Build:** SUCCESS ✅

