'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';
import { Seller, Product } from '../../../types/database';
import Link from 'next/link';

interface CartItem extends Product {
  quantity: number;
}

export default function SellerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerAndProducts();
  }, [sellerId]);

  async function fetchSellerAndProducts() {
    try {
      // Fetch seller info
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (sellerError) throw sellerError;
      setSeller(sellerData);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function addToCart(product: Product) {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.id !== productId);
    });
  }

  function getTotalPrice() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  function proceedToOrder() {
    // Store cart in sessionStorage and navigate to order form
    sessionStorage.setItem('cart', JSON.stringify(cart));
    sessionStorage.setItem('sellerId', sellerId);
    router.push(`/order/${sellerId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan menu...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Peniaga tidak dijumpai</p>
          <Link href="/sellers" className="text-orange-600 hover:text-orange-700 mt-4 inline-block">
            ← Kembali ke Senarai Peniaga
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-24">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/sellers" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
            ← Kembali ke Senarai Peniaga
          </Link>
          
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
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {seller.shop_name}
            </h1>
            {seller.description && (
              <p className="text-gray-600">{seller.description}</p>
            )}
          </div>
        </header>

        {products.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">Tiada produk tersedia buat masa ini.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const cartItem = cart.find((item) => item.id === product.id);
              const quantity = cartItem?.quantity || 0;

              const isLowStock = !product.is_preorder && product.stock_quantity > 0 && product.stock_quantity <= 5;
              
              return (
                <div
                  key={product.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {product.name}
                    </h3>
                    <span className="text-lg font-bold text-orange-600">
                      RM {product.price.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.is_preorder && (
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                        📅 Pre-Order
                      </span>
                    )}
                    {isLowStock && (
                      <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                        ⚠️ Stok Terhad ({product.stock_quantity})
                      </span>
                    )}
                    {product.available_from && product.available_until && (
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                        ⏰ Tawaran Terhad
                      </span>
                    )}
                    {product.category && (
                      <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-gray-600 mb-4">{product.description}</p>
                  )}
                  
                  {quantity === 0 ? (
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
                    >
                      Tambah ke Pesanan
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-orange-50 p-2 rounded-lg">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="bg-orange-500 text-white w-8 h-8 rounded-lg hover:bg-orange-600 transition"
                      >
                        -
                      </button>
                      <span className="font-semibold text-gray-800">
                        {quantity}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-orange-500 text-white w-8 h-8 rounded-lg hover:bg-orange-600 transition"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-200 shadow-lg p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {cart.reduce((total, item) => total + item.quantity, 0)} item(s)
              </p>
              <p className="text-xl font-bold text-gray-800">
                RM {getTotalPrice().toFixed(2)}
              </p>
            </div>
            <button
              onClick={proceedToOrder}
              className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition font-semibold"
            >
              Teruskan Pesanan →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
