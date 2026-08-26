-- FIX DATABASE SCHEMA PART 1
-- Add missing columns to SELLERS and PRODUCTS

-- SELLERS TABLE
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS shop_name text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS duitnow_qr_url text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Set shop_name for existing records
UPDATE public.sellers SET shop_name = 'Shop ' || id::text WHERE shop_name IS NULL;

-- PRODUCTS TABLE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price decimal(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_preorder boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_from timestamp with time zone;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_until timestamp with time zone;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Set cost_price (70% of selling price)
UPDATE public.products SET cost_price = price * 0.7 WHERE cost_price IS NULL;
