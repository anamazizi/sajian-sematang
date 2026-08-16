# 🚀 Complete Implementation Code

Kod lengkap untuk implement semua features. Copy dan paste ke dalam files yang berkaitan.

## ✅ Already Done
- ✅ Database schema updated
- ✅ Types updated  
- ✅ WhatsApp function updated with Google Maps link
- ✅ Utility functions created

## 🔧 Files to Update

### 1. Update Seller Dashboard - Hide Customer Info

**File: `app/dashboard/page.tsx`**

Find and replace the order card section (around line 146-195):

```typescript
{filteredOrders.map((order) => {
  const nextStatus = getNextStatus(order.status);
  
  return (
    <div
      key={order.id}
      className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500"
    >
      <div className="flex justify-between items-start mb-4">
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
          {order.is_custom_preorder && order.delivery_datetime && (
            <p className="text-sm text-purple-600 mt-1">
              📅 Pre-Order: {new Date(order.delivery_datetime).toLocaleString('ms-MY')}
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      {/* Order Items */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Item Pesanan:</h4>
        <div className="space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.quantity}x {item.product?.name || 'Produk'}
              </span>
              <span className="text-gray-800 font-medium">
                RM {(item.unit_price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t mt-2 pt-2 flex justify-between font-bold">
          <span>Jumlah:</span>
          <span className="text-green-600">
            RM {order.total_price.toFixed(2)}
          </span>
        </div>
        {order.special_notes && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-gray-600">
              <strong>Catatan:</strong> {order.special_notes}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {nextStatus && (
          <button
            onClick={() => updateOrderStatus(order.id, nextStatus)}
            className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition font-semibold"
          >
            Tukar ke "{nextStatus}"
          </button>
        )}
        {order.status !== 'Cancelled' && order.status !== 'Completed' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'Cancelled')}
            className="px-4 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
})}
```

**Key Changes:**
- Removed `customer_name` display
- Removed `customer_phone` display  
- Show only Order ID (first 8 chars)
- Show items count
- Show pre-order datetime if applicable
- Customer details NOT visible to seller

---

### 2. Add Pre-Order Button to Menu Page

**File: `app/sellers/[id]/page.tsx`**

Add this after the "Kembali ke Senarai Peniaga" link (around line 123):

```typescript
<header className="mb-8">
  <Link href="/sellers" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
    ← Kembali ke Senarai Peniaga
  </Link>
  
  {/* ADD THIS SECTION */}
  <Link href="/preorder">
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg mb-4 hover:shadow-xl transition cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">📅 Pre-Order Khas</h3>
          <p className="text-sm text-purple-100">Untuk Majlis / Tarikh Spesifik - Pilih Tarikh & Masa Sendiri</p>
        </div>
        <span className="text-3xl">→</span>
      </div>
    </div>
  </Link>
  {/* END OF NEW SECTION */}
  
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h1 className="text-3xl font-bold text-gray-800 mb-2">
      {seller.shop_name}
    </h1>
    {seller.description && (
      <p className="text-gray-600">{seller.description}</p>
    )}
  </div>
</header>
```

---

### 3. Update Order Form with Profile Management

**File: `app/order/[sellerId]/page.tsx`**

This is a large file. Here are the key additions:

#### A. Add imports at top:
```typescript
import { getCustomerProfile, saveCustomerProfile, clearCustomerProfile } from '../../../lib/supabase/client';
import type { CustomerProfile } from '../../../types/database';
```

#### B. Add state variables (after existing useState declarations):
```typescript
const [profile, setProfile] = useState<CustomerProfile | null>(null);
const [isEditingProfile, setIsEditingProfile] = useState(false);
const [customerAddress, setCustomerAddress] = useState('');
const [customerPinLocation, setCustomerPinLocation] = useState('');
```

#### C. Add useEffect to load profile:
```typescript
useEffect(() => {
  // Load cart from sessionStorage
  const savedCart = sessionStorage.getItem('cart');
  const savedSellerId = sessionStorage.getItem('sellerId');

  if (!savedCart || savedSellerId !== sellerId) {
    router.push('/sellers');
    return;
  }

  setCart(JSON.parse(savedCart));
  
  // Load customer profile
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
}, [sellerId, router]);
```

