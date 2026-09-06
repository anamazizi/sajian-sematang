-- ============================================
-- SAJIAN SEMATANG - FIX CATEGORIES RLS POLICIES
-- ============================================
-- Skrip untuk memastikan policy SELECT membenarkan semua pengguna membaca kategori
-- Tarikh: 6 September 2026
-- Versi: 1.0
-- ============================================

-- BAHAGIAN 1: PERIKSA DAN KEMASKINI POLICY SELECT
-- ============================================

-- Drop existing SELECT policy jika wujud
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;

-- Buat policy SELECT baru yang lebih permisif untuk debugging
CREATE POLICY "categories_select_all"
    ON public.categories
    FOR SELECT
    USING (true); -- Benarkan semua kategori dilihat oleh semua pengguna

-- Nota: Untuk production, kita mungkin mahu kembali ke `USING (is_active = true)`
-- tetapi untuk debugging, kita guna `USING (true)` untuk pastikan data boleh dibaca

-- ============================================
-- BAHAGIAN 2: VERIFIKASI POLICY
-- ============================================

-- Semak semua policies untuk jadual categories
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'categories'
ORDER BY policyname;

-- ============================================
-- BAHAGIAN 3: TEST QUERY UNTUK VERIFICATION
-- ============================================

/*
-- Test 1: Semak jika jadual categories boleh dibaca
SELECT 
    'Test SELECT' as test_type,
    COUNT(*) as category_count
FROM public.categories;

-- Test 2: Semak jika admin boleh insert
-- (Perlu login sebagai admin untuk test ini)
INSERT INTO public.categories (name, description, is_active)
VALUES ('Test Category', 'Test description', true)
ON CONFLICT (name) DO NOTHING;

-- Test 3: Semak jika semua pengguna boleh baca kategori tidak aktif
UPDATE public.categories 
SET is_active = false 
WHERE name = 'Test Category'
RETURNING id, name, is_active;

SELECT * FROM public.categories WHERE name = 'Test Category';
*/

-- ============================================
-- BAHAGIAN 4: MIGRATION COMPLETE NOTIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'RLS FIX BERJAYA!';
    RAISE NOTICE 'Policy SELECT diupdated: USING (true)';
    RAISE NOTICE 'Semua pengguna kini boleh membaca semua kategori';
    RAISE NOTICE '============================================';
END $$;