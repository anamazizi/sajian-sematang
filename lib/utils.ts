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
    
    // Format 3: https://goo.gl/maps/... or other formats
    // For now, return null if can't parse
    return null;
  } catch (e) {
    console.error('Error extracting coordinates:', e);
    return null;
  }
}

// Calculate delivery fee based on Google Maps URL
export function calculateDeliveryFee(googleMapsUrl: string, storeCoords = DEFAULT_STORE_COORDS): { distance: number; fee: number } {
  // Extract customer coordinates from Google Maps URL
  const customerCoords = extractCoordinatesFromUrl(googleMapsUrl);
  
  let distance = 5; // Default 5km if can't parse
  
  if (customerCoords) {
    // Calculate actual distance using Haversine formula
    distance = calculateDistance(
      storeCoords.lat,
      storeCoords.lng,
      customerCoords.lat,
      customerCoords.lng
    );
  }
  
  // Pricing logic:
  // < 1km = RM1 (minimum)
  // >= 1km = Floor (6.9km = RM6, 7.1km = RM7)
  let fee = 0;
  if (distance < 1) {
    fee = 1;
  } else {
    fee = Math.floor(distance);
  }
  
  return { distance, fee };
}

// Format phone number to WhatsApp format (+60XXXXXXXXX)
// Format phone number to WhatsApp format (+60XXXXXXXXX)
export function formatPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return '601110890100'; // Default admin number
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/[^\d]/g, '');
  
  if (!digitsOnly) return '601110890100';
  
  // If number starts with 0, replace with 60
  if (digitsOnly.startsWith('0')) {
    return '60' + digitsOnly.substring(1);
  }
  
  // If number starts with 60, keep as is
  if (digitsOnly.startsWith('60')) {
    return digitsOnly;
  }
  
  // If number starts with country code +, keep digits only
  if (digitsOnly.startsWith('6')) {
    return digitsOnly;
  }
  
  // Default: prepend 60
  return '60' + digitsOnly;
}

// Helper to format delivery mode
export function formatDeliveryMode(mode: string): string {
  return mode === 'Delivery' ? '🚗 Penghantaran' : '🏪 Ambil Sendiri';
}

