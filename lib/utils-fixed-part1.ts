import { CustomerProfile } from '../types/database';

// ============================================
// PHASE R6.2: Profile Management
// ============================================
// Master Prompt Seksyen 12: Database is source of truth
// LocalStorage functions are DEPRECATED - use database instead
// ============================================

// LocalStorage keys (DEPRECATED)
const CUSTOMER_PROFILE_KEY = 'sajian_customer_profile';

// Default store coordinates (Seri Manjung, Perak)
const DEFAULT_STORE_COORDS = {
  lat: 4.2167,
  lng: 100.6333
};

/**
 * @deprecated PHASE R6.2: Use database (users table) as source of truth
 * Profile should be fetched from Supabase, not localStorage
 * This function is kept for backward compatibility only
 */
export function saveCustomerProfile(profile: CustomerProfile): void {
  console.warn('⚠️ saveCustomerProfile is DEPRECATED. Use database (users table) instead.');
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
  }
}

/**
 * @deprecated PHASE R6.2: Use database (users table) as source of truth
 * Profile should be fetched from Supabase, not localStorage
 * This function is kept for backward compatibility only
 */
export function getCustomerProfile(): CustomerProfile | null {
  console.warn('⚠️ getCustomerProfile is DEPRECATED. Use database (users table) instead.');
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CUSTOMER_PROFILE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing customer profile:', e);
        return null;
      }
    }
  }
  return null;
}

/**
 * @deprecated PHASE R6.2: Use database (users table) as source of truth
 * Profile should be fetched from Supabase, not localStorage
 * This function is kept for backward compatibility only
 */
export function clearCustomerProfile(): void {
  console.warn('⚠️ clearCustomerProfile is DEPRECATED. Use database (users table) instead.');
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CUSTOMER_PROFILE_KEY);
  }
}

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Extract coordinates from Google Maps URL
export function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  try {
    // Try to extract from various Google Maps URL formats
    // Format 1: https://maps.google.com/?q=4.2167,100.6333
    const coordMatch1 = url.match(/q=([-\d.]+),([-\d.]+)/);
    if (coordMatch1) {
      return { lat: parseFloat(coordMatch1[1]), lng: parseFloat(coordMatch1[2]) };
    }
    
    // Format 2: https://www.google.com/maps/@4.2167,100.6333,15z
    const coordMatch2 = url.match(/@([-\d.]+),([-\d.]+)/);
    if (coordMatch2) {
      return { lat: parseFloat(coordMatch2[1]), lng: parseFloat(coordMatch2[2]) };
    }
    
    // Format 3: https://www.google.com/maps/place/4.2167,100.6333
    const coordMatch3 = url.match(/place\/([-\d.]+),([-\d.]+)/);
    if (coordMatch3) {
      return { lat: parseFloat(coordMatch3[1]), lng: parseFloat(coordMatch3[2]) };
    }
    
    // Format 4: https://maps.app.goo.gl/xxxx?q=4.2167,100.6333
    const coordMatch4 = url.match(/q=([-\d.]+)%2C([-\d.]+)/);
    if (coordMatch4) {
      return { lat: parseFloat(coordMatch4[1]), lng: parseFloat(coordMatch4[2]) };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
}

// Calculate delivery fee based on distance (Master Prompt Seksyen 24)
export function calculateDeliveryFee(
  distanceKm: number,
  minFee: number = 3,
  perKmRate: number = 1
): number {
  if (distanceKm < 0) return minFee;
  
  // Master Prompt Seksyen 24: fee_ringgit = floor(distance_km)
  // With minimum fee of RM3 for distance < 1km
  if (distanceKm < 1) {
    return minFee;
  }
  
  // Calculate fee = floor(distance_km)
  const fee = Math.floor(distanceKm);
  
  return Math.max(minFee, fee);
}

export function formatDeliveryMode(mode: string): string {
  return mode === 'Delivery' ? '🚗 Penghantaran' : '🏪 Ambil Sendiri';
}