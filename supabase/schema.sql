-- Sajian Sematang Database Schema
-- Run this script in your Supabase SQL Editor

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Users Table (Profile)
-- This table links to Supabase Auth users
create table public.users (
  id uuid references auth.users not null primary key,
  name text not null,
  email text unique not null,
  role text check (role in ('customer', 'seller')) default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Sellers Table
create table public.sellers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  shop_name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.sellers(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10, 2) not null,
  category text,
  image_url text,
  is_available boolean default true,
  -- Stock management
  stock_quantity integer default 0,
  -- Pre-order mode
  is_preorder boolean default false,
  -- Automated scheduling
  available_from timestamp with time zone,
  available_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  customer_pin_location text,
  seller_id uuid references public.sellers(id) not null,
  -- Pricing
  subtotal decimal(10, 2) not null,
  delivery_fee decimal(10, 2) default 0,
  total_price decimal(10, 2) not null,
  -- Delivery mode
  delivery_mode text check (delivery_mode in ('Delivery', 'Self-Pickup')) default 'Self-Pickup',
  calculated_distance decimal(10, 2),
  status text check (status in ('New', 'Preparing', 'Ready', 'Completed', 'Cancelled')) default 'New',
  -- Custom pre-order fields
  is_custom_preorder boolean default false,
  delivery_datetime timestamp with time zone,
  special_notes text,
  -- WhatsApp notification
  whatsapp_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Order Items Table
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null,
  unit_price decimal(10, 2) not null
);

-- 7. Set up Row Level Security (RLS)
-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.sellers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies for users
create policy "Users can view their own profile" 
  on public.users for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.users for update 
  using (auth.uid() = id);

-- Policies for sellers
create policy "Anyone can view sellers" 
  on public.sellers for select 
  using (true);

create policy "Users can create seller profile" 
  on public.sellers for insert 
  with check (auth.uid() = user_id);

create policy "Sellers can update their own profile" 
  on public.sellers for update 
  using (user_id = auth.uid());

-- Policies for products
-- Complex policy to handle scheduling, pre-order, and stock
create policy "Anyone can view available products"
  on public.products for select
  using (
    is_available = true
    AND (
      -- Check scheduling: product must be within available time range
      (
        (available_from is null OR available_from <= now())
        AND (available_until is null OR available_until >= now())
      )
    )
    AND (
      -- Check stock: pre-order products always show, regular products need stock > 0
      is_preorder = true OR stock_quantity > 0
    )
  );

create policy "Sellers can view all their products" 
  on public.products for select 
  using (
    seller_id in (select id from public.sellers where user_id = auth.uid())
  );

create policy "Sellers can manage their own products" 
  on public.products for all 
  using (
    seller_id in (select id from public.sellers where user_id = auth.uid())
  );

-- Policies for orders
create policy "Sellers can view orders for their shop" 
  on public.orders for select 
  using (
    seller_id in (select id from public.sellers where user_id = auth.uid())
  );

create policy "Sellers can update order status" 
  on public.orders for update 
  using (
    seller_id in (select id from public.sellers where user_id = auth.uid())
  );

create policy "Anyone can insert orders" 
  on public.orders for insert 
  with check (true);

-- Policies for order_items
create policy "Sellers can view order items for their orders" 
  on public.order_items for select 
  using (
    order_id in (
      select o.id from public.orders o
      inner join public.sellers s on o.seller_id = s.id
      where s.user_id = auth.uid()
    )
  );

create policy "Anyone can insert order items" 
  on public.order_items for insert 
  with check (true);

-- 8. Create indexes for better performance
create index idx_products_seller_id on public.products(seller_id);
create index idx_orders_seller_id on public.orders(seller_id);
create index idx_orders_status on public.orders(status);
create index idx_order_items_order_id on public.order_items(order_id);

-- 9. Create function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, 'customer');
  return new;
end;
$$ language plpgsql security definer;

-- 10. Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 11. Insert sample data (optional - for testing)
-- You can uncomment this section to add sample data

/*
-- Sample seller user
insert into auth.users (id, email) values 
  ('11111111-1111-1111-1111-111111111111', 'seller@example.com');

insert into public.users (id, name, email, role) values 
  ('11111111-1111-1111-1111-111111111111', 'Kedai Makan Sedap', 'seller@example.com', 'seller');

-- Sample seller
insert into public.sellers (id, user_id, shop_name, description) values 
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Kedai Makan Sedap', 'Menyediakan pelbagai jenis makanan tradisional');

-- Sample products with new features
insert into public.products (seller_id, name, description, price, category, is_available, stock_quantity, is_preorder, available_from, available_until) values
  -- Regular product with stock
  ('22222222-2222-2222-2222-222222222222', 'Nasi Lemak Special', 'Nasi lemak dengan ayam berempah, sambal dan telur', 8.50, 'Makanan', true, 50, false, null, null),
  -- Regular product with limited stock
  ('22222222-2222-2222-2222-222222222222', 'Mee Goreng', 'Mee goreng mamak dengan telur dan sayur', 7.00, 'Makanan', true, 10, false, null, null),
  -- Always available drink
  ('22222222-2222-2222-2222-222222222222', 'Teh Tarik', 'Teh tarik panas', 2.50, 'Minuman', true, 999, false, null, null),
  -- Breakfast item (available 6am-11am)
  ('22222222-2222-2222-2222-222222222222', 'Roti Canai', 'Roti canai dengan kuah dhal - Sarapan sahaja', 3.00, 'Makanan', true, 30, false,
    timezone('utc', (current_date + interval '6 hours')::timestamp),
    timezone('utc', (current_date + interval '11 hours')::timestamp)),
  -- Pre-order item for tomorrow
  ('22222222-2222-2222-2222-222222222222', 'Nasi Ayam Set (Pre-Order)', 'Set nasi ayam lengkap - Pre-order untuk esok', 12.00, 'Makanan', true, 0, true,
    timezone('utc', (current_date + interval '1 day')::timestamp),
    timezone('utc', (current_date + interval '2 days')::timestamp)),
  -- Limited time offer (next 7 days)
  ('22222222-2222-2222-2222-222222222222', 'Promo Combo Meal', 'Nasi + Ayam + Minuman (Tawaran Terhad)', 15.00, 'Makanan', true, 20, false,
    now(),
    timezone('utc', (current_date + interval '7 days')::timestamp));
*/
