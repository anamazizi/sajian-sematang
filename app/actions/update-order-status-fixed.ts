'use server';

// Server Action for updating order status with audit logging
// Uses Supabase RPC function update_order_status_with_audit

import { createClient } from '../../lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UpdateOrderStatusResult {
  success: boolean;
  error?: string;
  order_id?: string;
  previous_status?: string;
  new_status?: string;
  message?: string;
}

export async function updateOrderStatusWithAudit(
  orderId: string,
  newStatus: string,
  notes?: string
): Promise<UpdateOrderStatusResult> {
  try {
    // Get authenticated Supabase client
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Sila log masuk untuk mengemas kini status pesanan',
      };
    }

    // Get user profile to get real name (full_name)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    let actorName = 'Admin/Staff'; // Default fallback
    let actorRole = 'admin'; // Default fallback

    if (!profileError && profile) {
      // Use real name from profiles table
      actorName = profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Admin/Staff';
      actorRole = profile.role || 'admin';
    } else {
      // Fallback to auth user metadata
      actorName = user.user_metadata?.full_name || user.user_metadata?.name || 'Admin/Staff';
      actorRole = user.user_metadata?.role || 'admin';
    }

    // Call RPC function with actor information
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'update_order_status_with_audit',
      {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_notes: notes || null,
        p_actor_name: actorName, // Pass real name to RPC
        p_actor_role: actorRole, // Pass role to RPC
      }
    );

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return {
        success: false,
        error: `Ralat sistem: ${rpcError.message}`,
      };
    }

    // Check RPC result
    if (!rpcResult || !rpcResult.success) {
      return {
        success: false,
        error: rpcResult?.error || 'Gagal mengemas kini status pesanan',
      };
    }

    // Revalidate the orders page
    revalidatePath('/kawalan/orders');

    return {
      success: true,
      order_id: rpcResult.order_id,
      previous_status: rpcResult.previous_status,
      new_status: rpcResult.new_status,
      message: rpcResult.message || 'Status pesanan berjaya dikemas kini',
    };
  } catch (error) {
    console.error('Unexpected error in updateOrderStatusWithAudit:', error);
    return {
      success: false,
      error: 'Ralat tidak dijangka. Sila cuba lagi.',
    };
  }
}

// Function to fetch order status history
export interface OrderStatusHistoryRecord {
  id: string;
  order_id: string;
  previous_status: string;
  new_status: string;
  changed_by?: string;
  actor_name?: string;
  actor_role?: string;
  notes?: string;
  created_at: string;
}

export async function getOrderStatusHistory(
  orderId: string
): Promise<OrderStatusHistoryRecord[]> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Fetch status history
    const { data, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching order status history:', error);
    return [];
  }
}