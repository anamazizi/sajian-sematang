-- ============================================
-- FIX: Create Missing Tables & Columns
-- ============================================
-- Run THIS FIRST before rls_policies_complete.sql
-- ============================================

-- Create order_items table if not exists
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null,
  unit_price decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Add customer_email to orders if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_email text;
  END IF;
END $$;

-- Create payouts table if not exists
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.sellers(id) on delete cascade not null,
  amount decimal(10, 2) not null,
  payment_method text default 'DuitNow',
  reference_number text,
  paid_by uuid references public.users(id) not null,
  notes text,
  order_ids text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  action text not null,
  table_name text not null,
  record_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
