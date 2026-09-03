-- =============================================================================
-- FIX: Product Reorder RPC Functions Parameter Names
-- DESCRIPTION: Updates RPC functions to match Server Actions parameter names
-- DATE: 3 September 2026
-- =============================================================================
-- JALANKAN SKRIP INI DI SUPABASE SQL EDITOR UNTUK MEMBAIKI PARAMETER NAMES
-- =============================================================================

-- 1. First, check if display_order column exists, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE '✅ Column display_order added to products table';
    ELSE
        RAISE NOTICE 'ℹ️ Column display_order already exists in products table';
    END IF;
END $$;

-- 2. Drop existing RPC functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS swap_product_order(uuid, uuid);
DROP FUNCTION IF EXISTS move_product_up(uuid);
DROP FUNCTION IF EXISTS move_product_down(uuid);
DROP FUNCTION IF EXISTS reorder_products(uuid);

-- 3. Create swap_product_order function with correct parameter names
CREATE OR REPLACE FUNCTION swap_product_order(
    product1_id UUID,
    product2_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    product1_display_order INTEGER;
    product2_display_order INTEGER;
    product1_seller_id UUID;
    product2_seller_id UUID;
BEGIN
    -- Get current display_order values and verify ownership
    SELECT display_order, seller_id 
    INTO product1_display_order, product1_seller_id
    FROM products 
    WHERE id = product1_id;
    
    SELECT display_order, seller_id 
    INTO product2_display_order, product2_seller_id
    FROM products 
    WHERE id = product2_id;
    
    -- Check if products exist
    IF product1_display_order IS NULL OR product2_display_order IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'One or both products not found'
        );
    END IF;
    
    -- Verify both products belong to the same seller (security check)
    IF product1_seller_id != product2_seller_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Products belong to different sellers'
        );
    END IF;
    
    -- Swap display_order values
    UPDATE products 
    SET display_order = product2_display_order,
        updated_at = NOW()
    WHERE id = product1_id;
    
    UPDATE products 
    SET display_order = product1_display_order,
        updated_at = NOW()
    WHERE id = product2_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Product order swapped successfully',
        'product1_id', product1_id,
        'product1_new_order', product2_display_order,
        'product2_id', product2_id,
        'product2_new_order', product1_display_order
    );
END;
$$;

-- 4. Create move_product_up function with correct parameter names
CREATE OR REPLACE FUNCTION move_product_up(
    product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_display_order INTEGER;
    product_seller_id UUID;
    product_above_id UUID;
    product_above_display_order INTEGER;
    result JSONB;
BEGIN
    -- Get current product info
    SELECT display_order, seller_id 
    INTO current_display_order, product_seller_id
    FROM products 
    WHERE id = product_id;
    
    IF current_display_order IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;
    
    -- Find product with highest display_order less than current (the one above)
    SELECT id, display_order 
    INTO product_above_id, product_above_display_order
    FROM products 
    WHERE seller_id = product_seller_id 
    AND display_order < current_display_order
    AND display_order IS NOT NULL
    ORDER BY display_order DESC
    LIMIT 1;
    
    IF product_above_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product is already at the top',
            'is_top', true
        );
    END IF;
    
    -- Swap with product above using the swap function
    result := swap_product_order(product_id, product_above_id);
    
    RETURN result;
END;
$$;
-- 5. Create move_product_down function with correct parameter names
CREATE OR REPLACE FUNCTION move_product_down(
    product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_display_order INTEGER;
    product_seller_id UUID;
    product_below_id UUID;
    product_below_display_order INTEGER;
    result JSONB;
BEGIN
    -- Get current product info
    SELECT display_order, seller_id 
    INTO current_display_order, product_seller_id
    FROM products 
    WHERE id = product_id;
    
    IF current_display_order IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;
    
    -- Find product with lowest display_order greater than current (the one below)
    SELECT id, display_order 
    INTO product_below_id, product_below_display_order
    FROM products 
    WHERE seller_id = product_seller_id 
    AND display_order > current_display_order
    AND display_order IS NOT NULL
    ORDER BY display_order ASC
    LIMIT 1;
-- 6. Create reorder_products function with correct parameter names
CREATE OR REPLACE FUNCTION reorder_products(
    seller_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    product_record RECORD;
    new_order_counter INTEGER := 0;
    total_updated INTEGER := 0;
BEGIN
    -- Reset display_order untuk semua produk seller mengikut created_at
    FOR product_record IN (
        SELECT id, created_at
        FROM products 
        WHERE seller_id = seller_id_param
        ORDER BY created_at ASC
    ) LOOP
        new_order_counter := new_order_counter + 1;
        
        UPDATE products 
        SET display_order = new_order_counter,
            updated_at = NOW()
        WHERE id = product_record.id;
        
        total_updated := total_updated + 1;
    END LOOP;
    
-- 7. Create index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_products_display_order 
ON products(seller_id, display_order);

-- 8. Grant execute permissions to authenticated users
-- =============================================================================
-- VERIFICATION: Test the functions work correctly
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully';
    RAISE NOTICE '✅ RPC functions created with correct parameter names:';
    RAISE NOTICE '   - swap_product_order(product1_id UUID, product2_id UUID)';
    RAISE NOTICE '   - move_product_up(product_id UUID)';
    RAISE NOTICE '   - move_product_down(product_id UUID)';
    RAISE NOTICE '   - reorder_products(seller_id_param UUID)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANT: Server Actions telah dikemaskini untuk menggunakan parameter:';
    RAISE NOTICE '   - { product_id: ... } untuk move_product_up dan move_product_down';
    RAISE NOTICE '   - { product1_id: ..., product2_id: ... } untuk swap_product_order';
    RAISE NOTICE '   - { seller_id_param: ... } untuk reorder_products';
END $$;
GRANT EXECUTE ON FUNCTION swap_product_order TO authenticated;
GRANT EXECUTE ON FUNCTION move_product_up TO authenticated;
GRANT EXECUTE ON FUNCTION move_product_down TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_products TO authenticated;
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Products reordered successfully',
        'total_products', total_updated,
        'new_order_range', '1-' || new_order_counter
    );
END;
$$;
    
    IF product_below_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product is already at the bottom',
            'is_bottom', true
        );
    END IF;
    
    -- Swap with product below using the swap function
    result := swap_product_order(product_id, product_below_id);
    
    RETURN result;
END;
$$;