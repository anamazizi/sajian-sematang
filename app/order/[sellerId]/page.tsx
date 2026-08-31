'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MapPicker from '../../../components/MapPicker';
import { supabase } from '../../../lib/supabase/client';
import { CustomerProfile } from '../../../types/database';
import { getCustomerProfile, saveCustomerProfile, clearCustomerProfile, calculateDeliveryFee } from '../../../lib/utils';
import { createOrder } from '../../actions/create-order';
import { useCart } from '../../../contexts/CartContext';
import Link from 'next/link';

export default function OrderFormPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.sellerId as string;
  
  // Use Cart Context
  const { cart, getCartTotal: getCartSubtotal, getCartCount, clearCart } = useCart();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPinLocation, setCustomerPinLocation] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'Delivery' | 'Self-Pickup'>('Self-Pickup');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [calculatedDistance, setCalculatedDistance] = useState(0);
// State untuk MapPicker
  const [mapLocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    googleMapsLink: string;
  } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  useEffect(() => {
    // Check if cart is empty
    if (cart.length === 0) {
      router.push('/sellers');
      return;
    }
    
    // Load customer profile from DATABASE (source of truth)
    loadProfileFromDatabase();
  }, [cart, router]);

  async function loadProfileFromDatabase() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      // Fetch profile from database (include latitude/longitude for MapPicker)
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('name, phone_number, address, google_maps_url, latitude, longitude')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setIsEditingProfile(true);
        return;
      }

      if (userProfile && userProfile.name && userProfile.phone_number && userProfile.address) {
        // Auto-fill from database
        setCustomerName(userProfile.name);
        setCustomerPhone(userProfile.phone_number);
        setCustomerAddress(userProfile.address);
        setCustomerPinLocation(userProfile.google_maps_url || '');
        
        // Set map location if coordinates exist
        if (userProfile.latitude && userProfile.longitude) {
          setMapLocation({
            latitude: userProfile.latitude,
            longitude: userProfile.longitude,
            address: userProfile.address,
            googleMapsLink: userProfile.google_maps_url || `https://www.google.com/maps?q=${userProfile.latitude},${userProfile.longitude}`,
          });
        }
        
        // Also save to CustomerProfile format (for backward compatibility)
        const profileData: CustomerProfile = {
          name: userProfile.name,
          phone: userProfile.phone_number,
          address: userProfile.address,
          pinLocation: userProfile.google_maps_url || '',
        };
        setProfile(profileData);
      } else {
        // Profile incomplete - should not happen if middleware works
        setIsEditingProfile(true);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setIsEditingProfile(true);
    }
  }

  // Manual delivery fee logic (pending Google API integration)
  useEffect(() => {
    if (deliveryMode === 'Delivery') {
      // Set to RM 0.00 - will be confirmed via WhatsApp
      setDeliveryFee(0);
      setCalculatedDistance(0);
    } else {
      setDeliveryFee(0);
      setCalculatedDistance(0);
    }
  }, [deliveryMode]);

  function getTotalPrice() {
    return getCartSubtotal() + deliveryFee;
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Client-side validation
      if (!customerName.trim() || !customerPhone.trim()) {
        throw new Error('Sila isi nama dan nombor telefon');
      }

      if (deliveryMode === 'Delivery' && !customerAddress.trim()) {
        throw new Error('Sila isi alamat untuk penghantaran');
      }

      if (cart.length === 0) {
        throw new Error('Tiada item dalam pesanan');
      }

      const totalPrice = getTotalPrice();

      // Call Server Action (replaces direct Supabase insert)
      // Server will validate prices, check stock, and create order atomically
      const result = await createOrder({
        seller_id: sellerId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: deliveryMode === 'Delivery' ? customerAddress.trim() : undefined,
        customer_pin_location: deliveryMode === 'Delivery' ? customerPinLocation.trim() : undefined,
        delivery_mode: deliveryMode,
        delivery_fee: deliveryFee,
        calculated_distance: calculatedDistance,
        total_price: totalPrice, // Will be validated server-side
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions || [],  // Phase R4D: Pass options to server
        })),
        special_notes: undefined, // Can add customer notes field later
      });

      // Handle server response
      if (!result.success) {
        throw new Error(result.error || 'Gagal membuat tempahan');
      }

      // Success! Save customer profile to localStorage
      const profileData: CustomerProfile = {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        pinLocation: customerPinLocation.trim(),
      };
      saveCustomerProfile(profileData);

      // Clear cart (Context will handle sessionStorage)
      clearCart();

      // Check if WhatsApp link is available for automatic redirect
      if (result.whatsapp_link) {
        // Direct redirect to WhatsApp (no popup blocker issues)
        window.location.href = result.whatsapp_link;
      } else {
        // Fallback: redirect to success page only
        router.push(`/order/success/${result.order_id}`);
      }
    } catch (err: any) {
      console.error('Error submitting order:', err);
      setError(err.message || 'Ralat semasa menghantar pesanan. Sila cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8">
          <Link
            href={`/sellers/${sellerId}`}
            className="text-slate-600 hover:text-slate-700 mb-4 inline-block"
          >
            ← Kembali ke Menu
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📝 Borang Pesanan
          </h1>
          <p className="text-gray-600">Lengkapkan maklumat anda untuk meneruskan pesanan</p>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
          <div className="space-y-3">
            {cart.map((item) => {
              // Calculate item total including options (Phase R4D)
              const basePrice = item.price;
              const optionsTotal = item.selectedOptions?.reduce(
                (sum, opt) => sum + opt.price_adjustment,
                0
              ) || 0;
              const itemUnitPrice = basePrice + optionsTotal;
              const itemTotal = itemUnitPrice * item.quantity;

              return (
                <div key={`${item.id}-${JSON.stringify(item.selectedOptions)}`} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    
                    {/* Display selected options (Phase R4D) */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <div className="ml-2 mt-1 space-y-0.5">
                        {item.selectedOptions.map((opt, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            • {opt.option_name}
                            {opt.price_adjustment > 0 && (
                              <span className="text-green-600">
                                {' '}+RM{opt.price_adjustment.toFixed(2)}
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {item.quantity} x RM {itemUnitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800 ml-2">
                    RM {itemTotal.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between items-center text-gray-700">
              <p>Subtotal</p>
              <p className="font-semibold">RM {getCartSubtotal().toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center text-gray-700">
              <p>Caj Penghantaran</p>
              <p className="font-semibold">RM {deliveryFee.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <p className="text-lg font-bold text-gray-800">Jumlah</p>
              <p className="text-2xl font-bold text-slate-900">
                RM {getTotalPrice().toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Confirmation or Form */}
        {profile && !isEditingProfile ? (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">✅ Maklumat Anda</h2>
            <div className="space-y-2 mb-4 bg-slate-50 p-4 rounded-lg">
              <p className="text-slate-900 dark:text-slate-900"><strong>Nama:</strong> {profile.name}</p>
              <p className="text-slate-900 dark:text-slate-900"><strong>Telefon:</strong> {profile.phone}</p>
              <p className="text-slate-900 dark:text-slate-900"><strong>Alamat:</strong> {profile.address}</p>
              {profile.pinLocation && (
                <p className="text-slate-900 dark:text-slate-900"><strong>Pin Location:</strong> <a href={profile.pinLocation} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lihat di Maps</a></p>
              )}
            </div>
            
            {/* Delivery Mode Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Mod Pesanan <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('Self-Pickup')}
                  className={`p-4 rounded-lg border-2 transition ${
                    deliveryMode === 'Self-Pickup'
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🏪</div>
                  <div className="font-semibold">Ambil Sendiri</div>
                  <div className="text-xs text-gray-600">Tiada caj</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode('Delivery')}
                  className={`p-4 rounded-lg border-2 transition ${
                    deliveryMode === 'Delivery'
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🚗</div>
                  <div className="font-semibold">Penghantaran</div>
                  <div className="text-xs text-gray-600">
                    {deliveryFee > 0 ? `RM${deliveryFee.toFixed(2)}` : 'Auto-calculate'}
                  </div>
                </button>
              </div>
            </div>
            
            {deliveryMode === 'Delivery' && calculatedDistance > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  📏 Jarak anggaran: ~{calculatedDistance.toFixed(1)}km
                  <br />
                  💵 Caj penghantaran: RM{deliveryFee.toFixed(2)}
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="w-full bg-yellow-400 text-slate-900 py-3 rounded-lg hover:bg-yellow-500 transition font-semibold disabled:bg-gray-400"
              >
                {submitting ? 'Menghantar...' : 'Teruskan Order'}
              </button>
              <Link
                href="/profile"
                className="w-full text-center bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Edit Maklumat
              </Link>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Contoh: 0123456789"
                required
                disabled={submitting}
              />
            </div>

            {/* Delivery Mode Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Mod Pesanan <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('Self-Pickup')}
                  className={`p-4 rounded-lg border-2 transition ${
                    deliveryMode === 'Self-Pickup'
                      ? 'border-orange-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🏪</div>
                  <div className="font-semibold">Ambil Sendiri</div>
                  <div className="text-xs text-gray-600">Tiada caj</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode('Delivery')}
                  className={`p-4 rounded-lg border-2 transition ${
                    deliveryMode === 'Delivery'
                      ? 'border-orange-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-2xl mb-1">🚗</div>
                  <div className="font-semibold">Penghantaran</div>
                  <div className="text-xs text-gray-600">Caj disahkan kemudian</div>
                </button>
              </div>
            </div>

            {deliveryMode === 'Delivery' && (
              <>
                {/* Delivery Fee Notice */}
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>Nota:</strong> Caj penghantaran akan dikira mengikut jarak dan disahkan melalui WhatsApp.
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
                    Alamat Kompleks/Rumah <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Contoh: No 123, Jalan ABC, Taman XYZ, 12345 Kuala Lumpur"
                    rows={3}
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Map Picker Toggle */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-700 font-medium">
                      📍 Pin Lokasi Penghantaran
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {showMapPicker ? '↥ Sembunyikan Peta' : '🗺️ Tunjuk Peta Interaktif'}
                    </button>
                  </div>
                  
                  {showMapPicker ? (
                    <div className="mb-4 border border-gray-300 rounded-lg overflow-hidden">
                      <MapPicker
                        initialLat={mapLocation?.latitude || null}
                        initialLng={mapLocation?.longitude || null}
                        initialAddress={customerAddress}
                        onLocationChange={(location) => {
                          setMapLocation(location);
                          setCustomerPinLocation(location.googleMapsLink);
                          // Update address if empty
                          if (!customerAddress.trim()) {
                            setCustomerAddress(location.address);
                          }
                        }}
                        className="h-[300px] w-full"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="url"
                        id="pinLocation"
                        value={customerPinLocation}
                        onChange={(e) => setCustomerPinLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="https://maps.google.com/..."
                        disabled={submitting}
                      />
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Tips:</strong> Klik "Tunjuk Peta Interaktif" untuk pilih lokasi dengan mudah menggunakan peta.
                          Atau tampal pautan Google Maps sahaja.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    📍 Untuk admin/runner semak lokasi anda dengan mudah
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-400 text-slate-900 py-3 rounded-lg hover:bg-yellow-500 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menghantar Pesanan...' : 'Hantar Pesanan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
