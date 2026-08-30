# ⚠️ QR UPLOAD - BUCKET NAME UPDATE

**Date:** 30 Ogos 2026, 6:15 PM  
**Status:** CODE UPDATED - TESTING REQUIRED

---

## 🚨 CRITICAL: BUCKET NAME CHANGE

### ⚠️ IMPORTANT NOTICE

Kod telah dikemaskini untuk menggunakan bucket name **UPPERCASE**:

**Before:** `seller-qr` (lowercase)  
**After:** `SELLER-QR` (uppercase)

**Location:** `lib/storage/seller-qr.ts`

```typescript
const BUCKET_NAME = 'SELLER-QR'; // Updated to uppercase
```

---

## 🔍 VERIFICATION REQUIRED

### Step 1: Semak Supabase Dashboard

1. Login ke Supabase Dashboard: https://app.supabase.com
2. Pilih project: `ecortjyopjmintikurzq`
3. Navigate: **Storage → Buckets**
4. Check bucket name yang SEBENAR wujud:

   - [ ] `seller-qr` (lowercase) ← SQL schema original
   - [ ] `SELLER-QR` (uppercase) ← Code updated to this
   - [ ] Other name?

### Step 2: Update Code Jika Perlu

Jika bucket sebenarnya **lowercase** `seller-qr`:

**File:** `lib/storage/seller-qr.ts` (line 16)

```typescript
// Change from:
const BUCKET_NAME = 'SELLER-QR';

// Back to:
const BUCKET_NAME = 'seller-qr';
```

Jika bucket sebenarnya **uppercase** `SELLER-QR`:

**No changes needed** - kod sudah betul ✓

### Step 3: Update SQL Schema (Jika Perlu)

Jika anda mahukan bucket uppercase, update SQL:

**File:** `supabase/03_create_storage_buckets.sql`

```sql
-- Change all instances of 'seller-qr' to 'SELLER-QR'

-- Before:
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-qr', 'seller-qr', true);

-- After:
INSERT INTO storage.buckets (id, name, public)
VALUES ('SELLER-QR', 'SELLER-QR', true);

-- Update ALL policies too:
bucket_id = 'SELLER-QR' AND ...
```

Kemudian run SQL dalam Supabase SQL Editor.

---

## ✅ KEMASKINI YANG DILAKSANAKAN

### 1. Bucket Name Configuration

**File:** `lib/storage/seller-qr.ts`

```typescript
// BUCKET CONFIGURATION
const BUCKET_NAME = 'SELLER-QR'; // Centralized constant
```

**Benefits:**
- Single source of truth
- Easy to change (satu tempat sahaja)
- Clear documentation in code

**Usage:**
```typescript
supabase.storage.from(BUCKET_NAME).upload(...)
supabase.storage.from(BUCKET_NAME).getPublicUrl(...)
supabase.storage.from(BUCKET_NAME).remove(...)
```

---

### 2. Verbose Error Handling

**Enhanced Error Messages:**

```typescript
// Before:
error: 'Gagal memuat naik fail. Sila cuba lagi.'

// After:
error: 'Gagal memuat naik fail. Bucket not found → Bucket "SELLER-QR" tidak dijumpai. Semak Supabase Dashboard.'
```

**Error Types Displayed:**
- Bucket not found (with bucket name)
- RLS policy violation
- Payload too large
- JWT/Session expired
- Generic (with actual Supabase error.message)

**Console Output:**
```
❌ Upload error (FULL): { ... full JSON ... }
❌ Error message: Bucket not found
❌ Error name: StorageApiError
❌ Bucket used: SELLER-QR
```

---

### 3. User-Facing Error Alerts

**Onboarding & Profile:**

```typescript
alert(`⚠️ ERROR DETAIL:

Gagal memuat naik fail. Bucket not found → Bucket "SELLER-QR" tidak dijumpai.

Sila semak console (F12) untuk maklumat lanjut.`);
```

**Benefits:**
- User nampak actual error dari Supabase
- Directed to check console
- Error context preserved

---

### 4. Optimized Upload Settings

**File:** `lib/storage/seller-qr.ts`

```typescript
// Determine content type based on file
let contentType = 'image/jpeg'; // Default
if (file.type === 'image/png') contentType = 'image/png';
else if (file.type === 'image/webp') contentType = 'image/webp';

// Upload with explicit contentType
const { data, error } = await supabase.storage
  .from(BUCKET_NAME)
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: contentType, // ← ADDED
  });
```

**Benefits:**
- Explicit MIME type
- Proper browser handling
- Better caching behavior

---

### 5. Enhanced Logging

**Additional Logs:**

```
📤 Uploading to bucket: SELLER-QR
📄 File path: abc-123/qr-1725012345.jpg
📊 File size: 2.45 MB
🔧 File type: image/jpeg
✅ Upload successful: abc-123/qr-1725012345.jpg
🔗 Public URL: https://...
```

**Error Logs:**

```
❌ Upload error (FULL): { ...JSON... }
❌ Error message: Bucket not found
❌ Error name: StorageApiError  
❌ Bucket used: SELLER-QR
```

---

### 6. Delete Function Update

**File:** `lib/storage/seller-qr.ts`

