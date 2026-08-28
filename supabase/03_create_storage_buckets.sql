-- Phase R3A: Create Supabase Storage Buckets
-- Created: 28/08/2026

-- ============================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================

-- Seller QR Bucket (for DuitNow QR codes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-qr', 'seller-qr', true)
ON CONFLICT (id) DO NOTHING;

-- Product Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES: seller-qr
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Sellers can upload own QR" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can update own QR" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete own QR" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view QR" ON storage.objects;

-- Policy: Sellers can upload QR to their own folder
CREATE POLICY "Sellers can upload own QR"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'seller-qr' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Sellers can update their own QR
CREATE POLICY "Sellers can update own QR"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'seller-qr' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Sellers can delete their own QR
CREATE POLICY "Sellers can delete own QR"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'seller-qr' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admin can view all QRs (for payment verification)
CREATE POLICY "Admin can view all QR"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'seller-qr' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Public can view QR (bucket is public)
CREATE POLICY "Anyone can view QR"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-qr');

-- ============================================
-- 3. STORAGE POLICIES: product-images
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- Policy: Sellers can upload product images
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.sellers
    WHERE user_id = auth.uid()
  )
);

-- Policy: Sellers can update product images
CREATE POLICY "Sellers can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.sellers
    WHERE user_id = auth.uid()
  )
);

-- Policy: Sellers can delete product images
CREATE POLICY "Sellers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.sellers
    WHERE user_id = auth.uid()
  )
);

-- Policy: Public can view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- ============================================
-- VERIFICATION
-- ============================================

-- Check buckets created
SELECT id, name, public FROM storage.buckets
WHERE id IN ('seller-qr', 'product-images');

-- Check policies created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%seller%' OR policyname LIKE '%product%' OR policyname LIKE '%QR%';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Storage buckets and policies created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Buckets:';
  RAISE NOTICE '  - seller-qr (public)';
  RAISE NOTICE '  - product-images (public)';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies:';
  RAISE NOTICE '  - Sellers can upload/update/delete own QR';
  RAISE NOTICE '  - Sellers can upload/update/delete product images';
  RAISE NOTICE '  - Public can view all images';
  RAISE NOTICE '  - Admin can view all QRs';
END $$;
