// Financial utilities for payout calculations
// Sajian Sematang v2.0

import { supabase } from '../supabase/client';
import { Payout, UnpaidOrder, SellerOutstandingSummary } from '../../types/database';

/**
 * Calculate total outstanding balance for a seller
 * Formula: SUM(cost_price × quantity) for all 'Completed' orders not yet paid
 */
export async function calculateSellerOutstanding(sellerId: string): Promise<number> {
  try {
    // Get all completed orders for this seller
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_cost')
      .eq('seller_id', sellerId)
      .eq('status', 'Completed');

    if (ordersError) throw ordersError;
    if (!orders || orders.length === 0) return 0;

    // Get all order IDs that have been paid
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('order_ids')
      .eq('seller_id', sellerId);

    if (payoutsError) throw payoutsError;

    // Flatten all paid order IDs
    const paidOrderIds = new Set(
      payouts?.flatMap(p => p.order_ids) || []
    );

    // Calculate outstanding from unpaid orders
    const outstanding = orders
      .filter(order => !paidOrderIds.has(order.id))
      .reduce((sum, order) => sum + (order.total_cost || 0), 0);

    return outstanding;
  } catch (error) {
    console.error('Error calculating outstanding:', error);
    throw error;
  }
}

/**
 * Get list of unpaid orders for a seller
 */
export async function getUnpaidOrders(sellerId: string): Promise<UnpaidOrder[]> {
  try {
    // Get all completed orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, customer_name, total_cost, total_price')
      .eq('seller_id', sellerId)
      .eq('status', 'Completed')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;
    if (!orders) return [];

    // Get paid order IDs
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('order_ids')
      .eq('seller_id', sellerId);

    if (payoutsError) throw payoutsError;

    const paidOrderIds = new Set(
      payouts?.flatMap(p => p.order_ids) || []
    );

    // Filter unpaid orders
    const unpaidOrders: UnpaidOrder[] = orders
      .filter(order => !paidOrderIds.has(order.id))
      .map(order => ({
        order_id: order.id,
        order_date: order.created_at,
        customer_name: order.customer_name,
        total_cost: order.total_cost,
        total_price: order.total_price,
      }));

    return unpaidOrders;
  } catch (error) {
    console.error('Error getting unpaid orders:', error);
    throw error;
  }
}

/**
 * Get outstanding summary for all sellers
 */
export async function getAllSellersOutstanding(): Promise<SellerOutstandingSummary[]> {
  try {
    const { data, error } = await supabase
      .from('seller_outstanding_summary')
      .select('*')
      .order('total_outstanding', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting sellers outstanding:', error);
    throw error;
  }
}

/**
 * Create a payout record
 */
export async function createPayout(params: {
  sellerId: string;
  amount: number;
  paymentMethod: 'DuitNow' | 'Cash' | 'Bank Transfer' | 'Other';
  referenceNumber?: string;
  notes?: string;
  orderIds: string[];
  paidBy: string;
}): Promise<Payout> {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .insert({
        seller_id: params.sellerId,
        amount: params.amount,
        payment_method: params.paymentMethod,
        reference_number: params.referenceNumber,
        notes: params.notes,
        order_ids: params.orderIds,
        paid_by: params.paidBy,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating payout:', error);
    throw error;
  }
}

/**
 * Get payout history for a seller
 */
export async function getSellerPayoutHistory(sellerId: string): Promise<Payout[]> {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting payout history:', error);
    throw error;
  }
}

/**
 * Verify if orders belong to seller and are completed
 */
export async function verifyOrdersForPayout(
  sellerId: string,
  orderIds: string[]
): Promise<{ valid: boolean; invalidOrders: string[] }> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, seller_id, status')
      .in('id', orderIds);

    if (error) throw error;

    const invalidOrders: string[] = [];

    orderIds.forEach(orderId => {
      const order = orders?.find(o => o.id === orderId);
      
      if (!order) {
        invalidOrders.push(orderId);
      } else if (order.seller_id !== sellerId) {
        invalidOrders.push(orderId);
      } else if (order.status !== 'Completed') {
        invalidOrders.push(orderId);
      }
    });

    return {
      valid: invalidOrders.length === 0,
      invalidOrders,
    };
  } catch (error) {
    console.error('Error verifying orders:', error);
    throw error;
  }
}

/**
 * Calculate total cost from order IDs
 */
export async function calculateTotalCostFromOrders(orderIds: string[]): Promise<number> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_cost')
      .in('id', orderIds);

    if (error) throw error;

    const total = orders?.reduce((sum, order) => sum + (order.total_cost || 0), 0) || 0;

    return total;
  } catch (error) {
    console.error('Error calculating total cost:', error);
    throw error;
  }
}