#### D. Replace the form section with profile confirmation + form:
```typescript
{/* Profile Confirmation or Form */}
{profile && !isEditingProfile ? (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 className="text-xl font-semibold mb-4">✅ Maklumat Anda</h2>
    <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-lg">
      <p><strong>Nama:</strong> {profile.name}</p>
      <p><strong>Telefon:</strong> {profile.phone}</p>
      <p><strong>Alamat:</strong> {profile.address}</p>
      {profile.pinLocation && (
        <p><strong>Pin Location:</strong> <a href={profile.pinLocation} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat di Maps</a></p>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold disabled:bg-gray-400"
      >
        {submitting ? 'Menghantar...' : 'Teruskan Order'}
      </button>
      <button
        onClick={() => setIsEditingProfile(true)}
        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
      >
        Edit Maklumat
      </button>
      <button
        onClick={() => {
          clearCustomerProfile();
          setProfile(null);
          setCustomerName('');
          setCustomerPhone('');
          setCustomerAddress('');
          setCustomerPinLocation('');
          setIsEditingProfile(true);
        }}
        className="px-4 bg-red-100 text-red-700 py-3 rounded-lg hover:bg-red-200 transition font-semibold"
      >
        Tukar Pengguna
      </button>
    </div>
  </div>
) : (
  <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-4">Maklumat Pelanggan</h2>
    
    <div className="mb-4">
      <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
        Nama Penuh <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        placeholder="Masukkan nama anda"
        required
        disabled={submitting}
      />
    </div>

    <div className="mb-4">
      <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
        Nombor Telefon <span className="text-red-500">*</span>
      </label>
      <input
        type="tel"
        id="phone"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        placeholder="Contoh: 0123456789"
        required
        disabled={submitting}
      />
    </div>

    <div className="mb-4">
      <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
        Alamat Kompleks/Rumah <span className="text-red-500">*</span>
      </label>
      <textarea
        id="address"
        value={customerAddress}
        onChange={(e) => setCustomerAddress(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        placeholder="Contoh: No 123, Jalan ABC, Taman XYZ, 12345 Kuala Lumpur"
        rows={3}
        required
        disabled={submitting}
      />
    </div>

    <div className="mb-6">
      <label htmlFor="pinLocation" className="block text-gray-700 font-medium mb-2">
        Pin Location (Google Maps Link)
      </label>
      <input
        type="url"
        id="pinLocation"
        value={customerPinLocation}
        onChange={(e) => setCustomerPinLocation(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        placeholder="https://maps.google.com/..."
        disabled={submitting}
      />
      <p className="text-xs text-gray-500 mt-1">
        Optional: Share location dari Google Maps untuk penghantaran lebih tepat
      </p>
    </div>

    <button
      type="submit"
      disabled={submitting}
      className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {submitting ? 'Menghantar Pesanan...' : 'Hantar Pesanan'}
    </button>
  </form>
)}
```

