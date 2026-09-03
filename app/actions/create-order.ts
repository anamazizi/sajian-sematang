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

    // Validate UUID formats before calling RPC
    const validatedItems = orderData.items.map(item => {
      // Ensure product_id is a valid UUID
      if (!item.product_id || typeof item.product_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_id)) {
        throw new Error(`Invalid product_id: ${item.product_id}`);
      }

      // Ensure seller_id is a valid UUID (should be same for all items)
      if (!orderData.seller_id || typeof orderData.seller_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderData.seller_id)) {
        throw new Error(`Invalid seller_id: ${orderData.seller_id}`);
      }

      // Validate options if present
      const validatedOptions = item.selectedOptions?.map(option => {
        if (!option.option_id || typeof option.option_id !== 'string') {
          // If option_id is null/undefined/empty, skip this option
          return null;
        }
        
        // Check if option_id is a valid UUID
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(option.option_id)) {
          throw new Error(`Invalid option_id: ${option.option_id} for product ${item.product_id}`);
        }

        return {
          option_id: option.option_id,
          option_group: option.option_group || '',
          option_name: option.option_name || '',
          price_adjustment: option.price_adjustment || 0,
        };
      }).filter(option => option !== null) || [];

      return {
        ...item,
        selectedOptions: validatedOptions,
      };
    });

    // Create validated order data
    const validatedOrderData = {
      ...orderData,
      items: validatedItems,
    };

    // Call RPC function with validated data
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_order_with_stock_check',
      {
        order_data: {
          seller_id: validatedOrderData.seller_id,
          customer_name: validatedOrderData.customer_name.trim(),
          customer_phone: validatedOrderData.customer_phone.trim(),
          customer_address: validatedOrderData.customer_address?.trim() || null,
          customer_pin_location: validatedOrderData.customer_pin_location || null,
          delivery_mode: validatedOrderData.delivery_mode,
          delivery_fee: validatedOrderData.delivery_fee,
          calculated_distance: validatedOrderData.calculated_distance || 0,
          total_price: validatedOrderData.total_price,
          items: validatedOrderData.items,
          special_notes: validatedOrderData.special_notes?.trim() || null,
          is_custom_preorder: validatedOrderData.is_custom_preorder || false,
          delivery_datetime: validatedOrderData.delivery_datetime || null,
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

    // Generate WhatsApp link
    const whatsappLink = generateWhatsAppLink({
      orderId: orderId,
      customerName: validatedOrderData.customer_name,
      customerPhone: validatedOrderData.customer_phone,
      customerAddress: validatedOrderData.customer_address,
      customerPinLocation: validatedOrderData.customer_pin_location,
      deliveryMode: validatedOrderData.delivery_mode,
      subtotal: rpcResult.subtotal,
      deliveryFee: rpcResult.delivery_fee,
      totalPrice: rpcResult.total,
      calculatedDistance: validatedOrderData.calculated_distance,
      items: orderItems?.map((item: any) => ({
        name: item.product_name_snapshot || item.product?.name || 'Unknown',
        quantity: item.quantity,
        price: item.unit_price,
        selectedOptions: item.selected_options || [],  // Phase R4D: Include options snapshot
      })) || [],
      specialNotes: validatedOrderData.special_notes,
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