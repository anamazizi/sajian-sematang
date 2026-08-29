'use client';

// Phase R3E: Stock History & Audit Trail
// View all stock movements for seller's products

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import { StockMovementWithProduct, Product } from '../../../types/database';
import Link from 'next/link';

export default function StockHistoryPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [sellerId, setSellerId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovementWithProduct[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Authentication & Authorization
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && profile && profile.role !== 'seller') {
      router.push('/');
      return;
    }

    if (!authLoading && user) {
      fetchSellerRecord();
    }
  }, [user, profile, authLoading]);

  // Fetch seller record
  async function fetchSellerRecord() {
    if (!user) return;

    try {
      const { data: seller, error } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching seller:', error);
        return;
      }

      if (!seller) {
        router.push('/seller/onboarding');
        return;
      }

      setSellerId(seller.id);
      fetchProducts(seller.id);
      fetchStockMovements(seller.id);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  }

  // Fetch seller's products for filter
  async function fetchProducts(sellerIdParam: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .eq('seller_id', sellerIdParam)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  }

  // Fetch stock movements
  async function fetchStockMovements(sellerIdParam: string) {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, image_url)
        `)
        .eq('seller_id', sellerIdParam)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching stock movements:', error);
        setLoading(false);
        return;
      }

      setMovements(data as any || []);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setLoading(false);
    }
  }

  // Filter movements by product
  const filteredMovements = selectedProduct === 'all'
    ? movements
    : movements.filter(m => m.product_id === selectedProduct);

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Render adjustment badge
  function renderAdjustmentBadge(adjustment: number) {
    if (adjustment > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          +{adjustment}
        </span>
      );
    } else if (adjustment < 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          {adjustment}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          0
        </span>
      );
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan sejarah stok...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/seller"
            className="text-green-600 hover:text-green-700 inline-flex items-center gap-2 mb-4"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Sejarah Stok</h1>
          <p className="text-gray-600 mt-2">
            Rekod perubahan stok produk anda
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tapis mengikut produk:
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Semua Produk ({movements.length})</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Movements List */}
        {filteredMovements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg">
              {selectedProduct === 'all'
                ? 'Tiada sejarah perubahan stok lagi'
                : 'Tiada perubahan stok untuk produk ini'}
            </p>
            <p className="text-gray-500 mt-2">
              Perubahan stok akan direkodkan secara automatik apabila anda mengemas kini kuantiti produk
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {movement.product?.image_url ? (
                      <img
                        src={movement.product.image_url}
                        alt={movement.product.name || 'Product'}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">📦</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {movement.product?.name || 'Product Deleted'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(movement.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Stock Change */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Stok Lama</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {movement.previous_quantity}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Perubahan</p>
                      {renderAdjustmentBadge(movement.adjustment_quantity)}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Stok Baharu</p>
                      <p className="text-lg font-semibold text-green-600">
                        {movement.new_quantity}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reason & Notes */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Sebab:</span>{' '}
                      <span className="font-medium text-gray-700">
                        {movement.reason}
                      </span>
                    </div>
                    {movement.changed_by_role && (
                      <div>
                        <span className="text-gray-500">Oleh:</span>{' '}
                        <span className="font-medium text-gray-700 capitalize">
                          {movement.changed_by_role}
                        </span>
                      </div>
                    )}
                    {movement.notes && (
                      <div className="w-full">
                        <span className="text-gray-500">Nota:</span>{' '}
                        <span className="text-gray-700">{movement.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Maklumat</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sejarah stok direkodkan secara automatik</li>
            <li>• Semua perubahan kuantiti produk akan disimpan</li>
            <li>• Rekod tidak boleh dipadam (audit trail)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

