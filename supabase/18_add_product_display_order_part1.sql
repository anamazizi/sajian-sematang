-- ============================================
-- SAJIAN SEMATANG - ADD DISPLAY_ORDER TO PRODUCTS
-- Version 1.0 (03/09/2026)
-- ============================================
-- Skrip ini menambah column display_order untuk 
-- menyusun kedudukan produk di halaman peniaga
-- ============================================

-- Tambah display_order column ke table products
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing records dengan sequential order berdasarkan created_at
-- Pastikan display_order unik untuk setiap seller
WITH numbered_products AS (
  SELECT 
    id,
    seller_id,
    ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY created_at ASC) as new_order
  FROM public.products
  WHERE display_order IS NULL OR display_order = 0
)
UPDATE public.products p
SET display_order = np.new_order
FROM numbered_products np
WHERE p.id = np.id;

-- Create index untuk performance
CREATE INDEX IF NOT EXISTS idx_products_display_order 
  ON public.products(seller_id, display_order);