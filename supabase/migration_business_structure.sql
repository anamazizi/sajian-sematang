-- ============================================
-- SAJIAN SEMATANG - BUSINESS STRUCTURE MIGRATION
-- ============================================
-- Tarikh: 16 Ogos 2026
-- Versi: 2.0
-- Penerangan: Migration untuk sistem kewangan, peranan pengguna, dan audit logs
-- ============================================

-- BAHAGIAN 1: KEMAS KINI JADUAL SEDIA ADA
-- ============================================

-- 1.1 Kemas kini jadual USERS (tambah peranan baharu)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean default true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seller_id uuid references public.sellers(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now());

-- Update role constraint untuk include admin dan staff
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role in ('customer', 'seller', 'admin', 'staff'));

-- 1.2 Kemas kini jadual SELLERS (tambah DuitNow QR)
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS duitnow_qr_url text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now());

-- Make duitnow_qr_url NOT NULL after adding (allow existing records to be updated first)
-- Run this after updating existing sellers:
-- ALTER TABLE public.sellers ALTER COLUMN duitnow_qr_url SET NOT NULL;

-- 1.3 Kemas kini jadual PRODUCTS (tambah cost_price)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price decimal(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now());

-- Set default cost_price to 70% of price for existing products
UPDATE public.products SET cost_price = price * 0.7 WHERE cost_price IS NULL;

-- Make cost_price NOT NULL after setting defaults
ALTER TABLE public.products ALTER COLUMN cost_price SET NOT NULL;

-- 1.4 Kemas kini jadual ORDERS (tambah total_cost dan created_by)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cost decimal(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by uuid references public.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now());

