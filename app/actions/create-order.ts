'use server';

// Phase R4A: Server-Side Order Creation with Validation
// This Server Action replaces client-side order submission
// Master Prompt Seksyen 29: Server validates all prices
// Master Prompt Seksyen 19: Atomic stock check

import { createClient } from '../../lib/supabase/server';
import { generateWhatsAppLink } from '../../lib/utils';

// Define the order data structure expected by RPC
interface OrderItemInput {
  product_id: string;
  quantity: number;
  selectedOptions?: Array<{
    option_id: string;
    option_group: string;
    option_name: string;
    price_adjustment: number;
  }>;
}

interface CreateOrderInput {
  seller_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  customer_pin_location?: string;
  delivery_mode: 'Delivery' | 'Self-Pickup';
  delivery_fee: number;
  calculated_distance?: number;
  total_price: number; // Client-submitted (will be validated)
  items: OrderItemInput[];
  special_notes?: string;
  is_custom_preorder?: boolean;
  delivery_datetime?: string;
}

interface CreateOrderResult {
  success: boolean;
  order_id?: string;
  whatsapp_link?: string;
  error?: string;
  details?: {
    subtotal: number;
    delivery_fee: number;
    total: number;
  };
}

export async function createOrder(
  orderData: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    // Get authenticated Supabase client
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Sila log masuk untuk membuat tempahan',
      };
    }

    // Validate required fields
    if (!orderData.customer_name?.trim()) {
      return {
        success: false,
        error: 'Nama pelanggan diperlukan',
      };
    }

    if (!orderData.customer_phone?.trim()) {
      return {
        success: false,
        error: 'Nombor telefon diperlukan',
      };
    }

    if (orderData.delivery_mode === 'Delivery' && !orderData.customer_address?.trim()) {
      return {
        success: false,
        error: 'Alamat diperlukan untuk penghantaran',
      };
    }

    if (!orderData.items || orderData.items.length === 0) {
      return {
        success: false,
        error: 'Tiada item dalam tempahan',
      };
    }

    // Call RPC function (server-side validation happens here)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_order_with_stock_check',
      {
        order_data: {
          seller_id: orderData.seller_id,
          customer_name: orderData.customer_name.trim(),
          customer_phone: orderData.customer_phone.trim(),
          customer_address: orderData.customer_address?.trim() || null,
          customer_pin_location: orderData.customer_pin_location || null,
          delivery_mode: orderData.delivery_mode,
          delivery_fee: orderData.delivery_fee,
          calculated_distance: orderData.calculated_distance || 0,
          total_price: orderData.total_price,
          items: orderData.items,
          special_notes: orderData.special_notes?.trim() || null,
          is_custom_preorder: orderData.is_custom_preorder || false,
          delivery_datetime: orderData.delivery_datetime || null,
        },
      }
    );

    // Handle RPC errors
    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return {
        success: false,
        error: `Ralat sistem: ${rpcError.message}`,
      };
    }

    // Check if RPC returned error in response
    if (!rpcResult || !rpcResult.success) {
      return {
        success: false,
        error: rpcResult?.error || 'Gagal membuat tempahan',
      };
    }

    // Order created successfully!
    const orderId = rpcResult.order_id;

    // Fetch order items for WhatsApp message
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products(name, price)
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Failed to fetch order items:', itemsError);
    }

    // Generate WhatsApp link
    const whatsappLink = generateWhatsAppLink({
      orderId: orderId,
      customerName: orderData.customer_name,
      customerPhone: orderData.customer_phone,
      customerAddress: orderData.customer_address,
      customerPinLocation: orderData.customer_pin_location,
      deliveryMode: orderData.delivery_mode,
      subtotal: rpcResult.subtotal,
      deliveryFee: rpcResult.delivery_fee,
      totalPrice: rpcResult.total,
      calculatedDistance: orderData.calculated_distance,
      items: orderItems?.map((item: any) => ({
        name: item.product_name_snapshot || item.product?.name || 'Unknown',
        quantity: item.quantity,
        price: item.unit_price,
        selectedOptions: item.selected_options || [],  // Phase R4D: Include options snapshot
      })) || [],
      specialNotes: orderData.special_notes,
    });

    return {
      success: true,
      order_id: orderId,
      whatsapp_link: whatsappLink,
      details: {
        subtotal: rpcResult.subtotal,
        delivery_fee: rpcResult.delivery_fee,
        total: rpcResult.total,
      },
    };
  } catch (error) {
    console.error('Unexpected error in createOrder:', error);
    return {
      success: false,
      error: 'Ralat tidak dijangka. Sila cuba lagi.',
    };
  }
}
