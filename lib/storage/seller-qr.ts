// Seller QR DuitNow Upload Helper
// Phase R3A: Seller Onboarding

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
 * Upload seller's DuitNow QR code to Supabase Storage
 * @param file - Image file (JPEG, PNG, WebP)
 * @param sellerId - Seller's UUID
 * @returns Public URL of uploaded QR or error
 */
export async function uploadSellerQR(
  file: File,
  sellerId: string
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
    const fileName = `${sellerId}/qr-${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('seller-qr')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: 'Gagal memuat naik fail. Sila cuba lagi.',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('seller-qr')
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
 * Delete old QR code from storage
 * @param oldUrl - Previous QR URL to delete
 */
export async function deleteSellerQR(oldUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = oldUrl.split('/seller-qr/');
    if (urlParts.length < 2) return;

    const fileName = urlParts[1];

    await supabase.storage.from('seller-qr').remove([fileName]);
  } catch (error) {
    console.error('Error deleting old QR:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Replace existing QR with new one
 * @param file - New QR file
 * @param sellerId - Seller UUID
 * @param oldUrl - Previous QR URL (optional)
 */
export async function replaceSellerQR(
  file: File,
  sellerId: string,
  oldUrl?: string
): Promise<UploadResult> {
  // Upload new QR
  const result = await uploadSellerQR(file, sellerId);

  // If successful and old URL exists, delete old QR
  if (result.success && oldUrl) {
    await deleteSellerQR(oldUrl);
  }

  return result;
}
