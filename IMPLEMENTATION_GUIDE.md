# 🚀 Implementation Guide - Local Profile & WhatsApp Integration

Panduan lengkap untuk implement features baru yang diminta.

## ✅ Completed

### 1. Database Schema Updates
- ✅ Added `customer_address` field
- ✅ Added `customer_pin_location` field  
- ✅ Added `whatsapp_sent` flag
- File: [`supabase/schema.sql`](supabase/schema.sql)

### 2. TypeScript Types
- ✅ Updated `Order` interface
- ✅ Created `CustomerProfile` interface
- File: [`types/database.ts`](types/database.ts)

### 3. Utility Functions
- ✅ `saveCustomerProfile()` - Save to localStorage
- ✅ `getCustomerProfile()` - Load from localStorage
- ✅ `clearCustomerProfile()` - Clear profile
- ✅ `generateWhatsAppLink()` - Generate WA message
- File: [`lib/utils.ts`](lib/utils.ts)

## 🔄 Pending Implementation

### 1. Update Order Form (`app/order/[sellerId]/page.tsx`)

#### Add Profile Management
```typescript
import { getCustomerProfile, saveCustomerProfile } from '../../../lib/utils';

// Add state
const [profile, setProfile] = useState<CustomerProfile | null>(null);
const [isEditingProfile, setIsEditingProfile] = useState(false);
const [customerAddress, setCustomerAddress] = useState('');
const [customerPinLocation, setCustomerPinLocation] = useState('');

// Load profile on mount
useEffect(() => {
  const savedProfile = getCustomerProfile();
  if (savedProfile) {
    setProfile(savedProfile);
    setCustomerName(savedProfile.name);
    setCustomerPhone(savedProfile.phone);
    setCustomerAddress(savedProfile.address);
    setCustomerPinLocation(savedProfile.pinLocation);
  } else {
    setIsEditingProfile(true);
  }
}, []);
```

#### Add Profile Confirmation Screen
```tsx
{profile && !isEditingProfile ? (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 className="text-xl font-semibold mb-4">✅ Maklumat Anda</h2>
    <div className="space-y-2 mb-4">
      <p><strong>Nama:</strong> {profile.name}</p>
      <p><strong>Telefon:</strong> {profile.phone}</p>
      <p><strong>Alamat:</strong> {profile.address}</p>
      {profile.pinLocation && (
        <p><strong>Pin Location:</strong> {profile.pinLocation}</p>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => {/* proceed to submit */}}
        className="flex-1 bg-orange-500 text-white py-2 rounded-lg"
      >
        Teruskan Order
      </button>
      <button
        onClick={() => setIsEditingProfile(true)}
        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg"
      >
        Edit Maklumat
      </button>
    </div>
  </div>
) : (
  // Show form...
)}
```

#### Update Submit Handler
```typescript
// Save profile after successful order
const profileData: CustomerProfile = {
  name: customerName.trim(),
  phone: customerPhone.trim(),
  address: customerAddress.trim(),
  pinLocation: customerPinLocation.trim(),
};
saveCustomerProfile(profileData);

// Include address in order
const { data: orderData, error: orderError } = await supabase
  .from('orders')
  .insert({
    customer_name: customerName.trim(),
    customer_phone: customerPhone.trim(),
    customer_address: customerAddress.trim() || null,
    customer_pin_location: customerPinLocation.trim() || null,
    seller_id: sellerId,
    total_price: totalPrice,
    status: 'New',
  })
  .select()
  .single();
```

### 2. Update Success Page (`app/order/success/[orderId]/page.tsx`)

#### Add WhatsApp Integration
```typescript
import { generateWhatsAppLink } from '../../../../lib/utils';

// Fetch order items
const { data: itemsData } = await supabase
  .from('order_items')
  .select('*, product:products(*)')
  .eq('order_id', orderId);

// Generate WhatsApp link
const whatsappLink = generateWhatsAppLink({
  orderId: order.id,
  customerName: order.customer_name,
  customerPhone: order.customer_phone,
  customerAddress: order.customer_address,
  items: itemsData.map(item => ({
    name: item.product.name,
    quantity: item.quantity,
    price: item.unit_price,
  })),
  totalPrice: order.total_price,
  deliveryDateTime: order.delivery_datetime,
  specialNotes: order.special_notes,
});
```

#### Add WhatsApp Button
```tsx
<a
  href={whatsappLink}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold text-center"
>
  📱 Hantar ke WhatsApp Admin
</a>
```

### 3. Update Seller Dashboard (`app/dashboard/page.tsx`)

