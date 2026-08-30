# QR Upload Fix Documentation

**Date:** 30 Ogos 2026  
**Issue:** QR DuitNow upload gagal

---

## ✅ KEMASKINI YANG DILAKSANAKAN

### 1. NAMA BUCKET - VERIFIED ✓

**Bucket Name:** `seller-qr` (lowercase)

**Source:** `/supabase/03_create_storage_buckets.sql`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-qr', 'seller-qr', true)
```

**Status:** 
- ✅ Nama bucket adalah **lowercase** `seller-qr`
- ✅ Semua code menggunakan nama yang betul
- ✅ Bucket adalah PUBLIC bucket

---

### 2. DETAILED ERROR MESSAGES ✓

**File:** `lib/storage/seller-qr.ts`

**Error Types Handled:**
- ✅ Bucket not found
- ✅ RLS policy violation  
- ✅ Payload too large
- ✅ JWT/Auth errors
- ✅ Generic errors (with actual message)

---

### 3. ENHANCED LOGGING ✓

**Console Logs Added:**

- `lib/storage/seller-qr.ts`: Upload bucket, file path, size, status
- `app/jualan/onboarding/page.tsx`: User ID, file details, upload result
- `app/jualan/profile/page.tsx`: Seller ID, file details, update result

---

### 4. UPSERT MODE ✓

**Changed:** `upsert: false` → `upsert: true`

**Benefit:** Seller boleh upload QR baharu tanpa error jika file exists.

---

### 5. FILE SIZE LIMIT ✓

**Updated:**
- ✅ Onboarding: 10MB (selepas compression)
- ✅ Profile: 10MB (updated from 5MB)
- ✅ Storage function: 10MB validation

**Consistent across all files.**

---

### 6. ALERT FOR CRITICAL ERRORS ✓

**onboarding/page.tsx:**
```typescript
if (errorMessage.includes('Bucket') || errorMessage.includes('kebenaran')) {
  alert(`⚠️ ${errorMessage}`);
}
```

---

## 📋 TROUBLESHOOTING CHECKLIST

### A. Verify Bucket Exists

**Supabase Dashboard:**
1. Storage → Buckets
2. Check if `seller-qr` exists
3. Verify it's PUBLIC

**SQL Query:**
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'seller-qr';
```

### B. Verify RLS Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects';
```

**Expected:**
- Sellers can upload own QR (INSERT)
- Sellers can update own QR (UPDATE)  
- Sellers can delete own QR (DELETE)
- Anyone can view QR (SELECT)

### C. Common Error Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Bucket not found` | Bucket tidak wujud | Run SQL setup |
| `RLS violation` | Policy gagal | Verify user auth |
| `JWT expired` | Session tamat | Login semula |
| `payload too large` | File > 10MB | Reduce size |

---

## 🔍 DEBUG MODE

**Enable:** Open browser DevTools (F12) → Console

**Expected upload flow:**
```
📤 Starting QR upload...
👤 User ID: abc-123-xyz
📁 File: qr-duitnow.jpg image/jpeg 245.67KB
📤 Uploading to bucket: seller-qr
📄 File path: abc-123-xyz/qr-1725012345678.jpg
✅ Upload successful
✅ QR uploaded successfully
```

**If error:**
```
❌ Upload error: [details]
❌ Upload failed: [user-friendly message]
```

---

## 📦 FILES UPDATED

1. ✅ `lib/storage/seller-qr.ts` (detailed errors, logging, upsert)
2. ✅ `app/jualan/onboarding/page.tsx` (logging, alerts)
3. ✅ `app/jualan/profile/page.tsx` (logging, 10MB limit)
4. ✅ `QR_UPLOAD_FIX.md` (this file)

---

## 🚀 TESTING PROCEDURE

### 1. Test Onboarding Upload
- [ ] Login user baharu
- [ ] Navigate `/jualan/onboarding`
- [ ] Upload QR (various sizes)
- [ ] Check console logs
- [ ] Verify in database & storage

### 2. Test Profile Update  
- [ ] Login existing seller
- [ ] Navigate `/jualan/profile`
- [ ] Upload new QR
- [ ] Verify old deleted, new uploaded

### 3. Test Error Scenarios
- [ ] File > 10MB → reject
- [ ] Non-image → reject
- [ ] Logged out → auth error

### 4. Test File Formats
- [ ] JPEG (.jpg, .jpeg) ✓
- [ ] PNG (.png) ✓
- [ ] WebP (.webp) ✓
- [ ] GIF (.gif) ✗

---

## 🔧 IF STILL FAILING

1. Verify bucket exists in Supabase Dashboard
2. Re-run `03_create_storage_buckets.sql`
3. Check anon key permissions
4. Test with different file/browser
5. Check network tab for actual error

---

**Status:** READY FOR TESTING ✅  
**Build:** Pending

