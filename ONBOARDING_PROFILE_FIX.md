# ✅ ONBOARDING & PROFILE FIX - CRITICAL ISSUES RESOLVED

**Date:** 30 Ogos 2026, 7:00 PM  
**Status:** COMPLETE & BUILD SUCCESS ✅  
**Build:** 28 pages, TypeScript passed (1813ms compile, 727ms TypeScript)

---

## 🚨 CRITICAL FIXES

### 1. ✅ FIXED: NULL VALUE IN COLUMN "NAME" ERROR

**Problem:**
```
ERROR: null value in column "name" of relation "sellers" violates not-null constraint
```

**Root Cause:**
- Code was inserting `shop_name` only
- Database expects `name` column (used by RLS/views)
- `name` column has NOT NULL constraint

**Solution:**

**A. Code Fix (`app/jualan/onboarding/page.tsx`):**
```typescript
// BEFORE:
insert({
  shop_name: formData.shop_name.trim(),
  // name missing!
})

// AFTER:
insert({
  name: formData.shop_name.trim(),       // FIXED: Added
  shop_name: formData.shop_name.trim(),  // Keep for compatibility
})
```

**B. Database Fix (`supabase/fix_sellers_name_column.sql`):**
```sql
-- Add 'name' column if missing
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS name text;

-- Populate from shop_name
UPDATE public.sellers SET name = shop_name WHERE name IS NULL;

-- Set NOT NULL
ALTER TABLE public.sellers ALTER COLUMN name SET NOT NULL;

-- Create sync trigger (name ⇔ shop_name)
CREATE TRIGGER sync_seller_name_trigger
BEFORE INSERT OR UPDATE ON public.sellers
FOR EACH ROW EXECUTE FUNCTION sync_seller_name();
```

**Benefits:**
- ✅ No more NULL constraint violations
- ✅ Both `name` and `shop_name` supported
- ✅ Auto-sync via trigger
- ✅ Backward compatible with existing code

---

### 2. ✅ QR UPLOAD REMOVED FROM ONBOARDING

**Changes:**

**A. Removed Components:**
- ❌ `const [qrFile, setQrFile]` - State removed
- ❌ `const [qrPreview, setQrPreview]` - State removed  
- ❌ `handleQRFileChange()` - Function removed (98 lines)
- ❌ `compressImage()` - Function removed (54 lines)
- ❌ QR upload JSX section - Removed (54 lines)
- ❌ `import { uploadSellerQR }` - Import removed

**B. Simplified Insert:**
```typescript
// QR upload logic completely removed
insert({
  ...
  duitnow_qr_url: null,  // Always NULL on onboarding
})
```

**C. User Notice Added:**
```jsx
<div className="mb-6 border-t pt-6">
  <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
    ℹ️ <strong>Muat naik QR DuitNow</strong> boleh dilakukan kemudian 
    di halaman <strong>Profil Kedai</strong> selepas pendaftaran selesai.
  </p>
</div>
```

**Result:**
- Onboarding form now SIMPLER
- Focus on essential info (shop + bank)
- QR can be uploaded later in profile

---

### 3. ✅ BUCKET NAME FIXED - BACK TO LOWERCASE

**File:** `lib/storage/seller-qr.ts`

```typescript
// BEFORE:
const BUCKET_NAME = 'SELLER-QR'; // Uppercase

// AFTER:
const BUCKET_NAME = 'seller-qr'; // Lowercase - original setup
```

**Why:**
- SQL schema creates `'seller-qr'` (lowercase)
- Storage policies reference `'seller-qr'` (lowercase)
- Uppercase was causing "Bucket not found" errors

**Status:** ✅ Aligned with SQL schema

---

## 📦 FILES MODIFIED

### 1. Onboarding Form (MAJOR CHANGES)
**`app/jualan/onboarding/page.tsx`**

**Removed:**
- QR upload state (2 variables)
- QR upload functions (2 functions, 152 lines)
- QR upload JSX (54 lines)
- uploadSellerQR import

**Added:**
- `name` field in insert (CRITICAL FIX)
- Info notice for QR upload in profile

**Total:** ~200 lines removed, cleaner code

### 2. Storage Helper (BUCKET FIX)
**`lib/storage/seller-qr.ts`**

**Changed:**
```diff
- const BUCKET_NAME = 'SELLER-QR';
+ const BUCKET_NAME = 'seller-qr';
```

### 3. SQL Migration (NEW)
**`supabase/fix_sellers_name_column.sql`** (NEW FILE)

**Features:**
- Check if `name` column exists
- Add column if missing
- Populate from `shop_name`
- Set NOT NULL constraint
- Create sync trigger
- Verification queries

### 4. Documentation (NEW)
**`ONBOARDING_PROFILE_FIX.md`** (this file)

**Total:** 3 files modified, 2 files created

---

## 🔧 IMMEDIATE ACTIONS REQUIRED

### ⚠️ Step 1: Run SQL Migration

**CRITICAL:** Execute this BEFORE testing onboarding

**Supabase Dashboard → SQL Editor:**

```sql
-- File: supabase/fix_sellers_name_column.sql
-- Copy entire content and execute
```

**What it does:**
1. Adds `name` column to sellers table
2. Populates from existing `shop_name` values
3. Sets NOT NULL constraint
4. Creates auto-sync trigger
5. Shows verification results

**Expected Output:**
```
✅ Column "name" added to sellers table

column_name | data_type | is_nullable
------------|-----------|-------------
name        | text      | NO
shop_name   | text      | YES

id | name | shop_name | status
---|------|-----------|----------
...| ...  | ...       | ✅ Synced
```

---

### Step 2: Test Onboarding Flow

**Test New Seller Registration:**

