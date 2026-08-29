-- ========================================
-- SAJIAN SEMATANG - SEED DATA FOR TESTING
-- ========================================
-- Purpose: Create sample sellers and products for Phase R4C Cart Context testing
-- Run this in Supabase SQL Editor AFTER running all migrations
-- ========================================

-- WARNING: This will create test data. Do not run in production!

DO $$
DECLARE
  -- User IDs (using dummy UUIDs - replace with real auth.users IDs if needed)
  seller1_user_id UUID := '00000000-0000-0000-0000-000000000001';
  seller2_user_id UUID := '00000000-0000-0000-0000-000000000002';
  seller3_user_id UUID := '00000000-0000-0000-0000-000000000003';
  
  -- Seller IDs
  seller1_id UUID;
  seller2_id UUID;
  seller3_id UUID;

BEGIN
  -- ========================================
  -- 1. CREATE SAMPLE USERS (SELLERS)
  -- ========================================
  -- Note: In real app, users come from Supabase Auth (Google OAuth)
  -- For testing, we create dummy user records
  
  INSERT INTO public.users (id, name, email, role, created_at)
  VALUES 
    (seller1_user_id, 'Warung Kak Siti', 'kaksiti@test.com', 'seller', NOW()),
    (seller2_user_id, 'Restoran Pak Ahmad', 'pakahmad@test.com', 'seller', NOW()),
    (seller3_user_id, 'Kedai Makan Azizah', 'azizah@test.com', 'seller', NOW())
  ON CONFLICT (id) DO NOTHING; -- Skip if already exists

  RAISE NOTICE '✅ Sample users created';

  -- ========================================
  -- 2. CREATE SELLERS (with existence check)
  -- ========================================
  
  -- Check and insert Seller 1
  IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE user_id = seller1_user_id) THEN
    INSERT INTO public.sellers (user_id, shop_name, description, phone_number, created_at)
    VALUES (
      seller1_user_id,
      'Warung Kak Siti',
      'Nasi lemak dan lauk-pauk tradisional. Sedap macam masakan mak!',
      '0123456789',
      NOW()
    );
  END IF;
  
  -- Check and insert Seller 2
  IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE user_id = seller2_user_id) THEN
    INSERT INTO public.sellers (user_id, shop_name, description, phone_number, created_at)
    VALUES (
      seller2_user_id,
      'Restoran Pak Ahmad',
      'Nasi ayam, nasi goreng, dan minuman segar. Murah dan sedap!',
      '0129876543',
      NOW()
    );
  END IF;
  
  -- Check and insert Seller 3
  IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE user_id = seller3_user_id) THEN
    INSERT INTO public.sellers (user_id, shop_name, description, phone_number, created_at)
    VALUES (
      seller3_user_id,
      'Kedai Makan Azizah',
      'Kafe & minuman. Kopi, teh, dan kudap-kudapan. Best untuk lepak!',
      '0198765432',
      NOW()
    );
  END IF;
  
  -- Get actual seller IDs
  SELECT id INTO seller1_id FROM public.sellers WHERE user_id = seller1_user_id;
  SELECT id INTO seller2_id FROM public.sellers WHERE user_id = seller2_user_id;
  SELECT id INTO seller3_id FROM public.sellers WHERE user_id = seller3_user_id;

  RAISE NOTICE '✅ Sample sellers created (or already exist)';

  -- ========================================
  -- 3. CREATE PRODUCTS - WARUNG KAK SITI
  -- ========================================
  
  -- Only insert if products don't exist for this seller
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE seller_id = seller1_id LIMIT 1) THEN
    INSERT INTO public.products (seller_id, name, description, price, cost_price, category, stock_quantity, is_available, is_preorder)
    VALUES
    -- Makanan
    (seller1_id, 'Nasi Lemak Biasa', 'Nasi lemak dengan sambal, ikan bilis, kacang, telur, dan timun', 5.00, 3.00, 'Makanan', 50, true, false),
    (seller1_id, 'Nasi Lemak Ayam Goreng', 'Nasi lemak dengan ayam goreng berempah', 8.00, 5.50, 'Makanan', 30, true, false),
    (seller1_id, 'Nasi Lemak Rendang', 'Nasi lemak dengan rendang daging lembu yang sedap', 10.00, 7.00, 'Makanan', 20, true, false),
    (seller1_id, 'Lontong', 'Lontong dengan sayur lodeh, telur, dan sambal kacang', 6.50, 4.00, 'Makanan', 25, true, false),
    (seller1_id, 'Mee Goreng Mamak', 'Mee goreng pedas ala mamak dengan telur dan sayur', 7.00, 4.50, 'Makanan', 40, true, false),
    
    -- Minuman
    (seller1_id, 'Teh Tarik', 'Teh susu yang ditarik panas', 2.50, 1.00, 'Minuman', 100, true, false),
    (seller1_id, 'Kopi O', 'Kopi hitam pekat tanpa susu', 2.00, 0.80, 'Minuman', 100, true, false),
    (seller1_id, 'Milo Ais', 'Milo sejuk dengan ais', 3.50, 1.50, 'Minuman', 80, true, false);
  END IF;

  RAISE NOTICE '✅ Warung Kak Siti products created (8 items)';

  -- ========================================
  -- 4. CREATE PRODUCTS - RESTORAN PAK AHMAD
  -- ========================================
  
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE seller_id = seller2_id LIMIT 1) THEN
    INSERT INTO public.products (seller_id, name, description, price, cost_price, category, stock_quantity, is_available, is_preorder)
    VALUES
    -- Makanan
    (seller2_id, 'Nasi Ayam Goreng', 'Nasi putih dengan ayam goreng berempah dan sos', 7.50, 5.00, 'Makanan', 40, true, false),
    (seller2_id, 'Nasi Goreng Kampung', 'Nasi goreng dengan ikan bilis, telur, dan sayur', 6.00, 3.50, 'Makanan', 50, true, false),
    (seller2_id, 'Nasi Goreng Ayam', 'Nasi goreng dengan ayam dan telur mata', 8.00, 5.50, 'Makanan', 35, true, false),
    (seller2_id, 'Mee Goreng Basah', 'Mee goreng berkuah dengan sotong dan sayur', 7.50, 4.50, 'Makanan', 30, true, false),
    (seller2_id, 'Kuey Teow Goreng', 'Kuey teow goreng dengan kerang, telur, dan tauge', 8.50, 6.00, 'Makanan', 25, true, false),
    
    -- Minuman
    (seller2_id, 'Air Limau Ais', 'Limau kasturi sejuk yang menyegarkan', 3.00, 1.20, 'Minuman', 100, true, false),
    (seller2_id, 'Teh O Ais Limau', 'Teh O dengan limau dan ais', 3.50, 1.50, 'Minuman', 80, true, false),
    (seller2_id, 'Sirap Bandung', 'Minuman manis merah jambu dengan susu', 3.50, 1.30, 'Minuman', 60, true, false);
  END IF;

  RAISE NOTICE '✅ Restoran Pak Ahmad products created (8 items)';

  -- ========================================
  -- 5. CREATE PRODUCTS - KEDAI MAKAN AZIZAH
  -- ========================================
  
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE seller_id = seller3_id LIMIT 1) THEN
    INSERT INTO public.products (seller_id, name, description, price, cost_price, category, stock_quantity, is_available, is_preorder)
    VALUES
    -- Makanan
    (seller3_id, 'Roti Bakar Kaya', 'Roti bakar dengan mentega dan kaya', 4.00, 2.00, 'Makanan', 50, true, false),
    (seller3_id, 'Roti Telur Bawang', 'Roti telur dengan bawang goreng', 5.50, 3.00, 'Makanan', 40, true, false),
    (seller3_id, 'Sandwich Sardin', 'Sandwich dengan inti sardin pedas', 6.00, 3.50, 'Makanan', 30, true, false),
    (seller3_id, 'Nasi Goreng USA', 'Nasi goreng dengan udang, sotong, dan ayam', 10.00, 7.00, 'Makanan', 20, true, false),
    
    -- Minuman
    (seller3_id, 'Kopi Panas', 'Kopi susu panas tradisional', 3.00, 1.20, 'Minuman', 100, true, false),
    (seller3_id, 'Kopi Ais', 'Kopi susu sejuk dengan ais', 3.50, 1.50, 'Minuman', 100, true, false),
    (seller3_id, 'Teh Tarik Special', 'Teh tarik dengan gula melaka', 4.00, 1.80, 'Minuman', 80, true, false),
    (seller3_id, 'Milo Panas', 'Milo susu panas', 3.50, 1.50, 'Minuman', 80, true, false),
    (seller3_id, 'Nescafe Ais', 'Nescafe sejuk yang sedap', 3.50, 1.50, 'Minuman', 70, true, false),
    (seller3_id, 'Air Mata Kucing', 'Minuman herba sejuk yang menyegarkan', 4.00, 2.00, 'Minuman', 50, true, false);
  END IF;

  RAISE NOTICE '✅ Kedai Makan Azizah products created (10 items)';

  -- ========================================
  -- 6. SUMMARY
  -- ========================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SEED DATA CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- 3 Sample Users (Sellers)';
  RAISE NOTICE '- 3 Sellers with shop details';
  RAISE NOTICE '- 26 Products across 3 sellers';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '1. Visit http://localhost:3000/sellers';
  RAISE NOTICE '2. Browse products from each seller';
  RAISE NOTICE '3. Test Cart Context functionality';
  RAISE NOTICE '';
  RAISE NOTICE 'Sellers created:';
  RAISE NOTICE '1. Warung Kak Siti (8 products)';
  RAISE NOTICE '2. Restoran Pak Ahmad (8 products)';
  RAISE NOTICE '3. Kedai Makan Azizah (10 products)';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check sellers
SELECT 
  s.id,
  s.shop_name,
  s.description,
  COUNT(p.id) as product_count
FROM sellers s
LEFT JOIN products p ON p.seller_id = s.id
GROUP BY s.id, s.shop_name, s.description
ORDER BY s.created_at;

-- Check products by category
SELECT 
  s.shop_name,
  p.category,
  COUNT(*) as count
FROM products p
JOIN sellers s ON s.id = p.seller_id
GROUP BY s.shop_name, p.category
ORDER BY s.shop_name, p.category;

-- Total summary
SELECT 
  'Users' as entity, COUNT(*) as count FROM users WHERE role = 'seller'
UNION ALL
SELECT 'Sellers', COUNT(*) FROM sellers
UNION ALL
SELECT 'Products', COUNT(*) FROM products;
