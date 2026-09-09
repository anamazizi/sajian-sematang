'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getMalaysiaTime } from '@/lib/utils';
import { CustomerProduct } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import OptionSelector from '@/components/OptionSelector';
import { createOrder } from '@/app/actions/create-order';

interface GroupedProducts {
  [category: string]: CustomerProduct[];
}

export default function HomePage() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, getCartTotal, getCartCount, clearCart } = useCart();
  
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [categoriesOrder, setCategoriesOrder] = useState<Array<{name: string, display_order: number}>>([]);
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
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchCategories();
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

  async function fetchCategories() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('name, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      setCategoriesOrder(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
  async function submitOrder() {
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

    // Validate cart not empty
    if (cart.length === 0) {
      alert('Bakul anda kosong');
      return;
    }

    // Group cart items by seller_id
    const itemsBySeller: Record<string, typeof cart> = {};
    cart.forEach(item => {
      if (!itemsBySeller[item.seller_id]) {
        itemsBySeller[item.seller_id] = [];
      }
      itemsBySeller[item.seller_id].push(item);
    });

    // For each seller, create order
    setIsSubmittingOrder(true);
    try {
      const sellerIds = Object.keys(itemsBySeller);
      // For now, we assume only one seller per order (simplified)
      // If multiple sellers, we need to create multiple orders (future enhancement)
      if (sellerIds.length > 1) {
        alert('Sila buat pesanan berasingan untuk setiap penjual. Sistem ini sedang dikemaskini untuk menyokong multi-seller.');
        setIsSubmittingOrder(false);
        return;
      }

      const sellerId = sellerIds[0];
      const sellerItems = itemsBySeller[sellerId];

      // Prepare order items
      const items = sellerItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || []
      }));

      const subtotal = getCartTotal();
      const deliveryFee = checkoutForm.deliveryMode === 'Delivery' ? 6 : 0;
      const totalPrice = subtotal + deliveryFee;

      // Call server action to create order
      const result = await createOrder({
        seller_id: sellerId,
        customer_name: checkoutForm.name.trim(),
        customer_phone: checkoutForm.phone.trim(),
        customer_address: checkoutForm.address.trim(),
        customer_pin_location: undefined, // TODO: implement location pin
        delivery_mode: checkoutForm.deliveryMode,
        delivery_fee: deliveryFee,
        calculated_distance: undefined, // TODO: implement distance calculation
        total_price: totalPrice,
        items,
        special_notes: '', // TODO: add notes field in checkout form
        is_custom_preorder: false,
        delivery_datetime: undefined
      });

      if (!result.success) {
        alert(`Gagal membuat pesanan: ${result.error}`);
        return;
      }

      // Order created successfully
      // Close modal
      setShowCheckoutModal(false);
      
      // Clear cart for this seller (or entire cart)
      // For simplicity, we clear entire cart
      clearCart();
      
      // Open WhatsApp link
      if (result.whatsapp_link) {
        window.open(result.whatsapp_link, '_blank');
        alert('✅ Pesanan anda telah disimpan ke database dan WhatsApp dibuka! Sila selesaikan pesanan anda melalui WhatsApp.');
      } else {
        // Fallback: generate WhatsApp link manually
        const orderId = result.order_id || `SS-${Date.now().toString().slice(-6)}`;
        const itemsList = sellerItems.map(item => 
          `${item.quantity}x ${item.name} - RM${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
        const whatsappMessage = `🍽️ *ORDER SAJIAN SEMATANG*\n\n🧾 *Order ID:*\n${orderId}\n\n👤 *Nama:*\n${checkoutForm.name}\n\n📞 *Telefon:*\n${checkoutForm.phone}\n\n📍 *Alamat:*\n${checkoutForm.address}\n\n🗺️ *Google Maps:*\n-\n\n--------------------\n\n🛒 *PESANAN*\n\n${itemsList}\n\n--------------------\n\nSubtotal: RM${subtotal.toFixed(2)}\nDelivery: RM${deliveryFee.toFixed(2)}\n\n💰 *JUMLAH: RM${totalPrice.toFixed(2)}*\n\n🚚 *Kaedah:*\n${checkoutForm.deliveryMode === 'Delivery' ? 'Penghantaran' : 'Ambil Sendiri'}\n\nTerima kasih.`;
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappUrl = `https://wa.me/601110890100?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        alert('✅ Pesanan anda telah disimpan ke database! WhatsApp dibuka.');
      }

      // Cart already cleared above
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Ralat tidak dijangka. Sila cuba lagi.');
    } finally {
      setIsSubmittingOrder(false);
    }
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
            {Object.entries(groupedProducts)
              .sort(([catA], [catB]) => {
                const orderA = categoriesOrder.find(c => c.name === catA)?.display_order ?? Number.MAX_SAFE_INTEGER;
                const orderB = categoriesOrder.find(c => c.name === catB)?.display_order ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
              })
              .map(([category, categoryProducts]) => (
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
                            {(() => {
                               const startDate = product.preorder_start || product.available_from;
                               const endDate = product.preorder_end || product.available_until;
                               const now = getMalaysiaTime();
                               let badge = null;
                               let statusText = null;
                               if (product.is_preorder && startDate && endDate) {
                                 const start = new Date(startDate);
                                 const end = new Date(endDate);
                                 if (now < start) {
                                   badge = <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">Belum Dibuka</span>;
                                   // Format tarikh untuk paparan
                                   const openDate = new Date(startDate);
                                   statusText = `Dibuka Pada: ${openDate.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'short' })}, ${openDate.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                                 } else if (now >= start && now <= end) {
                                   badge = <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">Pre-Order Aktif</span>;
                                   // Calculate remaining time
                                   const remaining = end.getTime() - now.getTime();
                                   const hours = Math.floor(remaining / (1000 * 60 * 60));
                                   const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                                   statusText = `Tamat dalam: ${hours} jam ${minutes} minit`;
                                 } else if (now > end) {
                                   badge = <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">Pre-Order Ditutup</span>;
                                 }
                               } else if (product.is_preorder) {
                                 // Pre-order tanpa tarikh: anggap aktif
                                 badge = <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">Pre-Order</span>;
                               }
                               return (
                                 <>
                                   {badge}
                                   {statusText && <p className="text-xs text-gray-600 mt-1">{statusText}</p>}
                                 </>
                               );
                             })()}
                          </div>

                          {/* Add to Cart Button */}
                          {(() => {
                             const startDate = product.preorder_start || product.available_from;
                             const endDate = product.preorder_end || product.available_until;
                             const now = getMalaysiaTime();
                             let buttonText = 'Tambah ke Pesanan';
                             let buttonDisabled = false;
                             let buttonOnClick = () => handleAddToCart(product);
                             if (product.is_preorder && startDate && endDate) {
                               const start = new Date(startDate);
                               const end = new Date(endDate);
                               if (now < start) {
                                 buttonText = 'Belum Dibuka';
                                 buttonDisabled = true;
                                 buttonOnClick = async () => {};
                               } else if (now >= start && now <= end) {
                                 // aktif - boleh tempah
                                 buttonText = 'Tempah';
                               } else if (now > end) {
                                 buttonText = 'Telah Ditutup';
                                 buttonDisabled = true;
                                 buttonOnClick = async () => {};
                               }
                             }
                             if (quantity === 0) {
                               return (
                                 <button
                                   onClick={buttonOnClick}
                                   disabled={buttonDisabled}
                                   className={`w-full ${buttonDisabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'} py-2.5 rounded-lg transition font-semibold`}
                                 >
                                   {buttonText}
                                 </button>
                               );
                             } else {
                               // Cart quantity controls
                               return (
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
                               );
                             }
                           })()}
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

              <form onSubmit={(e) => { e.preventDefault(); if (isSubmittingOrder) return; submitOrder(); }}>
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
                        <span className="text-slate-900 font-medium">Subtotal</span>
                        <span className="text-slate-900 font-medium">RM{getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-900 font-medium">Caj Delivery</span>
                        <span className="text-slate-900 font-medium">{checkoutForm.deliveryMode === 'Delivery' ? 'RM6.00' : 'RM0.00'}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-950 font-bold">Jumlah</span>
                          <span className="text-slate-950 font-bold">RM{(getCartTotal() + (checkoutForm.deliveryMode === 'Delivery' ? 6 : 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button type="submit" disabled={isSubmittingOrder} className={`w-full ${isSubmittingOrder ? 'bg-yellow-300 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500'} text-slate-900 py-3 rounded font-bold flex items-center justify-center gap-2`}>
                      {isSubmittingOrder ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></span>
                          Menyimpan pesanan...
                        </>
                      ) : (
                        '✅ Hantar ke WhatsApp'
                      )}
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