```typescript
// Support both lowercase and uppercase in URL parsing
const urlParts = oldUrl.split(new RegExp(`/(seller-qr|SELLER-QR)/`, 'i'));

const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);

if (error) {
  console.error('❌ Delete error:', error);
} else {
  console.log('✅ Old QR deleted successfully');
}
```

---

## 📦 FILES MODIFIED

### Storage Layer:
```
lib/storage/seller-qr.ts
├─ BUCKET_NAME constant (line 16)
├─ Verbose error handling
├─ contentType explicit
├─ Enhanced logging (JSON.stringify)
├─ errorDetails in return
└─ Delete function updated
```

### UI Layer:
```
app/jualan/onboarding/page.tsx
├─ errorDetails logging
├─ Verbose alert messages
└─ "Semak console" instruction

app/jualan/profile/page.tsx
├─ errorDetails logging
├─ Verbose alert messages
└─ "Semak console" instruction
```

### Documentation:
```
QR_UPLOAD_BUCKET_UPDATE.md (this file)
```

**Total:** 4 files

---

## 🧪 TESTING PROCEDURE

### Test 1: Verify Bucket Name

```bash
# In Supabase SQL Editor:
SELECT id, name, public FROM storage.buckets;

# Expected result:
# id          | name        | public
# seller-qr   | seller-qr   | true   (if lowercase)
# SELLER-QR   | SELLER-QR   | true   (if uppercase)
```

### Test 2: Upload QR (Onboarding)

1. Open `/jualan/onboarding`
2. Fill form
3. Upload QR
4. **Open Console (F12)** BEFORE clicking submit
5. Watch for logs:
   - 📤 Uploading to bucket: SELLER-QR
   - If error: ❌ Upload error (FULL): {...}
6. Check alert message (if error)
7. Verify error shows actual Supabase message

### Test 3: Error Scenario - Wrong Bucket

If bucket sebenarnya `seller-qr` (lowercase) tetapi code guna `SELLER-QR`:

**Expected Error:**
```
❌ Upload error (FULL): { "statusCode": "404", "error": "Bucket not found", "message": "Bucket not found" }
❌ Error message: Bucket not found
❌ Bucket used: SELLER-QR

Alert:
⚠️ ERROR DETAIL:
Gagal memuat naik fail. Bucket not found → Bucket "SELLER-QR" tidak dijumpai. Semak Supabase Dashboard.
```

**Solution:** Change `BUCKET_NAME` in code to `'seller-qr'`

### Test 4: Success Scenario

**Expected Logs:**
```
📤 Starting QR upload...
👤 User ID: abc-123
📁 File: qr.jpg image/jpeg 245KB
📤 Uploading to bucket: SELLER-QR
📄 File path: abc-123/qr-1725012345.jpg
📊 File size: 0.24 MB
🔧 File type: image/jpeg
✅ Upload successful: abc-123/qr-1725012345.jpg
🔗 Public URL: https://ecortjyopjmintikurzq.supabase.co/storage/v1/object/public/SELLER-QR/...
✅ QR uploaded successfully
📝 Creating seller record...
✅ Seller registered successfully!
```

---

## 🔧 TROUBLESHOOTING

### Error: "Bucket not found"

**Cause:** Bucket name mismatch

**Check:**
1. Supabase Dashboard → Storage → Buckets
2. Note exact bucket name (case-sensitive)
3. Update `BUCKET_NAME` in `lib/storage/seller-qr.ts`

**Example:**
- Dashboard shows: `seller-qr` → use `const BUCKET_NAME = 'seller-qr';`
- Dashboard shows: `SELLER-QR` → use `const BUCKET_NAME = 'SELLER-QR';`

### Error: "RLS policy violation"

**Cause:** Policies masih reference bucket name lama

**Solution:**

Jika tukar bucket name, update policies:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Sellers can upload own QR" ON storage.objects;

-- Recreate with new bucket name
CREATE POLICY "Sellers can upload own QR"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'SELLER-QR' AND  -- Updated
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Error: "Invalid content type"

**Cause:** File type tidak disokong

**Solution:** Code sekarang auto-detect:
- JPEG → `image/jpeg`
- PNG → `image/png`
- WebP → `image/webp`

Jika masih error, semak `file.type` dalam console.

---

## 📝 SUMMARY

### Changes Made:

1. ✅ Bucket name centralized: `BUCKET_NAME = 'SELLER-QR'`
2. ✅ Verbose error messages (Supabase error.message displayed)
3. ✅ contentType explicit in upload
4. ✅ errorDetails returned in UploadResult
5. ✅ Console logs enhanced (JSON.stringify)
6. ✅ User alerts show full error
7. ✅ Delete function updated for both cases

### Action Required:

⚠️ **VERIFY BUCKET NAME IN SUPABASE DASHBOARD**

1. Check Storage → Buckets
2. Note exact name (case-sensitive)
3. Update `BUCKET_NAME` if needed
4. Test upload
5. Check console for errors

### Build Status:

⏳ **PENDING** - Run `npm run build`

---

**Dikemaskini:** 30 Ogos 2026, 6:15 PM  
**Status:** CODE UPDATED, TESTING REQUIRED  
**Next:** Verify bucket name + test upload

