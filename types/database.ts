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
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
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
