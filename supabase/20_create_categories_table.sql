-- ============================================
-- SAJIAN SEMATANG - CREATE CATEGORIES TABLE
-- ============================================
-- Migration untuk jadual categories dan RLS policies
-- Tarikh: 6 September 2026
-- Versi: 1.0
-- ============================================

-- BAHAGIAN 1: SIASAT KEWUJUDAN JADUAL CATEGORIES
-- ============================================

-- Periksa jika jadual categories sudah wujud
DO $$
BEGIN
    -- Check if categories table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
    ) THEN
        RAISE NOTICE 'Jadual categories belum wujud. Meneruskan pembinaan...';
    ELSE
        RAISE NOTICE 'Jadual categories sudah wujud. Melangkau pembinaan table...';
    END IF;
END $$;

-- ============================================
-- BAHAGIAN 2: CIPTA JADUAL CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BAHAGIAN 3: CREATE INDEXES UNTUK PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON public.categories(created_by);

-- ============================================
-- BAHAGIAN 4: SEED DATA AWAL (KATEGORI ASAS)
-- ============================================

-- Masukkan kategori asas hanya jika belum wujud
DO $$
DECLARE
    v_default_user_id UUID;
    v_categories TEXT[] := ARRAY['Makanan', 'Minuman', 'Kuih-Muih', 'Snek', 'Pencuci Mulut'];
    v_category TEXT;
BEGIN
    -- Dapatkan ID admin pertama sebagai created_by default
    SELECT id INTO v_default_user_id 
    FROM public.users 
    WHERE role = 'admin' AND is_active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Jika tiada admin, gunakan user pertama yang wujud
    IF v_default_user_id IS NULL THEN
        SELECT id INTO v_default_user_id 
        FROM public.users 
        ORDER BY created_at 
        LIMIT 1;
    END IF;
    
    -- Insert kategori asas
    FOREACH v_category IN ARRAY v_categories
    LOOP
        INSERT INTO public.categories (name, description, created_by, created_at, updated_at)
        VALUES (
            v_category,
            'Kategori ' || v_category || ' untuk produk',
            v_default_user_id,
            NOW(),
            NOW()
        )
        ON CONFLICT (name) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Seed data kategori asas berjaya dimasukkan atau telah wujud.';
END $$;

-- ============================================
-- BAHAGIAN 5: KEMASKINI JADUAL PRODUCTS UNTUK INTEGRASI
-- ============================================

-- **CATATAN PENTING**: 
-- Jadual products sedia ada menggunakan column `category` (TEXT) 
-- yang menyimpan nama kategori sebagai string.
-- Untuk integrasi dengan jadual categories yang baru, kita perlu:
-- 1. Pastikan nama kategori dalam products sepadan dengan nama dalam categories
-- 2. Atau, migrate ke foreign key relationship pada masa hadapan

-- Untuk sekarang, kita hanya akan tambah trigger untuk konsistensi
CREATE OR REPLACE FUNCTION public.ensure_category_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika category diisi dalam product, pastikan ia wujud dalam jadual categories
    IF NEW.category IS NOT NULL AND NEW.category != '' THEN
        INSERT INTO public.categories (name, created_at, updated_at)
        VALUES (NEW.category, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger untuk produk baru (jika belum wujud)
DROP TRIGGER IF EXISTS ensure_category_trigger ON public.products;
CREATE TRIGGER ensure_category_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_category_exists();

-- ============================================
-- BAHAGIAN 6: AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BAHAGIAN 7: POLISI RLS UNTUK CATEGORIES
-- ============================================

-- 7.1 Policy SELECT: Semua pengguna boleh membaca senarai kategori aktif
CREATE POLICY "categories_select_all"
    ON public.categories
    FOR SELECT
    USING (is_active = true);

-- 7.2 Policy INSERT: Hanya admin dan staff boleh menambah kategori baru
CREATE POLICY "categories_insert_admin_staff"
    ON public.categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
            AND is_active = true
        )
    );

-- 7.3 Policy UPDATE: Hanya admin dan staff boleh mengemaskini kategori
CREATE POLICY "categories_update_admin_staff"
    ON public.categories
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
            AND is_active = true
        )
    );

-- 7.4 Policy DELETE: Hanya admin sahaja boleh memadam kategori
CREATE POLICY "categories_delete_admin_only"
    ON public.categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- ============================================
-- BAHAGIAN 8: HELPER FUNCTIONS UNTUK RLS
-- ============================================

-- Function untuk check jika user adalah admin (jika belum wujud)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk check jika user adalah admin atau staff (jika belum wujud)
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BAHAGIAN 9: VALIDATION & CLEANUP
-- ============================================

-- Update timestamps untuk existing categories (jika ada)
UPDATE public.categories 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Set default created_by untuk records yang tiada created_by
UPDATE public.categories c
SET created_by = (
    SELECT id FROM public.users 
    WHERE role = 'admin' AND is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE created_by IS NULL;

-- Pastikan semua categories aktif secara default
UPDATE public.categories 
SET is_active = true 
WHERE is_active IS NULL;

-- ============================================
-- BAHAGIAN 10: TEST QUERIES (boleh diabaikan selepas verification)
-- ============================================

/*
-- Untuk testing: Semak jika jadual categories wujud dan mempunyai data
SELECT 
    'categories' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM public.categories WHERE is_active = true) as active_categories
FROM public.categories;

-- Semak integrasi dengan products
SELECT 
    p.category,
    COUNT(p.id) as product_count,
    CASE 
        WHEN c.id IS NOT NULL THEN 'ADA DALAM CATEGORIES'
        ELSE 'TIADA DALAM CATEGORIES'
    END as status
FROM public.products p
LEFT JOIN public.categories c ON p.category = c.name
WHERE p.category IS NOT NULL AND p.category != ''
GROUP BY p.category, c.id
ORDER BY product_count DESC;
*/

-- ============================================
-- BAHAGIAN 11: MIGRATION COMPLETE NOTIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRATION CATEGORIES BERJAYA!';
    RAISE NOTICE 'Jadual: public.categories';
    RAISE NOTICE 'RLS: Diaktifkan dengan 4 policies';
    RAISE NOTICE 'Seed Data: 5 kategori asas';
    RAISE NOTICE 'Trigger: ensure_category_exists()';
    RAISE NOTICE '============================================';
END $$;