'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CustomerProduct } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import OptionSelector from '@/components/OptionSelector';

interface GroupedProducts {
  [category: string]: CustomerProduct[];
}

export default function HomePage() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, getCartTotal, getCartCount } = useCart();
  
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Option selector state
  const [showOptionSelector, setShowOptionSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CustomerProduct | null>(null);

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryMode: 'Self-Pickup' as 'Delivery' | 'Self-Pickup'
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  async function checkUser() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    } else {
      // No session - middleware should redirect, but just in case
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('is_preorder', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        return;
      }

      // Hanya tapis jika produk benar-benar diarkib
      const activeList = (data || []).filter((p: any) => p.is_archived !== true);
      setProducts(activeList);
    } catch (err) {
      console.error('Unexpected error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // Group products by category
  const groupedProducts: GroupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Lain-lain';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as GroupedProducts);

  async function handleAddToCart(product: CustomerProduct) {
    if (!user) {
      alert('Sila log masuk untuk membuat pesanan');
      router.push('/auth/login');
      return;
    }

    // Check if product has options
    const supabase = createClient();
    const { data: options } = await supabase
      .from('product_options')
      .select('id')
      .eq('product_id', product.id)
      .eq('is_available', true)
      .limit(1);

    if (options && options.length > 0) {
      // Product has options - show selector
      setSelectedProduct(product);
      setShowOptionSelector(true);
    } else {
      // No options - add directly
      addToCart({
        id: product.id,
        seller_id: product.seller_id,
        name: product.name,
        price: product.price,
      });
    }
  }

  function handleOptionsSelected(selectedOptions: any[], totalPrice: number) {
    if (!selectedProduct) return;

    addToCart({
      id: selectedProduct.id,
      seller_id: selectedProduct.seller_id,
      name: selectedProduct.name,
      price: selectedProduct.price, // Base price
      selectedOptions,
    });

    setShowOptionSelector(false);
    setSelectedProduct(null);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  }

  function proceedToCheckout() {
    if (cart.length === 0) {
      alert('Bakul anda kosong');
      return;
    }

    // Check if user is logged in
    if (!user) {
      alert('Sila log masuk untuk membuat pesanan');
      router.push('/auth/login');
      return;
    }

    // Load user data into checkout form
    loadUserData();
    
    // Open checkout modal
    setShowCheckoutModal(true);
  }
// Load user data into checkout form
  async function loadUserData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('name, phone_number, address')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCheckoutForm(prev => ({
            ...prev,
            name: profile.name || '',
            phone: profile.phone_number || '',
            address: profile.address || ''
          }));
        } else {
          // Use auth user info as fallback
          setCheckoutForm(prev => ({
            ...prev,
            name: user.user_metadata?.full_name || user.user_metadata?.name || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Handle checkout form input changes
  function handleCheckoutFormChange(field: string, value: string) {
    setCheckoutForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  // Submit order and generate WhatsApp message
  function submitOrder() {
    // Validate form
    if (!checkoutForm.name.trim()) {
      alert('Sila masukkan nama anda');
      return;
    }
    
    if (!checkoutForm.phone.trim()) {
      alert('Sila masukkan nombor telefon anda');
      return;
    }
    
    if (!checkoutForm.address.trim()) {
      alert('Sila masukkan alamat penghantaran');
      return;
    }

    // Format WhatsApp message
    const whatsappMessage = formatWhatsAppMessage();
    
    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/601110890100?text=${encodedMessage}`;
    
    // Close modal first
    setShowCheckoutModal(false);
    
    // Clear cart after successful order
    // Note: In real implementation, you would save order to database first
    // For now, just clear cart and open WhatsApp
    setTimeout(() => {
      // Clear cart - this should be done after database save in production
      // For now, we'll just show WhatsApp
      window.open(whatsappUrl, '_blank');
      
      alert('✅ Pesanan anda telah dihantar ke WhatsApp! Sila selesaikan pesanan anda melalui WhatsApp.');
    }, 100);
  }

  // Format WhatsApp message
  function formatWhatsAppMessage(): string {
    const itemsList = cart.map((item, index) => {
      return `${index + 1}. ${item.name} x ${item.quantity}`;
    }).join('\n');

    const total = getCartTotal().toFixed(2);
    const deliveryText = checkoutForm.deliveryMode === 'Delivery' ? 'Delivery' : 'Self Pickup';
    const deliveryFee = checkoutForm.deliveryMode === 'Delivery' ? 'RM6.00' : 'RM0.00';
    
    return `Nama : ${checkoutForm.name}
No Phone : ${checkoutForm.phone}
Alamat : ${checkoutForm.address}

Senarai Tempahan :
${itemsList}

Jenis Tempahan : ${deliveryText}
Caj Delivery : ${deliveryFee}
Jumlah Perlu Dibayar : RM${total}
Order ID : SS-${Date.now().toString().slice(-6)}`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-sm p-4 mb-8 border border-yellow-100">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-600">
                🍽️ Sajian Sematang
              </h1>
              <p className="text-gray-600 text-sm">Platform Tempahan Makanan</p>
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-end">
              {user ? (
                <>
                  <Link href="/orders">
                    <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-xs font-medium rounded-md text-blue-700 transition border border-blue-200">
                      📋 Pesanan
                    </button>
                  </Link>
                  <Link href="/profile">
                    <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-medium rounded-md text-gray-700 transition">
                      👤 Profil
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-xs font-medium rounded-md text-red-700 transition"
                  >
                    Log Keluar
                  </button>
                </>
              ) : (
                <Link href="/auth/login">
                  <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md transition">
                    Log Masuk
                  </button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Menu Categories */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuatkan menu...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Tiada menu tersedia buat masa ini.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <section key={category}>
                {/* Category Header */}
                <div className="flex items-center mb-4">
                  <h2 className="text-slate-900 font-bold text-lg">
                    {category}
                  </h2>
                  <div className="flex-1 h-px bg-gray-300 ml-4"></div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProducts.map((product) => {
                    const inCart = cart.find((item) => item.id === product.id);
                    const quantity = inCart?.quantity || 0;

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition"
                      >
                        {/* Product Image */}

                        {/* Product Info */}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-slate-900 font-bold text-base">
                              {product.name}
                            </h3>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                              {product.stock_quantity} unit
                            </span>
                          </div>

                          {product.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          {/* Price & Category Badge */}
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-slate-600 font-bold text-xl">
                              RM{product.price.toFixed(2)}
                            </p>
                            {product.is_preorder && (
                              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                                Pre-Order
                              </span>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          {quantity === 0 ? (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="w-full bg-yellow-500 text-white py-2.5 rounded-lg hover:bg-yellow-600 transition font-semibold"
                            >
                              Tambah ke Pesanan
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-yellow-50 p-2 rounded-lg border-2 border-yellow-200">
                              {quantity === 1 ? (
                                <button
                                  onClick={() => {
                                    if (confirm('🗑️ Buang item ini?')) {
                                      removeFromCart(product.id);
                                    }
                                  }}
                                  className="bg-red-500 text-white w-8 h-8 rounded-lg hover:bg-red-600 transition font-bold"
                                >
                                  🗑️
                                </button>
                              ) : (
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="bg-yellow-500 text-white w-8 h-8 rounded-lg hover:bg-yellow-600 transition font-bold"
                                >
                                  −
                                </button>
                              )}
                              <span className="text-slate-900 font-bold text-base">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="bg-yellow-500 text-white w-8 h-8 rounded-lg hover:bg-yellow-600 transition font-bold"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-yellow-200 shadow-lg p-4 z-40">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {getCartCount()} item dalam bakul
              </p>
              <p className="text-xl font-bold text-slate-600">
                RM{getCartTotal().toFixed(2)}
              </p>
            </div>
            <button
              onClick={proceedToCheckout}
              className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition font-semibold shadow-md"
            >
              Teruskan Pesanan →
            </button>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Selesaikan Pesanan</h2>
                <button onClick={() => setShowCheckoutModal(false)} className="text-gray-500 text-2xl">×</button>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-slate-900 mb-3">Ringkasan Pesanan</h3>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between mb-2">
                    <span className="text-slate-900">{item.name} × {item.quantity}</span>
                    <span className="font-bold text-slate-900">RM{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900">Subtotal</span>
                    <span className="font-medium text-slate-900">RM{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); submitOrder(); }}>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">Kaedah Penghantaran</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setCheckoutForm(prev => ({ ...prev, deliveryMode: 'Delivery' }))} className={`p-3 border ${checkoutForm.deliveryMode === 'Delivery' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                        <div className="font-bold text-slate-900">Delivery</div>
                      </button>
                      <button type="button" onClick={() => setCheckoutForm(prev => ({ ...prev, deliveryMode: 'Self-Pickup' }))} className={`p-3 border ${checkoutForm.deliveryMode === 'Self-Pickup' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                        <div className="font-bold text-slate-900">Self Pickup</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">Maklumat Pelanggan</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1">Nama *</label>
                        <input type="text" value={checkoutForm.name} onChange={(e) => handleCheckoutFormChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 text-slate-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1">Telefon *</label>
                        <input type="tel" value={checkoutForm.phone} onChange={(e) => handleCheckoutFormChange('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 text-slate-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1">Alamat *</label>
                        <textarea value={checkoutForm.address} onChange={(e) => handleCheckoutFormChange('address', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400 text-slate-900" required />
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <h3 className="font-bold text-slate-900 mb-2">Ringkasan Bayaran</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>RM{getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Caj Delivery</span>
                        <span>{checkoutForm.deliveryMode === 'Delivery' ? 'RM6.00' : 'RM0.00'}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-bold">Jumlah</span>
                          <span className="font-bold">RM{(getCartTotal() + (checkoutForm.deliveryMode === 'Delivery' ? 6 : 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button type="submit" className="w-full bg-yellow-400 text-slate-900 py-3 rounded hover:bg-yellow-500 font-bold">
                      ✅ Hantar ke WhatsApp
                    </button>
                    <button type="button" onClick={() => setShowCheckoutModal(false)} className="w-full bg-gray-100 text-slate-700 py-2 rounded">
                      Kembali
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
{/* Option Selector Modal */}
      {showOptionSelector && selectedProduct && (
        <OptionSelector
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          basePrice={selectedProduct.price}
          onOptionsSelected={handleOptionsSelected}
          onCancel={() => {
            setShowOptionSelector(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </main>
  );
}
