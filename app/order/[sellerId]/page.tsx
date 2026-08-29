'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

  useEffect(() => {
    // Check if cart is empty
    if (cart.length === 0) {
      router.push('/sellers');
      return;
    }
    
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
  }, [cart, router]);

  // Calculate delivery fee when mode or pin location changes
  useEffect(() => {
    if (deliveryMode === 'Delivery' && customerPinLocation) {
      const { distance, fee } = calculateDeliveryFee(customerPinLocation);
      setCalculatedDistance(distance);
      setDeliveryFee(fee);
    } else {
      setDeliveryFee(0);
      setCalculatedDistance(0);
    }
  }, [deliveryMode, customerPinLocation]);

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

      // Redirect to success page
      router.push(`/order/success/${result.order_id}`);
    } catch (err: any) {
      console.error('Error submitting order:', err);
      setError(err.message || 'Ralat semasa menghantar pesanan. Sila cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8">
          <Link
            href={`/sellers/${sellerId}`}
            className="text-orange-600 hover:text-orange-700 mb-4 inline-block"
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
              <p className="text-2xl font-bold text-orange-600">
                RM {getTotalPrice().toFixed(2)}
              </p>
            </div>
          </div>
        </div>

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
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-orange-300'
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
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-orange-300'
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
            
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit()}
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
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-orange-300'
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
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-orange-300'
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

            {deliveryMode === 'Delivery' && (
              <>
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

                <div className="mb-4">
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
                    Untuk pengiraan caj penghantaran yang tepat
                  </p>
                </div>

                {calculatedDistance > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      📏 Jarak anggaran: ~{calculatedDistance.toFixed(1)}km
                      <br />
                      💵 Caj penghantaran: RM{deliveryFee.toFixed(2)}
                      <br />
                      <span className="text-xs">
                        (Minima RM1 untuk bawah 1km, nombor bulat untuk 1km ke atas)
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menghantar Pesanan...' : 'Hantar Pesanan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
