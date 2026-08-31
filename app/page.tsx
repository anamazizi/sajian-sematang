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
      const supabase = createClient();
      // Phase R5.4: Explicit column selection - NEVER include cost_price for customers
      // Master Prompt Seksyen 66: Customer tidak boleh lihat cost_price
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          seller_id,
          name,
          description,
          price,
          category,
          is_available,
          stock_quantity,
          is_preorder,
          available_from,
          available_until,
          created_at,
          updated_at
        `)
        .eq('is_available', true)
        .gt('stock_quantity', 0)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      // Get product stats (likes & total sold) from view
      const { data: statsData } = await supabase
        .from('product_stats')
        .select('id, total_likes, total_sold')
        .in('id', data?.map(p => p.id) || []);

      // Combine products with stats
      const productsWithStats = (data || []).map(product => {
        const stats = statsData?.find(s => s.id === product.id);
        return {
          ...product,
          total_likes: stats?.total_likes || 0,
          total_sold: stats?.total_sold || 0
        };
      });

      if (error) throw error;
      setProducts(productsWithStats);
    } catch (err) {
      console.error('Error fetching products:', err);
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
    // Get any seller_id from cart (for backward compatibility with old order system)
    const sellerId = cart[0].seller_id;
    router.push(`/order/${sellerId}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-yellow-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-600">
                🍽️ Sajian Sematang
              </h1>
              <p className="text-gray-600 text-sm">Platform Tempahan Makanan</p>
            </div>

            <div className="flex items-center gap-3">
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
                  <h2 className="text-2xl font-bold text-gray-800">
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
                            <h3 className="font-bold text-lg text-gray-800">
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
                              <span className="font-bold text-gray-800 text-lg">
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
