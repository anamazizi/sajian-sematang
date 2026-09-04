'use client';

// Pengurusan Produk - Admin Only
// Route: /kawalan/products

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import { Product, Seller } from '../../../types/database';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

export default function AdminProductsManagementPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'preorder' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && profile && profile.role !== 'admin' && profile.role !== 'staff') {
      router.push('/');
      return;
    }

    fetchAllProducts();
    fetchSellers();
  }, [user, profile, authLoading, router]);

  async function fetchSellers() {
    try {
      const { data: sellersData, error } = await supabase
        .from('sellers')
        .select('*')
        .order('shop_name', { ascending: true });

      if (error) throw error;
      setSellers(sellersData || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  }

  async function fetchAllProducts() {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(product => {
    if (sellerFilter !== 'all' && product.seller_id !== sellerFilter) return false;
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
    
    const isAvailable = product.is_available ?? true;
    const isArchived = product.is_archived ?? false;
    const isPreorder = product.is_preorder ?? false;
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && (!isAvailable || isPreorder || isArchived)) return false;
      if (statusFilter === 'inactive' && isAvailable) return false;
      if (statusFilter === 'preorder' && !isPreorder) return false;
      if (statusFilter === 'archived' && !isArchived) return false;
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const seller = sellers.find(s => s.id === product.seller_id);
      const sellerName = seller?.shop_name || '';
      
      return (
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        sellerName.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  async function handleToggleArchived(productId: string, currentStatus: boolean) {
    if (!user || !profile) return;
    if (!confirm('Anda pasti mahu ' + (currentStatus ? 'archive' : 'aktifkan semula') + ' produk ini?')) return;
    
    try {
      await supabase
        .from('products')
        .update({ is_archived: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_name: profile.name || '',
        actor_role: profile.role,
        action: currentStatus ? 'PRODUCT_ARCHIVE' : 'PRODUCT_RESTORE',
        entity_type: 'products',
        entity_id: productId,
        reason: 'Product ' + (currentStatus ? 'archived' : 'restored') + ' by admin',
        created_at: new Date().toISOString(),
      });
      
      await fetchAllProducts();
      alert('Produk berjaya ' + (currentStatus ? 'diarchive' : 'diaktifkan semula') + '!');
    } catch (error: any) {
      alert('Ralat: ' + error.message);
    }
  }

  async function handleToggleAvailability(productId: string, currentStatus: boolean) {
    if (!user || !profile) return;
    
    try {
      await supabase
        .from('products')
        .update({ is_available: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_name: profile.name || '',
        actor_role: profile.role,
        action: currentStatus ? 'PRODUCT_DEACTIVATE' : 'PRODUCT_ACTIVATE',
        entity_type: 'products',
        entity_id: productId,
        reason: 'Product ' + (currentStatus ? 'deactivated' : 'activated') + ' by admin',
        created_at: new Date().toISOString(),
      });
      
      await fetchAllProducts();
      alert('Produk berjaya ' + (currentStatus ? 'dinyahaktifkan' : 'diaktifkan') + '!');
    } catch (error: any) {
      alert('Ralat: ' + error.message);
    }
  }

  async function handleViewProduct(productId: string) {
    router.push('/jualan/products/' + productId + '/edit?adminView=true');
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🏢 Pengurusan Produk</h1>
              <p className="text-gray-600 mt-1">Urus semua produk dari semua peniaga</p>
            </div>
            <button
              onClick={() => router.push('/kawalan')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← Kembali ke Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peniaga</label>
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                <option value="all">Semua Peniaga</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>{seller.shop_name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif Sahaja</option>
                <option value="inactive">Tidak Aktif</option>
                <option value="preorder">Pre-order</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carian</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">Menunjukkan {filteredProducts.length} produk dari {products.length} jumlah</p>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