-- Update status constraint untuk include 'Accepted'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status in ('New', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'));

-- Calculate total_cost for existing orders
UPDATE public.orders o
SET total_cost = (
  SELECT COALESCE(SUM(oi.quantity * COALESCE(p.cost_price, p.price * 0.7)), 0)
  FROM public.order_items oi
  JOIN public.products p ON oi.product_id = p.id
  WHERE oi.order_id = o.id
)
WHERE total_cost IS NULL;

-- Make total_cost NOT NULL after calculation
ALTER TABLE public.orders ALTER COLUMN total_cost SET NOT NULL;

-- ============================================
-- BAHAGIAN 2: JADUAL BAHARU
-- ============================================

-- 2.1 Jadual PAYOUTS (Rekod pembayaran kepada seller)
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.sellers(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  payment_method text check (payment_method in ('DuitNow', 'Cash', 'Bank Transfer', 'Other')) default 'DuitNow',
  reference_number text,
  paid_by uuid references public.users(id) not null,
  notes text,
  order_ids text[] not null, -- Array of order IDs yang dibayar
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2.2 Jadual AUDIT_LOGS (Rekod semua perubahan)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  action text check (action in ('create', 'update', 'delete', 'status_change', 'payout')) not null,
  table_name text not null,
  record_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- BAHAGIAN 3: INDEXES UNTUK PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON public.payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_paid_by ON public.payouts(paid_by);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON public.payouts(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON public.orders(updated_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_seller_id ON public.users(seller_id);

-- ============================================
-- BAHAGIAN 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- 4.1 Enable RLS pada jadual baharu
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.2 Drop existing policies yang perlu dikemas kini
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Sellers can view orders for their shop" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view all their products" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;

-- 4.3 Policies untuk USERS (updated)
CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" 
  ON public.users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage users" 
  ON public.users FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4.4 Policies untuk ORDERS (updated)
CREATE POLICY "Sellers can view their own orders" 
  ON public.orders FOR SELECT 
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and Staff can view all orders" 
  ON public.orders FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Sellers can update their own order status" 
  ON public.orders FOR UPDATE 
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and Staff can update all orders" 
  ON public.orders FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and Staff can create orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 4.5 Policies untuk PRODUCTS (updated)
CREATE POLICY "Sellers can view their own products" 
  ON public.products FOR SELECT 
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and Staff can view all products" 
  ON public.products FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Sellers can manage their own products" 
  ON public.products FOR ALL 
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin and Staff can manage all products" 
  ON public.products FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 4.6 Policies untuk PAYOUTS
CREATE POLICY "Admins can view all payouts" 
  ON public.payouts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Sellers can view their own payouts" 
  ON public.payouts FOR SELECT 
  USING (
    seller_id IN (
      SELECT id FROM public.sellers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can create payouts" 
  ON public.payouts FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4.7 Policies untuk AUDIT_LOGS
CREATE POLICY "Admins can view all audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (true);

-- ============================================
-- BAHAGIAN 5: FUNCTIONS & TRIGGERS
-- ============================================

-- 5.1 Function untuk auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Triggers untuk updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sellers_updated_at ON public.sellers;
CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5.3 Function untuk calculate seller outstanding balance
CREATE OR REPLACE FUNCTION public.get_seller_outstanding(seller_uuid uuid)
RETURNS decimal AS $$
DECLARE
  total_outstanding decimal;
BEGIN
  SELECT COALESCE(SUM(o.total_cost), 0)
  INTO total_outstanding
  FROM public.orders o
  WHERE o.seller_id = seller_uuid
    AND o.status = 'Completed'
    AND o.id::text NOT IN (
      SELECT unnest(order_ids) 
      FROM public.payouts 
      WHERE seller_id = seller_uuid
    );
  
  RETURN total_outstanding;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Function untuk get unpaid orders for seller
CREATE OR REPLACE FUNCTION public.get_unpaid_orders(seller_uuid uuid)
RETURNS TABLE (
  order_id uuid,
  order_date timestamp with time zone,
  customer_name text,
  total_cost decimal,
  total_price decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.customer_name,
    o.total_cost,
    o.total_price
  FROM public.orders o
  WHERE o.seller_id = seller_uuid
    AND o.status = 'Completed'
    AND o.id::text NOT IN (
      SELECT unnest(order_ids) 
      FROM public.payouts 
      WHERE seller_id = seller_uuid
    )
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Function untuk auto-calculate total_cost on order insert/update
CREATE OR REPLACE FUNCTION public.calculate_order_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_cost from order_items
  SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0)
  INTO NEW.total_cost
  FROM public.order_items oi
  JOIN public.products p ON oi.product_id = p.id
  WHERE oi.order_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger should be created AFTER order_items are inserted
-- So we'll use it on UPDATE only
DROP TRIGGER IF EXISTS calculate_order_cost ON public.orders;
CREATE TRIGGER calculate_order_cost
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.total_cost IS DISTINCT FROM NEW.total_cost OR NEW.total_cost IS NULL)
  EXECUTE FUNCTION public.calculate_order_total_cost();

-- ============================================
-- BAHAGIAN 6: VIEWS UNTUK REPORTING
-- ============================================

-- 6.1 View untuk seller outstanding summary
-- Drop existing view first to allow column rename
DROP VIEW IF EXISTS public.seller_outstanding_summary CASCADE;

CREATE VIEW public.seller_outstanding_summary AS
SELECT 
  s.id as seller_id,
  s.shop_name,
  s.phone_number,
  COUNT(DISTINCT o.id) as unpaid_orders_count,
  COALESCE(SUM(o.total_cost), 0) as total_outstanding,
  COALESCE(SUM(o.total_price), 0) as total_sales,
  MAX(o.created_at) as last_order_date
FROM public.sellers s
LEFT JOIN public.orders o ON s.id = o.seller_id 
  AND o.status = 'Completed'
  AND o.id::text NOT IN (
    SELECT unnest(order_ids) 
    FROM public.payouts 
    WHERE seller_id = s.id
  )
GROUP BY s.id, s.shop_name, s.phone_number
ORDER BY total_outstanding DESC;

-- 6.2 View untuk daily sales summary
-- Drop existing view first to allow schema changes
DROP VIEW IF EXISTS public.daily_sales_summary CASCADE;

CREATE VIEW public.daily_sales_summary AS
SELECT 
  DATE(o.created_at) as sale_date,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.seller_id) as active_sellers,
  SUM(o.total_price) as total_revenue,
  SUM(o.total_cost) as total_cost,
  SUM(o.total_price - o.total_cost) as total_profit
FROM public.orders o
WHERE o.status = 'Completed'
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- ============================================
-- BAHAGIAN 7: SAMPLE DATA (OPTIONAL)
-- ============================================

-- Uncomment untuk insert sample admin user
/*
-- Create admin user (you need to create this in Supabase Auth first)
-- Then update the users table:
UPDATE public.users 
SET role = 'admin', 
    phone_number = '0111234567',
    address = 'Admin Office'
WHERE email = 'admin@sajian-sematang.com';
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 New tables created: payouts, audit_logs';
  RAISE NOTICE '🔄 Updated tables: users, sellers, products, orders';
  RAISE NOTICE '🔐 RLS policies updated for all roles';
  RAISE NOTICE '⚡ Functions and triggers created';
  RAISE NOTICE '📈 Views created for reporting';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '1. Update existing sellers with duitnow_qr_url';
  RAISE NOTICE '2. Create admin user in Supabase Auth';
  RAISE NOTICE '3. Update admin user role in users table';
  RAISE NOTICE '4. Test all RLS policies';
  RAISE NOTICE '5. Setup Google OAuth in Supabase';
END $$;
