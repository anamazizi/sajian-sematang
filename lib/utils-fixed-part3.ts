// ============================================
// Master Prompt Seksyen 107: All operations in Asia/Kuala_Lumpur (UTC+8)
// ============================================

/**
 * Get current date/time in Malaysia timezone (Asia/Kuala_Lumpur)
 * Use this for ALL business logic requiring "today" or "now"
 */
export function getMalaysiaTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
}

/**
 * Convert UTC timestamp to Malaysia date (for "today" comparisons)
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
  
  // Build WhatsApp message template dengan format yang betul
  const whatsappTemplate = `🏦 *RESIT PEMBAYARAN - SAJIAN SEMATANG*

📋 *Maklumat Pembayaran:*
Penerima: ${payoutDetails.sellerName}
Jumlah: RM ${payoutDetails.amount.toFixed(2)}
Kaedah: ${payoutDetails.paymentMethod}
${payoutDetails.referenceNumber ? `Rujukan: ${payoutDetails.referenceNumber}\n` : ''}Tarikh: ${new Date(payoutDetails.paidDate).toLocaleString('ms-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}

📦 *Pesanan Dibayar:*
${payoutDetails.orderIds.map((id, index) => `${index + 1}. #${id.substring(0, 8)}`).join('\n')}

Jumlah Pesanan: ${payoutDetails.orderIds.length}
${payoutDetails.notes ? `\n📝 *Catatan:*\n${payoutDetails.notes}\n` : ''}
---
Terima kasih atas perkhidmatan anda!
Sajian Sematang`;
  
  // Encode template untuk WhatsApp
  const encodedMessage = encodeURIComponent(whatsappTemplate);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}