1. Navigate to `/jualan/onboarding`
2. Fill required fields:
   - ✅ Nama Kedai
   - ✅ Keterangan (optional)
   - ✅ Nombor Telefon (optional)
   - ✅ Nama Bank
   - ✅ Nombor Akaun Bank
   - ✅ Nama Pemegang Akaun
3. **DO NOT upload QR** (component removed)
4. Click "Daftar Kedai Saya"
5. Should succeed → redirect to `/jualan`

**Check Database:**
```sql
SELECT 
  name,
  shop_name,
  bank_name,
  bank_account_number,
  account_holder_name,
  duitnow_qr_url
FROM sellers
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- name: [shop name] ✓
-- shop_name: [shop name] ✓
-- bank_name: [bank] ✓
-- bank_account_number: [account] ✓
-- account_holder_name: [holder] ✓
-- duitnow_qr_url: NULL ✓
```

---

### Step 3: Test QR Upload in Profile

**Upload QR After Registration:**

1. Login as seller (just registered)
2. Navigate to `/jualan/profile`
3. Scroll to "QR DuitNow" section
4. Click "Pilih Fail QR" or "Upload New QR"
5. Select QR image (JPEG/PNG/WebP)
6. Click "Simpan Perubahan"
7. Should succeed → QR URL updated

**Check Database:**
```sql
SELECT duitnow_qr_url 
FROM sellers 
WHERE user_id = '[your-user-id]';

-- Expected:
-- duitnow_qr_url: https://...seller-qr/[user-id]/qr-...
```

**Check Storage:**
- Supabase Dashboard → Storage → `seller-qr` bucket
- Should see: `[user-id]/qr-[timestamp].jpg`

---

## 📊 ONBOARDING FLOW COMPARISON

### BEFORE (Broken):
```
1. Fill shop info
2. Fill bank info
3. Upload QR (optional but component present)
4. Submit → ❌ ERROR: null value in column "name"
```

### AFTER (Fixed):
```
1. Fill shop info
2. Fill bank info
3. See notice: "Upload QR later in profile"
4. Submit → ✅ SUCCESS
5. Redirect to /jualan
6. (Later) Go to Profile → Upload QR
```

**Benefits:**
- ✅ Simpler onboarding (less steps)
- ✅ No QR upload errors during registration
- ✅ Seller can focus on essential info first
- ✅ QR upload done after exploring dashboard

---

## 📝 TECHNICAL DETAILS

### Database Schema (sellers table):

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | uuid_generate_v4() | PK |
| user_id | uuid | NO | - | FK to users |
| **name** | **text** | **NO** | **-** | **FIXED** |
| shop_name | text | YES | - | Compat |
| description | text | YES | NULL | Optional |
| phone_number | text | YES | NULL | Optional |
| bank_name | text | YES | NULL | Required at app level |
| bank_account_number | text | YES | NULL | Required at app level |
| account_holder_name | text | YES | NULL | Required at app level |
| duitnow_qr_url | text | YES | NULL | Optional |
| created_at | timestamptz | NO | now() | Auto |
| updated_at | timestamptz | YES | now() | Auto |

### Insert Data (Onboarding):

```typescript
supabase
  .from('sellers')
  .insert({
    user_id: user.id,
    name: formData.shop_name.trim(),        // ✅ CRITICAL
    shop_name: formData.shop_name.trim(),   // ✅ Compatibility
    description: formData.description.trim() || null,
    phone_number: formData.phone_number.trim() || null,
    bank_name: formData.bank_name.trim(),
    bank_account_number: formData.bank_account_number.trim(),
    account_holder_name: formData.account_holder_name.trim(),
    duitnow_qr_url: null,  // ✅ Always NULL on onboarding
  })
```

### Sync Trigger Logic:

```sql
CREATE OR REPLACE FUNCTION sync_seller_name()
RETURNS TRIGGER AS $$
BEGIN
  -- name → shop_name
  IF NEW.name IS NOT NULL AND NEW.shop_name IS NULL THEN
    NEW.shop_name := NEW.name;
  END IF;
  
  -- shop_name → name
  IF NEW.shop_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.shop_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Ensures:** `name` and `shop_name` always synced

---

## ✅ BUILD STATUS

```bash
$ npm run build

✓ Compiled successfully in 1813ms
✓ Running TypeScript ... Finished in 727ms
✓ Generating static pages (28/28) in 489ms

Routes:
✓ /jualan/onboarding    ← FIXED
✓ /jualan/profile       ← QR upload ready
... (28 pages total)

Status: SUCCESS ✅
TypeScript: PASSED ✅
Build Errors: 0 ✅
```

---

## 📝 SUMMARY

### Critical Fixes Completed:

1. ✅ **Column mapping fixed** - `name` field now included in insert
2. ✅ **SQL migration created** - Adds `name` column with sync trigger
3. ✅ **QR upload removed** from onboarding (206 lines cleaned)
4. ✅ **Bucket name fixed** - Back to lowercase `seller-qr`
5. ✅ **User experience improved** - Simpler onboarding flow
6. ✅ **Build successful** - No TypeScript errors
7. ✅ **Documentation complete** - Full guide provided

### Action Required:

⚠️ **RUN SQL MIGRATION FIRST**

```sql
-- File: supabase/fix_sellers_name_column.sql
-- Execute in Supabase SQL Editor BEFORE testing
```

### Testing Required:

1. Run SQL migration
2. Test seller onboarding (without QR)
3. Test QR upload in profile page
4. Verify database records
5. Check bucket storage

---

**Dikemaskini:** 30 Ogos 2026, 7:00 PM  
**Build:** SUCCESS (1813ms compile)  
**Status:** READY FOR TESTING ✅

**🚀 CRITICAL: SQL MIGRATION REQUIRED BEFORE USE**

