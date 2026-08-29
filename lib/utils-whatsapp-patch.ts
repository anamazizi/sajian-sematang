// PATCH for lib/utils.ts - Replace generateWhatsAppLink function (lines 123-202)
// Phase R4D Part 4: Add options support to WhatsApp message

// Generate WhatsApp message link (with delivery mode)
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
  const adminNumber = '601110890100'; // +60 11-1089 0100
  
  let message = `🍽️ *PESANAN BARU - SAJIAN SEMATANG*\\n\\n`;
  message += `📋 *ID Pesanan:* ${orderDetails.orderId.substring(0, 8)}\\n\\n`;
  
  message += `👤 *Maklumat Pelanggan:*\\n`;
  message += `Nama: ${orderDetails.customerName}\\n`;
  message += `Telefon: ${orderDetails.customerPhone}\\n`;
  if (orderDetails.customerAddress) {
    message += `Alamat: ${orderDetails.customerAddress}\\n`;
  }
  if (orderDetails.customerPinLocation) {
    message += `📍 Lokasi Maps: ${orderDetails.customerPinLocation}\\n`;
  }
  message += `\\n`;
  
  message += `🚚 *Mod Pesanan:* ${formatDeliveryMode(orderDetails.deliveryMode)}\\n`;
  if (orderDetails.deliveryMode === 'Delivery' && orderDetails.calculatedDistance) {
    message += `📏 Jarak: ~${orderDetails.calculatedDistance.toFixed(1)}km\\n`;
  }
  message += `\\n`;
  
  if (orderDetails.deliveryDateTime) {
    message += `📅 *Masa Penghantaran:*\\n`;
    message += `${new Date(orderDetails.deliveryDateTime).toLocaleString('ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}\\n\\n`;
  }
  
  message += `🛒 *Item Pesanan:*\\n`;
  orderDetails.items.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\\n`;
    
    // Display selected options (Phase R4D)
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      item.selectedOptions.forEach((opt) => {
        message += `   • ${opt.option_name}`;
        if (opt.price_adjustment > 0) {
          message += ` (+RM${opt.price_adjustment.toFixed(2)})`;
        }
        message += `\\n`;
      });
    }
    
    message += `   ${item.quantity}x RM${item.price.toFixed(2)} = RM${(item.quantity * item.price).toFixed(2)}\\n`;
  });
  message += `\\n`;
  
  message += `💵 *Ringkasan Harga:*\\n`;
  message += `Subtotal: RM${orderDetails.subtotal.toFixed(2)}\\n`;
  message += `Caj Penghantaran: RM${orderDetails.deliveryFee.toFixed(2)}\\n`;
  message += `*JUMLAH: RM${orderDetails.totalPrice.toFixed(2)}*\\n`;
  
  if (orderDetails.specialNotes) {
    message += `\\n📝 *Catatan Khas:*\\n${orderDetails.specialNotes}\\n`;
  }
  
  message += `\\n---\\n`;
  message += `Pesanan dibuat melalui Sajian Sematang`;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${adminNumber}?text=${encodedMessage}`;
}

function formatDeliveryMode(mode: string): string {
  return mode === 'Delivery' ? '🚗 Penghantaran' : '🏪 Ambil Sendiri';
}
