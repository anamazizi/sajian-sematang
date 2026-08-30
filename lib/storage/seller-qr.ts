// Seller QR DuitNow Upload Helper
// Phase R3A: Seller Onboarding

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// BUCKET CONFIGURATION
// IMPORTANT: Change this to match your actual Supabase bucket name
// Check Supabase Dashboard → Storage → Buckets
// SQL schema uses: 'seller-qr' (lowercase)
// If your dashboard shows: 'SELLER-QR' (uppercase), change below:
const BUCKET_NAME = 'SELLER-QR'; // Updated to uppercase per request

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  errorDetails?: any; // For debugging
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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Format fail tidak sah. Sila gunakan JPEG, JPG, PNG, atau WebP.',
      };
    }

    // Validate file size (max 10MB after compression)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Saiz fail terlalu besar. Maksimum 10MB.',
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${sellerId}/qr-${timestamp}.${fileExt}`;

    console.log('📤 Uploading to bucket:', BUCKET_NAME);
    console.log('📄 File path:', fileName);
    console.log('📊 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('🔧 File type:', file.type);

    // Determine content type
    let contentType = 'image/jpeg'; // Default
    if (file.type === 'image/png') contentType = 'image/png';
    else if (file.type === 'image/webp') contentType = 'image/webp';

    // Upload to Supabase Storage with optimized settings
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Allow replacing if exists
        contentType: contentType, // Explicit content type
      });

    if (error) {
      console.error('❌ Upload error (FULL):', JSON.stringify(error, null, 2));
      console.error('❌ Error message:', error.message);
      console.error('❌ Error name:', error.name);
      console.error('❌ Bucket used:', BUCKET_NAME);
      
      // Return VERBOSE error message with actual Supabase error
      let errorMessage = `Gagal memuat naik fail. ${error.message}`;
      
      // Add specific hints based on error type
      if (error.message.includes('Bucket not found')) {
        errorMessage += ` → Bucket "${BUCKET_NAME}" tidak dijumpai. Semak Supabase Dashboard.`;
      } else if (error.message.includes('new row violates row-level security')) {
        errorMessage += ' → Tiada kebenaran RLS. Sila log masuk semula atau hubungi admin.';
      } else if (error.message.includes('payload too large')) {
        errorMessage += ' → Saiz fail melebihi had.';
      } else if (error.message.includes('JWT') || error.message.includes('expired')) {
        errorMessage += ' → Sesi tamat. Sila log masuk semula.';
      }
      
      return {
        success: false,
        error: errorMessage,
        errorDetails: error, // Return full error object for debugging
      };
    }

    console.log('✅ Upload successful:', data?.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('🔗 Public URL:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('❌ Unexpected error (FULL):', JSON.stringify(error, null, 2));
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error?.message);
    return {
      success: false,
      error: `Ralat tidak dijangka: ${error?.message || 'Unknown error'}`,
      errorDetails: error,
    };
  }
}

/**
 * Delete old QR code from storage
 * @param oldUrl - Previous QR URL to delete
 */
export async function deleteSellerQR(oldUrl: string): Promise<void> {
  try {
    // Extract filename from URL (support both lowercase and uppercase bucket names)
    const urlParts = oldUrl.split(new RegExp(`/(seller-qr|SELLER-QR)/`, 'i'));
    if (urlParts.length < 3) {
      console.warn('⚠️ Could not parse URL for deletion:', oldUrl);
      return;
    }

    const fileName = urlParts[2];
    console.log('🗑️ Deleting old QR:', fileName);

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    
    if (error) {
      console.error('❌ Delete error:', error);
    } else {
      console.log('✅ Old QR deleted successfully');
    }
  } catch (error) {
    console.error('❌ Error deleting old QR:', error);
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