#### E. Update handleSubmit function:
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError('');
  setSubmitting(true);

  try {
    // Validation
    if (!customerName.trim() || !customerPhone.trim()) {
      throw new Error('Sila isi semua maklumat yang diperlukan');
    }

    if (!customerAddress.trim()) {
      throw new Error('Sila isi alamat anda');
    }

    if (cart.length === 0) {
      throw new Error('Tiada item dalam pesanan');
    }

    const totalPrice = getTotalPrice();

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        customer_pin_location: customerPinLocation.trim() || null,
        seller_id: sellerId,
        total_price: totalPrice,
        status: 'New',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = cart.map((item) => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Save customer profile to localStorage
    const profileData: CustomerProfile = {
      name: customerName.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim(),
      pinLocation: customerPinLocation.trim(),
    };
    saveCustomerProfile(profileData);

    // Clear cart
    sessionStorage.removeItem('cart');
    sessionStorage.removeItem('sellerId');

    // Redirect to success page
    router.push(`/order/success/${orderData.id}`);
  } catch (err: any) {
    console.error('Error submitting order:', err);
    setError(err.message || 'Ralat semasa menghantar pesanan. Sila cuba lagi.');
  } finally {
    setSubmitting(false);
  }
}
```

---

### 4. Update Success Page with WhatsApp

**File: `app/order/success/[orderId]/page.tsx`**

#### A. Add imports:
```typescript
import { generateWhatsAppLink } from '../../../../lib/utils';
```

#### B. Add state for WhatsApp link:
```typescript
const [whatsappLink, setWhatsappLink] = useState<string>('');
```

#### C. Update fetchOrder function to generate WhatsApp link:
```typescript
async function fetchOrder() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    setOrder(data);

    // Fetch order items with product details
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*, product:products(*)')
      .eq('order_id', orderId);

    if (itemsData) {
      // Generate WhatsApp link
      const waLink = generateWhatsAppLink({
        orderId: data.id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerAddress: data.customer_address,
        customerPinLocation: data.customer_pin_location,
        items: itemsData.map(item => ({
          name: item.product?.name || 'Produk',
          quantity: item.quantity,
          price: item.unit_price,
        })),
        totalPrice: data.total_price,
        deliveryDateTime: data.delivery_datetime,
        specialNotes: data.special_notes,
      });
      setWhatsappLink(waLink);
    }
  } catch (error) {
    console.error('Error fetching order:', error);
  } finally {
    setLoading(false);
  }
}
```

#### D. Add WhatsApp button in the UI (after order details):
```typescript
<div className="space-y-3">
  <p className="text-sm text-gray-600">
    Sila simpan nombor telefon anda untuk dihubungi oleh peniaga.
  </p>
  
  {whatsappLink && (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold text-center"
    >
      📱 Hantar ke WhatsApp Admin
    </a>
  )}
  
  <Link
    href="/sellers"
    className="inline-block w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold text-center"
  >
    Kembali ke Senarai Peniaga
  </Link>
  <Link
    href="/"
    className="inline-block w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold text-center"
  >
    Halaman Utama
  </Link>
</div>
```

---

## 🧪 Testing Steps

1. **Test Profile Save**
   - Make first order
   - Check localStorage in browser DevTools
   - Verify profile saved

2. **Test Profile Load**
   - Make second order
   - Should see saved profile
   - Test "Teruskan Order" button
   - Test "Edit Maklumat" button
   - Test "Tukar Pengguna" button

3. **Test WhatsApp Link**
   - Complete order
   - Click "Hantar ke WhatsApp Admin"
   - Verify message format
   - Check Google Maps link is clickable

4. **Test Seller Privacy**
   - Go to seller dashboard
   - Verify customer name/phone/address NOT visible
   - Only order ID and items shown

5. **Test Pre-Order Button**
   - Go to any seller menu page
   - See purple Pre-Order button at top
   - Click should go to `/preorder`

---

## 📱 Expected WhatsApp Message Format

```
🍽️ PESANAN BARU - SAJIAN SEMATANG

📋 ID Pesanan: 12345678

👤 Maklumat Pelanggan:
Nama: Ahmad bin Ali
Telefon: 0123456789
Alamat: No 123, Jalan ABC, Taman XYZ
📍 Lokasi Maps: https://maps.google.com/...

🛒 Item Pesanan:
1. Nasi Lemak Special
   2x RM8.50 = RM17.00
2. Teh Tarik
   1x RM2.50 = RM2.50

💰 Jumlah: RM19.50

---
Pesanan dibuat melalui Sajian Sematang
```

---

## ✅ Implementation Checklist

- [ ] Update seller dashboard (hide customer info)
- [ ] Add pre-order button to menu page
- [ ] Update order form with profile management
- [ ] Update success page with WhatsApp button
- [ ] Test profile save/load
- [ ] Test WhatsApp link generation
- [ ] Test seller privacy
- [ ] Test all user flows

---

**Note:** Apply changes one file at a time and test after each change!
