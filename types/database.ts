// Database Types for Sajian Sematang
// Updated: 16 Ogos 2026 - Business Structure v2.0

export type UserRole = 'customer' | 'seller' | 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'seller' | 'admin' | 'staff';
  phone_number?: string;
  address?: string;
  google_maps_url?: string;  // For delivery location
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  seller_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Seller {
  id: string;
  user_id: string;
  shop_name: string;
  description?: string;
  duitnow_qr_url?: string; // WAJIB untuk seller aktif
  phone_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  price: number; // Harga jualan kepada customer
  cost_price: number; // Harga kos kedai bayar ke seller
  category?: string;
  image_url?: string;
  is_available: boolean;
  // Stock management
  stock_quantity: number;
  // Pre-order mode
  is_preorder: boolean;
  // Automated scheduling
  available_from?: string | null;
  available_until?: string | null;
  created_at: string;
  updated_at?: string;
}

// Phase R5.4: Customer-facing product (WITHOUT cost_price)
// Master Prompt Seksyen 66: Customer tidak boleh lihat cost_price
export interface CustomerProduct {
  id: string;
  seller_id: string;
  name: string;
  description?: string;
  price: number; // Harga jualan kepada customer
  // cost_price EXCLUDED - customers cannot see this
  category?: string;
  image_url?: string;
  is_available: boolean;
  stock_quantity: number;
  is_preorder: boolean;
  available_from?: string | null;
  available_until?: string | null;
  created_at: string;
  updated_at?: string;
}

// Product Option interface (Phase R4D)
export interface ProductOption {
  id: string;
  product_id: string;
  option_group: string;      // e.g., "Temperature", "Add-ons", "Size"
  option_name: string;        // e.g., "Hot", "Iced", "Extra Cheese"
  price_adjustment: number;   // e.g., 0.00, 1.00, 2.50
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

// Selected Option (for cart/order)
export interface SelectedOption {
  option_id: string;
  option_group: string;
  option_name: string;
  price_adjustment: number;
}

// Cart Item interface (Product with quantity and options)
export interface CartItem {
  id: string;
  seller_id: string;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  selectedOptions?: SelectedOption[];  // Phase R4D: Support options
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  customer_pin_location?: string | null;
  seller_id: string;
  // Pricing
  subtotal: number;
  delivery_fee: number;
  total_price: number; // Harga jualan
  total_cost: number; // Jumlah kos (untuk payout ke seller)
  // Delivery
  delivery_mode: 'Delivery' | 'Self-Pickup';
  calculated_distance?: number | null;
  status: 'New' | 'Accepted' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  // Custom pre-order fields
  is_custom_preorder: boolean;
  delivery_datetime?: string | null;
  special_notes?: string | null;
  whatsapp_sent: boolean;
  created_by?: string | null; // User ID yang buat order (null jika customer)
  created_at: string;
  updated_at?: string;
  // Snapshot fields (Phase R4B)
  customer_name_snapshot?: string | null;
  customer_phone_snapshot?: string | null;
  customer_address_snapshot?: string | null;
  delivery_distance_snapshot?: number | null;
  delivery_fee_snapshot?: number | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number; // This is selling_price_snapshot
  // Snapshot fields (Phase R4B)
  product_name_snapshot?: string | null;
  cost_price_snapshot?: number | null;
  // Options snapshot (Phase R4D)
  selected_options?: Array<{
    option_id: string;
    option_group: string;
    option_name: string;
    price_adjustment: number;
  }> | null;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  payment_method: 'DuitNow' | 'Cash' | 'Bank Transfer' | 'Other';
  reference_number?: string;
  paid_by: string; // User ID admin yang buat bayaran
  notes?: string;
  order_ids: string[]; // Array order IDs yang dibayar
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'payout';
  table_name: string;
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
  pinLocation: string;
}

// View types for reporting
export interface SellerOutstandingSummary {
  seller_id: string;
  shop_name: string;
  phone_number?: string;
  unpaid_orders_count: number;
  total_outstanding: number;
  total_sales: number;
  last_order_date?: string;
}

export interface DailySalesSummary {
  sale_date: string;
  total_orders: number;
  active_sellers: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
}

export interface UnpaidOrder {
  order_id: string;
  order_date: string;
  customer_name: string;
  total_cost: number;
  total_price: number;
}

// Helper types for forms
export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  category?: string;
  image_url?: string;
  is_available: boolean;
  stock_quantity: number;
  is_preorder: boolean;
  available_from?: string | null;
  available_until?: string | null;
}

export interface PayoutFormData {
  seller_id: string;
  amount: number;
  payment_method: 'DuitNow' | 'Cash' | 'Bank Transfer' | 'Other';
  reference_number?: string;
  notes?: string;
  order_ids: string[];
}

export interface UserFormData {
  name: string;
  email: string;
  phone_number?: string;
  address?: string;
  role: 'customer' | 'seller' | 'admin' | 'staff';
  seller_id?: string;
  is_active: boolean;
}

// Stock Movement (Phase R3E)
export interface StockMovement {
  id: string;
  product_id: string;
  seller_id: string;
  previous_quantity: number;
  adjustment_quantity: number; // Positive = increase, Negative = decrease
  new_quantity: number;
  reason: string;
  changed_by?: string | null; // User ID who made the change
  changed_by_role?: string | null; // 'admin', 'staff', 'seller', 'system'
  notes?: string | null;
  created_at: string;
}

// Extended type with product details
export interface StockMovementWithProduct extends StockMovement {
  product?: Product;
  changed_by_user?: {
    name: string;
    email: string;
  };
}
