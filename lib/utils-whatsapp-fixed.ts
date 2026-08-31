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
  
  // Build WhatsApp message template - PASTIKAN menggunakan newlines literal
  const whatsappTemplate = `🍽️ *ORDER SAJIAN SEMATANG*

🧾 *Order ID:*
${orderDetails.orderId}

👤 *Nama:*
${orderDetails.customerName}

📞 *Telefon:*
${orderDetails.customerPhone}

📍 *Alamat:*
${addressDisplay}

🗺️ *Google Maps:*
${mapsDisplay}

--------------------

🛒 *PESANAN*

${itemsFormatted.join('\n')}

--------------------

Subtotal: RM${orderDetails.subtotal.toFixed(2)}
Delivery: RM${orderDetails.deliveryFee.toFixed(2)}

💰 *JUMLAH: RM${orderDetails.totalPrice.toFixed(2)}*

🚚 *Kaedah:*
${deliveryMethod}

Terima kasih.`;
  
  // Tambah special notes jika ada
  let finalTemplate = whatsappTemplate;
  if (orderDetails.specialNotes) {
    // Insert notes sebelum "Terima kasih."
    const insertIndex = finalTemplate.lastIndexOf('Terima kasih.');
    const beforeThanks = finalTemplate.substring(0, insertIndex);
    const afterThanks = finalTemplate.substring(insertIndex);
    finalTemplate = `${beforeThanks}

📝 *Catatan:*
${orderDetails.specialNotes}

${afterThanks}`;
  }
  
  // Tambah jarak untuk delivery jika ada
  if (orderDetails.deliveryMode === 'Delivery' && orderDetails.calculatedDistance) {
    // Gantikan delivery method dengan jarak menggunakan pendekatan yang lebih selamat
    const lines = finalTemplate.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('🚚 *Kaedah:*')) {
        // Ini baris header, baris seterusnya adalah delivery method
        if (i + 1 < lines.length) {
          lines[i + 1] = `${deliveryMethod} (~${orderDetails.calculatedDistance.toFixed(1)}km)`;
        }
        break;
      }
    }
    finalTemplate = lines.join('\n');
  }
  
  // Tambah masa penghantaran jika ada
  if (orderDetails.deliveryDateTime) {
    const deliveryTimeFormatted = new Date(orderDetails.deliveryDateTime).toLocaleString('ms-MY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Insert delivery time sebelum "Terima kasih."
    const insertIndex = finalTemplate.lastIndexOf('Terima kasih.');
    const beforeThanks = finalTemplate.substring(0, insertIndex);
    const afterThanks = finalTemplate.substring(insertIndex);
    finalTemplate = `${beforeThanks}

📅 *Masa Penghantaran:*
${deliveryTimeFormatted}

${afterThanks}`;
  }
  
  // PASTIKAN template di-encode dengan betul untuk WhatsApp
  // encodeURIComponent akan handle semua special characters termasuk emoji
  const encodedMessage = encodeURIComponent(finalTemplate);
  return `https://wa.me/${adminNumber}?text=${encodedMessage}`;
}