#### Hide Customer Details
```tsx
// Replace customer info display with:
<div>
  <p className="text-sm text-gray-500 mb-1">
    {new Date(order.created_at).toLocaleString('ms-MY')}
  </p>
  <h3 className="text-xl font-semibold text-gray-800">
    Pesanan #{order.id.substring(0, 8)}
  </h3>
  <p className="text-gray-600">
    {order.items?.length || 0} item(s)
  </p>
</div>

// Remove these lines:
// <h3>...{order.customer_name}</h3>
// <p>📞 {order.customer_phone}</p>
```

### 4. Add Pre-Order Button to Menu Page (`app/sellers/[id]/page.tsx`)

#### Add Button at Top
```tsx
<header className="mb-8">
  <Link href="/sellers" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
    ← Kembali ke Senarai Peniaga
  </Link>
  
  {/* Add this */}
  <Link href="/preorder">
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg mb-4 hover:shadow-xl transition cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">📅 Pre-Order Khas</h3>
          <p className="text-sm text-purple-100">Untuk Majlis / Tarikh Spesifik</p>
        </div>
        <span className="text-2xl">→</span>
      </div>
    </div>
  </Link>
  
  <div className="bg-white p-6 rounded-lg shadow-md">
    {/* existing seller info */}
  </div>
</header>
```

### 5. Update Pre-Order Page (`app/preorder/page.tsx`)

Apply same changes as order form:
- Load profile from localStorage
- Show confirmation screen
- Save profile after order
- Generate WhatsApp link
- Add address & pin location fields

## 📋 Form Fields to Add

### Customer Form Template
```tsx
<div className="mb-4">
  <label className="block text-gray-700 font-medium mb-2">
    Alamat Kompleks/Rumah <span className="text-red-500">*</span>
  </label>
  <textarea
    value={customerAddress}
    onChange={(e) => setCustomerAddress(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
    placeholder="Contoh: No 123, Jalan ABC, Taman XYZ"
    rows={3}
    required
  />
</div>

<div className="mb-4">
  <label className="block text-gray-700 font-medium mb-2">
    Pin Location (Google Maps Link)
  </label>
  <input
    type="url"
    value={customerPinLocation}
    onChange={(e) => setCustomerPinLocation(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
    placeholder="https://maps.google.com/..."
  />
  <p className="text-xs text-gray-500 mt-1">
    Optional: Share location dari Google Maps untuk penghantaran lebih tepat
  </p>
</div>
```

## 🔐 Privacy Implementation

### Seller Dashboard - Hide Customer Info
```typescript
// Don't fetch or display:
// - customer_name
// - customer_phone  
// - customer_address
// - customer_pin_location

// Only show:
// - Order ID (first 8 chars)
// - Items list
// - Total price
// - Status
// - Created date
```

### Admin Access via WhatsApp
- Customer details sent to admin via WhatsApp
- Admin can contact customer directly
- Seller doesn't need customer contact info

## 🎯 User Flow

### First Time User
1. Browse products → Add to cart
2. Click "Teruskan Pesanan"
3. Fill form (Name, Phone, Address, Pin Location)
4. Submit order
5. Profile saved to localStorage
6. Success page with WhatsApp button

### Returning User
1. Browse products → Add to cart
2. Click "Teruskan Pesanan"
3. See saved profile with "Teruskan Order" button
4. Option to edit or change user
5. Submit order
6. Success page with WhatsApp button

## 📱 WhatsApp Message Format

```
🍽️ *PESANAN BARU - SAJIAN SEMATANG*

📋 *ID Pesanan:* 12345678

👤 *Maklumat Pelanggan:*
Nama: Ahmad bin Ali
Telefon: 0123456789
Alamat: No 123, Jalan ABC, Taman XYZ

🛒 *Item Pesanan:*
1. Nasi Lemak Special
   2x RM8.50 = RM17.00
2. Teh Tarik
   1x RM2.50 = RM2.50

💰 *Jumlah: RM19.50*

---
Pesanan dibuat melalui Sajian Sematang
```

## 🧪 Testing Checklist

- [ ] First order saves profile to localStorage
- [ ] Returning user sees saved profile
- [ ] Edit profile works correctly
- [ ] Clear profile / Change user works
- [ ] WhatsApp link generates correctly
- [ ] WhatsApp message format is correct
- [ ] Seller dashboard hides customer info
- [ ] Pre-order button visible on menu page
- [ ] Address & pin location saved to database
- [ ] All forms validate properly

## 🚀 Deployment Notes

1. Run database migration for new fields
2. Test localStorage in different browsers
3. Test WhatsApp link on mobile devices
4. Verify privacy settings on seller dashboard
5. Test profile persistence across sessions

---

**Implementation Priority:**
1. ✅ Database & Types (Done)
2. ✅ Utility Functions (Done)
3. 🔄 Order Form Updates
4. 🔄 Success Page WhatsApp
5. 🔄 Seller Dashboard Privacy
6. 🔄 Pre-Order Button
7. 🔄 Pre-Order Form Updates

**Estimated Time:** 2-3 hours for full implementation
