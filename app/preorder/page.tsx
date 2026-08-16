'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import { Product, Seller } from '../../types/database';
import Link from 'next/link';

interface ProductWithSeller extends Product {
  seller?: Seller;
}

interface CartItem {
  product: ProductWithSeller;
  quantity: number;
  notes: string;
}

export default function CustomPreOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPreOrderProducts();
    
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    setDeliveryDate(minDate);
  }, []);

  async function fetchPreOrderProducts() {
    try {
      // Fetch all pre-order products with seller info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          seller:sellers(*)
        `)
        .eq('is_preorder', true)
        .eq('is_available', true)
        .order('seller_id', { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product: ProductWithSeller) {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1, notes: '' }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.product.id !== productId);
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }

  function updateNotes(productId: string, notes: string) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  }

  function getTotalPrice() {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validation
      if (!customerName.trim() || !customerPhone.trim()) {
        throw new Error('Sila isi nama dan nombor telefon');
      }

      if (!deliveryDate || !deliveryTime) {
        throw new Error('Sila pilih tarikh dan masa penghantaran');
      }

      if (cart.length === 0) {
        throw new Error('Sila tambah sekurang-kurangnya satu produk');
      }

      // Combine date and time
      const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`);

      // Group cart items by seller
      const ordersBySeller = cart.reduce((acc, item) => {
        const sellerId = item.product.seller_id;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      // Create separate order for each seller
      const orderPromises = Object.entries(ordersBySeller).map(async ([sellerId, items]) => {
        const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        
        // Combine all notes
        const allNotes = items
          .filter(item => item.notes.trim())
          .map(item => `${item.product.name}: ${item.notes}`)
          .join('\n');

        // Insert order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            seller_id: sellerId,
            total_price: totalPrice,
            status: 'New',
            is_custom_preorder: true,
            delivery_datetime: deliveryDateTime.toISOString(),
            special_notes: allNotes || null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order items
        const orderItems = items.map((item) => ({
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        return orderData.id;
      });

      const orderIds = await Promise.all(orderPromises);

      // Redirect to success page (use first order ID)
      router.push(`/order/success/${orderIds[0]}`);
    } catch (err: any) {
      console.error('Error submitting pre-order:', err);
      setError(err.message || 'Ralat semasa menghantar pesanan. Sila cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  // Group products by seller
  const productsBySeller = products.reduce((acc, product) => {
    const sellerId = product.seller_id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        seller: product.seller,
        products: [],
      };
    }
    acc[sellerId].products.push(product);
    return acc;
  }, {} as Record<string, { seller?: Seller; products: ProductWithSeller[] }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan produk pre-order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Kembali ke Halaman Utama
          </Link>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📅 Pre-Order Khas
            </h1>
            <p className="text-gray-600">
              Tempah makanan untuk tarikh dan masa pilihan anda. Sesuai untuk majlis, event, atau pesanan pukal.
            </p>
          </div>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Delivery Date & Time Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">📆 Pilih Tarikh & Masa Penghantaran</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="deliveryDate" className="block text-gray-700 font-medium mb-2">
                Tarikh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="deliveryDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label htmlFor="deliveryTime" className="block text-gray-700 font-medium mb-2">
                Masa <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="deliveryTime"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>
          {deliveryDate && deliveryTime && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Penghantaran/Pengambilan:</strong>{' '}
                {new Date(`${deliveryDate}T${deliveryTime}`).toLocaleString('ms-MY', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>

        {/* Products Catalog */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🍽️ Katalog Produk Pre-Order</h2>
          
          {products.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600">Tiada produk pre-order tersedia buat masa ini.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(productsBySeller).map(([sellerId, { seller, products: sellerProducts }]) => (
                <div key={sellerId} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-purple-600 mb-4">
                    🏪 {seller?.shop_name || 'Peniaga'}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerProducts.map((product) => {
                      const cartItem = cart.find((item) => item.product.id === product.id);
                      const quantity = cartItem?.quantity || 0;

                      return (
                        <div
                          key={product.id}
                          className="border border-gray-200 p-4 rounded-lg hover:shadow-lg transition"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-800">{product.name}</h4>
                            <span className="text-lg font-bold text-purple-600">
                              RM {product.price.toFixed(2)}
                            </span>
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                          )}
                          
                          {quantity === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition text-sm"
                            >
                              Tambah ke Pesanan
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-purple-50 p-2 rounded-lg">
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="bg-purple-500 text-white w-8 h-8 rounded-lg hover:bg-purple-600 transition text-sm"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                                  className="w-16 text-center font-semibold border border-gray-300 rounded"
                                  min="1"
                                />
                                <button
                                  onClick={() => addToCart(product)}
                                  className="bg-purple-500 text-white w-8 h-8 rounded-lg hover:bg-purple-600 transition text-sm"
                                >
                                  +
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Catatan khas (optional)"
                                value={cartItem?.notes || ''}
                                onChange={(e) => updateNotes(product.id, e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary - Fixed at bottom */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-purple-200 shadow-lg p-4 z-50">
            <div className="container mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">
                    {cart.reduce((total, item) => total + item.quantity, 0)} item(s)
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    RM {getTotalPrice().toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const form = document.getElementById('customerForm');
                    form?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-purple-500 text-white px-8 py-3 rounded-lg hover:bg-purple-600 transition font-semibold"
                >
                  Teruskan ke Borang →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Information Form */}
        {cart.length > 0 && (
          <form id="customerForm" onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-xl font-semibold mb-4">👤 Maklumat Pelanggan</h2>
            
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Nama Penuh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Masukkan nama anda"
                required
                disabled={submitting}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                Nombor Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Contoh: 0123456789"
                required
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !deliveryDate || !deliveryTime}
              className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menghantar Pre-Order...' : 'Hantar Pre-Order'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