// Generate WhatsApp message link (HARDCODED TO ADMIN HQ)
export function generateWhatsAppLink(orderDetails: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerPinLocation?: string;
  items: Array<{ 
    name: string; 
    quantity: number;
    price: number;
    selectedOptions?: Array<{
      option_name: string;
      price_adjustment: number;
    }>;
  }>;
  subtotal: number;
  deliveryFee: number;
  totalPrice: number;
  deliveryMode: string;
  calculatedDistance?: number;
  deliveryDateTime?: string;
  specialNotes?: string;
}): string {
  // HARUS KE ADMIN HQ SAHAJA: +601110890100
  const adminNumber = '601110890100';
  
  // Format items untuk pesanan
  const itemsFormatted = orderDetails.items.map(item => {
    const itemTotal = item.price * item.quantity;
    let itemText = `${item.quantity}x ${item.name}`;
    
    // Tambah options jika ada
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      const optionsText = item.selectedOptions.map(opt => {
        const priceText = opt.price_adjustment > 0 ? ` (+RM${opt.price_adjustment.toFixed(2)})` : '';
        return `${opt.option_name}${priceText}`;
      }).join(', ');
      
      itemText += ` (${optionsText})`;
    }
    
    itemText += ` - RM${itemTotal.toFixed(2)}`;
    return itemText;
  });
  
  // Format delivery method
  const deliveryMethod = orderDetails.deliveryMode === 'Delivery' ? 'Penghantaran' : 'Ambil Sendiri';
  
  // Format alamat dan Google Maps - jangan fallback jika mod Self-Pickup
  let addressDisplay = '-';
  let mapsDisplay = '-';
  
  if (orderDetails.deliveryMode === 'Delivery') {
    // Untuk Delivery, tunjukkan alamat dan Google Maps
    addressDisplay = orderDetails.customerAddress || '-';
    mapsDisplay = orderDetails.customerPinLocation || '-';
  } else {
    // Untuk Self-Pickup, jangan tunjukkan alamat atau maps
    addressDisplay = 'Ambil Sendiri';
    mapsDisplay = 'Ambil Sendiri';
  }
  
  // Bina mesej menggunakan array join
  const lines = [
    '🍽️ *ORDER SAJIAN SEMATANG*',
    '',
    '🧾 *Order ID:*',
    orderDetails.orderId.substring(0, 8),
    '',
    '👤 *Nama:*',
    orderDetails.customerName,
    '',
    '📞 *Telefon:*',
    orderDetails.customerPhone,
    '',
    '📍 *Alamat:*',
    addressDisplay,
    '',
    '🗺️ *Google Maps:*',
    mapsDisplay,
    '',
    '--------------------',
    '',
    '🛒 *PESANAN*',
    '',
    ...itemsFormatted,
    '',
    '--------------------',
    '',
    `Subtotal: RM${orderDetails.subtotal.toFixed(2)}`,
    `Delivery: RM${orderDetails.deliveryFee.toFixed(2)}`,
    '',
    `💰 *JUMLAH: RM${orderDetails.totalPrice.toFixed(2)}*`,
    '',
    '🚚 *Kaedah:*',
    deliveryMethod,
    '',
    'Terima kasih.'
  ];
  
  // Jika ada catatan khas, tambah selepas kaedah
  if (orderDetails.specialNotes) {
    lines.splice(lines.length - 2, 0, '', '📝 *Catatan:*', orderDetails.specialNotes);
  }
  
  // Jika ada jarak untuk delivery, tambah dalam kaedah
  if (orderDetails.deliveryMode === 'Delivery' && orderDetails.calculatedDistance) {
    const distanceIndex = lines.indexOf('🚚 *Kaedah:*') + 1;
    lines[distanceIndex] = `${deliveryMethod} (~${orderDetails.calculatedDistance.toFixed(1)}km)`;
  }
  
  // Jika ada masa penghantaran, tambah selepas kaedah
  if (orderDetails.deliveryDateTime) {
    const dateIndex = lines.indexOf('🚚 *Kaedah:*') + 2;
    lines.splice(dateIndex, 0, '', '📅 *Masa Penghantaran:*', 
      new Date(orderDetails.deliveryDateTime).toLocaleString('ms-MY', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }
  
  const fullMessage = lines.join('\n');
  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(fullMessage)}`;
}
/**
 * Get current time in Malaysia timezone (Asia/Kuala_Lumpur)
 * Use for "today" calculations in reports
 */
export function getMalaysiaTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
}

/**
 * Convert UTC timestamp from database to Malaysia timezone
 * @param utcTimestamp - ISO string from database (timestamptz stored as UTC)
 * @returns Date object in Malaysia timezone
 */
export function convertToMalaysiaTime(utcTimestamp: string): Date {
  return new Date(new Date(utcTimestamp).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
}

/**
 * Get start of today in Malaysia timezone (00:00:00)
 * Use for "today's orders" queries
 */
export function getMalaysiaTodayStart(): Date {
  const now = getMalaysiaTime();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Get end of today in Malaysia timezone (23:59:59)
 * Use for "today's orders" queries
 */
export function getMalaysiaTodayEnd(): Date {
  const now = getMalaysiaTime();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

/**
 * Check if a UTC timestamp is "today" in Malaysia timezone
 * @param utcTimestamp - ISO string from database
 */
export function isTodayInMalaysia(utcTimestamp: string): boolean {
  const malaysiaDate = convertToMalaysiaTime(utcTimestamp);
  const today = getMalaysiaTime();
  
  return (
    malaysiaDate.getDate() === today.getDate() &&
    malaysiaDate.getMonth() === today.getMonth() &&
    malaysiaDate.getFullYear() === today.getFullYear()
  );
}

// Format date for display (Malaysia timezone)
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ms-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format currency
export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

// Generate WhatsApp payout receipt message
export function generatePayoutWhatsAppLink(payoutDetails: {
  sellerName: string;
  sellerPhone: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  orderIds: string[];
  paidDate: string;
  notes?: string;
}): string {
  // Format phone number (remove +, spaces, dashes)
  const phoneNumber = payoutDetails.sellerPhone.replace(/[\s\-+]/g, '');
  
  let message = `🏦 *RESIT PEMBAYARAN - SAJIAN SEMATANG*\\n\\n`;
  
  message += `📋 *Maklumat Pembayaran:*\\n`;
  message += `Penerima: ${payoutDetails.sellerName}\\n`;
  message += `Jumlah: RM ${payoutDetails.amount.toFixed(2)}\\n`;
  message += `Kaedah: ${payoutDetails.paymentMethod}\\n`;
  
  if (payoutDetails.referenceNumber) {
    message += `Rujukan: ${payoutDetails.referenceNumber}\\n`;
  }
  
  message += `Tarikh: ${new Date(payoutDetails.paidDate).toLocaleString('ms-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}\\n\\n`;
  
  message += `📦 *Pesanan Dibayar:*\\n`;
  payoutDetails.orderIds.forEach((id, index) => {
    message += `${index + 1}. #${id.substring(0, 8)}\\n`;
  });
  
  message += `\\nJumlah Pesanan: ${payoutDetails.orderIds.length}\\n`;
  
  if (payoutDetails.notes) {
    message += `\\n📝 *Catatan:*\\n${payoutDetails.notes}\\n`;
  }
  
  message += `\\n---\\n`;
  message += `Terima kasih atas perkhidmatan anda!\\n`;
  message += `Sajian Sematang`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}
