-- ============================================
-- SAJIAN SEMATANG - PATCH ALL MISSING COLUMNS
-- Version 1.2 (28/08/2026)
-- ============================================
-- Skrip ini menambah SEMUA column yang terlepas
-- sebelum apply RLS policies
-- 
-- Run order: Jalankan SEBELUM sebarang RLS policies
--
-- Changelog:
-- v1.2 (28/08/2026 15:25) - Fix paid_by foreign key error
-- v1.1 (28/08/2026 15:20) - Fix duplicate_key exception  
-- v1.0 (28/08/2026 15:08) - Initial release
-- ============================================

-- Enable UUID extension (jika belum)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PATCH USERS TABLE
-- ============================================

-- Pastikan users table ada columns yang diperlukan
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seller_id uuid;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('customer', 'seller', 'admin', 'staff'));

-- Set default values untuk existing records
UPDATE public.users SET name = 'User ' || id::text WHERE name IS NULL OR name = '';
UPDATE public.users SET email = id::text || '@temp.local' WHERE email IS NULL OR email = '';
UPDATE public.users SET role = 'customer' WHERE role IS NULL;
UPDATE public.users SET is_active = true WHERE is_active IS NULL;
UPDATE public.users SET created_at = now() WHERE created_at IS NULL;
UPDATE public.users SET updated_at = now() WHERE updated_at IS NULL;

