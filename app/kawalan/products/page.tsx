'use client';

// Pengurusan Produk - Admin Only
// Route: /kawalan/products

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import { Product } from '../../../types/database';
import Link from 'next/link';

export default function AdminProductsManagementPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'preorder'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && profile && profile.role !== 'seller') {
      router.push('/');
      return;
    }

    fetchSellerAndProducts();
  }, [user, profile, authLoading]);

  useEffect(() => {
    applyFilters();
  }, [products, filter, searchQuery]);

  async function fetchSellerAndProducts() {
    if (!user) return;

    try {
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (sellerError || !seller) {
        router.push('/kawalan');
        return;
      }

      setSellerId(seller.id);

      // Phase R5.4: Explicit column selection (seller CAN see cost_price for own products)
      // Added is_archived column for soft delete filtering
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          seller_id,
          name,
          description,
          price,
          cost_price,
          category,
          image_url,
          is_available,
          is_archived,
          stock_quantity,
          is_preorder,
          available_from,
          available_until,
          created_at,
          updated_at
        `)
        .eq('seller_id', seller.id)
        .eq('is_archived', false) // Only fetch non-archived products
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...products];

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(p => p.is_available && !p.is_preorder);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(p => !p.is_available);
    } else if (filter === 'preorder') {
      filtered = filtered.filter(p => p.is_preorder);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }

  async function handleToggleAvailability(productId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', productId)
        .eq('seller_id', sellerId);

      if (error) throw error;

      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_available: !currentStatus } : p
      ));

      alert(currentStatus ? 'Produk dinyahaktifkan' : 'Produk diaktifkan');
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Gagal mengemas kini status produk');
    }
  }

  async function handleDelete(productId: string) {
    const confirmed = confirm(
      'Adakah anda pasti mahu meng-archive produk ini?\n\n' +
      '✅ Produk akan disimpan dalam sistem untuk rekod jualan lama\n' +
      '✅ Produk TIDAK akan muncul di senarai produk atau di homepage pelanggan\n' +
      '✅ Produk boleh dipulihkan (unarchive) oleh admin jika diperlukan\n\n' +
      'Tindakan ini ialah SOFT DELETE sahaja - rekod jualan lalu tidak akan terjejas.'
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_available: false,
          is_archived: true 
        })
        .eq('id', productId)
        .eq('seller_id', sellerId);

      if (error) throw error;

      // Remove product from state since we filter is_archived = false in fetch
      setProducts(products.filter(p => p.id !== productId));

      alert('✅ Produk berjaya di-archive\n\nProduk tidak lagi kelihatan di mana-mana senarai, tetapi rekod jualan lalu dikekalkan.');
    } catch (error) {
      console.error('Error archiving product:', error);
      alert('❌ Gagal meng-archive produk');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link
                href="/kawalan"
                className="text-green-600 hover:text-green-700 mb-2 inline-block"
              >
                ← Kembali ke Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📦 Produk Saya
              </h1>
              <p className="text-gray-600">
                Urus produk dan stok kedai anda
              </p>
            </div>
            <Link
              href="/jualan/products/new"
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
            >
              + Tambah Produk Baharu
            </Link>
          </div>
        </header>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'all'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semua ({products.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'active'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aktif ({products.filter(p => p.is_available && !p.is_preorder).length})
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'inactive'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tidak Aktif ({products.filter(p => !p.is_available).length})
              </button>
              <button
                onClick={() => setFilter('preorder')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'preorder'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pre-Order ({products.filter(p => p.is_preorder).length})
              </button>
            </div>

            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? `Tiada produk dijumpai untuk "${searchQuery}"`
                : 'Anda belum mempunyai produk. Tambah produk pertama anda!'}
            </p>
            {!searchQuery && (
              <Link
                href="/jualan/products/new"
                className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
              >
                + Tambah Produk
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-200">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      🍛
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {product.is_preorder ? (
                      <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                        Pre-Order
                      </span>
                    ) : product.is_available ? (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        Tidak Aktif
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase">
                      {product.category || 'Tanpa Kategori'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Pricing */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Harga Jualan</p>
                      <p className="text-lg font-bold text-green-600">
                        RM {product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Harga Kos</p>
                      <p className="text-sm font-semibold text-gray-700">
                        RM {product.cost_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Stock */}
                  {!product.is_preorder && (
                    <div className="mb-3 pb-3 border-b">
                      <p className="text-xs text-gray-500">Stok</p>
                      <p className={`text-sm font-semibold ${
                        product.stock_quantity > 10
                          ? 'text-green-600'
                          : product.stock_quantity > 0
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {product.stock_quantity} unit
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/jualan/products/${product.id}/edit`}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => handleToggleAvailability(product.id, product.is_available)}
                      className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                        product.is_available
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {product.is_available ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
