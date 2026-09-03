'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../lib/supabase/server';

/**
 * Server action untuk move product up (swap dengan product sebelumnya)
 */
export async function moveProductUp(productId: string) {
  try {
    const supabase = await createClient();
    
    // Panggil RPC function move_product_up
    const { error } = await supabase.rpc('move_product_up', {
      product_id: productId
    });

    if (error) {
      console.error('Error moving product up:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Revalidate path untuk refresh UI
    revalidatePath('/jualan/products');
    
    return {
      success: true,
      message: 'Product moved up successfully'
    };
  } catch (error: any) {
    console.error('Error in moveProductUp:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Server action untuk move product down (swap dengan product selepasnya)
 */
export async function moveProductDown(productId: string) {
  try {
    const supabase = await createClient();
    
    // Panggil RPC function move_product_down
    const { error } = await supabase.rpc('move_product_down', {
      product_id: productId
    });

    if (error) {
      console.error('Error moving product down:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Revalidate path untuk refresh UI
    revalidatePath('/jualan/products');
    
    return {
      success: true,
      message: 'Product moved down successfully'
    };
  } catch (error: any) {
    console.error('Error in moveProductDown:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Server action untuk swap order antara dua produk
 */
export async function swapProductOrder(productId1: string, productId2: string) {
  try {
    const supabase = await createClient();
    
    // Panggil RPC function swap_product_order
    const { error } = await supabase.rpc('swap_product_order', {
      product1_id: productId1,
      product2_id: productId2
    });

    if (error) {
      console.error('Error swapping product order:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Revalidate path untuk refresh UI
    revalidatePath('/jualan/products');
    
    return {
      success: true,
      message: 'Product order swapped successfully'
    };
  } catch (error: any) {
    console.error('Error in swapProductOrder:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Server action untuk reorder semua produk seller
 */
export async function reorderProducts(sellerId: string) {
  try {
    const supabase = await createClient();
    
    // Panggil RPC function reorder_products
    const { error } = await supabase.rpc('reorder_products', {
      seller_id_param: sellerId
    });

    if (error) {
      console.error('Error reordering products:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Revalidate path untuk refresh UI
    revalidatePath('/jualan/products');
    
    return {
      success: true,
      message: 'All products reordered successfully'
    };
  } catch (error: any) {
    console.error('Error in reorderProducts:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}