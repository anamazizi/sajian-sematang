-- FIX DATABASE SCHEMA PART 2
-- Add missing columns to USERS and ORDERS, create missing tables

-- USERS TABLE
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.sellers(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Update role constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('customer', 'seller', 'admin', 'staff'));

-- ORDERS TABLE
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_cost decimal(10, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Populate customer_email
UPDATE public.orders SET customer_email = customer_phone || '@temp.local' WHERE customer_email IS NULL;

-- Update status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('New', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'));

-- CREATE MISSING TABLES
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10, 2) NOT NULL,
  payment_method text DEFAULT 'DuitNow',
  paid_by uuid REFERENCES public.users(id) NOT NULL,
  notes text,
  order_ids text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
