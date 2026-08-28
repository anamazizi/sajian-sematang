// Product Image Upload Helper
// Phase R3C: Seller Product Management

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload product image to Supabase Storage
 * @param file - Image file (JPEG, PNG, WebP)
 * @param sellerId - Seller's UUID
 * @param productId - Product UUID (optional, for updates)
 * @returns Public URL of uploaded image or error
 */
export async function uploadProductImage(
  file: File,
  sellerId: string,
  productId?: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Format fail tidak sah. Sila gunakan JPEG, PNG, atau WebP.',
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Saiz fail terlalu besar. Maksimum 5MB.',
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const uniqueId = productId || `new-${timestamp}`;
    const fileName = `${sellerId}/${uniqueId}-${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: 'Gagal memuat naik gambar. Sila cuba lagi.',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'Ralat tidak dijangka. Sila hubungi sokongan.',
    };
  }
}

/**
 * Delete product image from storage
 * @param imageUrl - Image URL to delete
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = imageUrl.split('/product-images/');
    if (urlParts.length < 2) return;

    const fileName = urlParts[1];

    await supabase.storage.from('product-images').remove([fileName]);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Replace existing product image with new one
 * @param file - New image file
 * @param sellerId - Seller UUID
 * @param productId - Product UUID
 * @param oldUrl - Previous image URL (optional)
 */
export async function replaceProductImage(
  file: File,
  sellerId: string,
  productId: string,
  oldUrl?: string
): Promise<UploadResult> {
  // Upload new image
  const result = await uploadProductImage(file, sellerId, productId);

  // If successful and old URL exists, delete old image
  if (result.success && oldUrl) {
    await deleteProductImage(oldUrl);
  }

  return result;
}