-- Tambah unique constraint untuk email (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. PATCH SELLERS TABLE
-- ============================================

-- Pastikan sellers table ada columns yang diperlukan
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS shop_name text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS duitnow_qr_url text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Set default values untuk existing records
UPDATE public.sellers SET shop_name = 'Shop ' || id::text WHERE shop_name IS NULL OR shop_name = '';
UPDATE public.sellers SET created_at = now() WHERE created_at IS NULL;
UPDATE public.sellers SET updated_at = now() WHERE updated_at IS NULL;

-- Tambah foreign key untuk user_id (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.sellers 
    ADD CONSTRAINT sellers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Link seller_id dalam users table
DO $$ BEGIN
  ALTER TABLE public.users 
    ADD CONSTRAINT users_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. PATCH PRODUCTS TABLE
-- ============================================

-- Pastikan products table ada columns yang diperlukan
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price decimal(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price decimal(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_preorder boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_from timestamp with time zone;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_until timestamp with time zone;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Set default values untuk existing records
UPDATE public.products SET name = 'Product ' || id::text WHERE name IS NULL OR name = '';
UPDATE public.products SET price = 0 WHERE price IS NULL;
UPDATE public.products SET cost_price = price * 0.7 WHERE cost_price IS NULL;
UPDATE public.products SET category = 'Makanan' WHERE category IS NULL OR category = '';
UPDATE public.products SET is_available = true WHERE is_available IS NULL;
UPDATE public.products SET stock_quantity = 0 WHERE stock_quantity IS NULL;
UPDATE public.products SET is_preorder = false WHERE is_preorder IS NULL;
UPDATE public.products SET created_at = now() WHERE created_at IS NULL;
UPDATE public.products SET updated_at = now() WHERE updated_at IS NULL;

-- Tambah foreign key untuk seller_id (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.products 
    ADD CONSTRAINT products_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 4. PATCH ORDERS TABLE
-- ============================================

-- Pastikan orders table ada columns yang diperlukan
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_pin_location text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal decimal(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee decimal(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price decimal(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cost decimal(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_mode text DEFAULT 'Self-Pickup';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS calculated_distance decimal(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'New';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_custom_preorder boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_datetime timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_sent boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Set default values untuk existing records
UPDATE public.orders SET customer_name = 'Customer ' || id::text WHERE customer_name IS NULL OR customer_name = '';
UPDATE public.orders SET customer_phone = '0000000000' WHERE customer_phone IS NULL OR customer_phone = '';
UPDATE public.orders SET customer_email = customer_phone || '@temp.local' WHERE customer_email IS NULL OR customer_email = '';
UPDATE public.orders SET subtotal = 0 WHERE subtotal IS NULL;
UPDATE public.orders SET delivery_fee = 0 WHERE delivery_fee IS NULL;
UPDATE public.orders SET total_price = subtotal + delivery_fee WHERE total_price IS NULL;
UPDATE public.orders SET total_cost = 0 WHERE total_cost IS NULL;
UPDATE public.orders SET delivery_mode = 'Self-Pickup' WHERE delivery_mode IS NULL;
UPDATE public.orders SET status = 'New' WHERE status IS NULL;
UPDATE public.orders SET is_custom_preorder = false WHERE is_custom_preorder IS NULL;
UPDATE public.orders SET whatsapp_sent = false WHERE whatsapp_sent IS NULL;
UPDATE public.orders SET created_at = now() WHERE created_at IS NULL;
UPDATE public.orders SET updated_at = now() WHERE updated_at IS NULL;

-- Update constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_mode_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_mode_check 
  CHECK (delivery_mode IN ('Delivery', 'Self-Pickup'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('New', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'));

-- Tambah foreign keys (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.orders 
    ADD CONSTRAINT orders_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES public.sellers(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.orders 
    ADD CONSTRAINT orders_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 5. CREATE ORDER_ITEMS TABLE (jika belum wujud)
-- ============================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  product_name_snapshot text,
  cost_price_snapshot decimal(10, 2),
  created_at timestamp with time zone DEFAULT now()
);

-- Tambah missing columns jika table sudah wujud
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id uuid;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity integer;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price decimal(10, 2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name_snapshot text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS cost_price_snapshot decimal(10, 2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Set default values (update dari products table)
UPDATE public.order_items oi
SET product_name_snapshot = COALESCE(oi.product_name_snapshot, p.name, 'Unknown Product'),
    cost_price_snapshot = COALESCE(oi.cost_price_snapshot, p.cost_price, p.price * 0.7, 0)
FROM public.products p
WHERE oi.product_id = p.id
  AND (oi.product_name_snapshot IS NULL OR oi.cost_price_snapshot IS NULL);

UPDATE public.order_items SET created_at = now() WHERE created_at IS NULL;

-- Tambah foreign keys (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 6. CREATE PAYOUTS TABLE (jika belum wujud)
-- ============================================

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id uuid NOT NULL,
  amount decimal(10, 2) NOT NULL,
  payment_method text DEFAULT 'DuitNow',
  paid_by uuid NOT NULL,
  notes text,
  order_ids text[] NOT NULL,
  status text DEFAULT 'Completed',
  created_at timestamp with time zone DEFAULT now()
);

-- Tambah missing columns jika table sudah wujud
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS seller_id uuid;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS amount decimal(10, 2);
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'DuitNow';
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS paid_by uuid;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS order_ids text[];
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS status text DEFAULT 'Completed';
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Set default values
UPDATE public.payouts SET status = 'Completed' WHERE status IS NULL;
UPDATE public.payouts SET created_at = now() WHERE created_at IS NULL;

-- Tambah foreign keys (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.payouts 
    ADD CONSTRAINT payouts_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.payouts 
    ADD CONSTRAINT payouts_paid_by_fkey 
    FOREIGN KEY (paid_by) REFERENCES public.users(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 7. CREATE AUDIT_LOGS TABLE (jika belum wujud)
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tambah missing columns jika table sudah wujud
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id uuid;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_value jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_value jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Set default values
UPDATE public.audit_logs SET created_at = now() WHERE created_at IS NULL;

-- Tambah foreign key (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.audit_logs 
    ADD CONSTRAINT audit_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. CREATE INDEXES (untuk performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON public.payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- ============================================
-- PATCH COMPLETED
-- ============================================
-- Sekarang semua column yang diperlukan sepatutnya wujud
-- Seterusnya boleh run RLS policies dengan selamat:
--   1. supabase/rls_policies_final.sql
--   2. atau sebarang RLS script lain
-- ============================================
