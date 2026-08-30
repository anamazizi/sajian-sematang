'use client';

// Halaman Jualan (Seller Dashboard)
// Route: /jualan
// Accessible by: seller + admin

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/hooks';
import { supabase } from '../../lib/supabase/client';
import { Order, OrderItem, Product } from '../../types/database';
import Link from 'next/link';

interface OrderWithItems extends Order {
  items?: (OrderItem & { product?: Product })[];
}

export default function JualanDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    // Redirect if not seller or admin role
    if (!authLoading && profile && profile.role !== 'seller' && profile.role !== 'admin') {
      router.push('/');
      return;
    }

    // Fetch seller record
    fetchSellerRecord();
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (sellerId) {
      fetchOrders();
    
      // Set up real-time subscription for new orders
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sellerId]);

  async function fetchSellerRecord() {
    if (!user) return;

    try {
      const { data: seller, error } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Seller not found:', error);
        router.push('/seller/onboarding');
        return;
      }

      setSellerId(seller.id);
    } catch (error) {
      console.error('Error fetching seller:', error);
      router.push('/seller/onboarding');
    }
  }

  async function fetchOrders() {
    if (!sellerId) return;

    try {
      setLoading(true);

      // SECURITY FIX: Get orders containing seller's products
      const { data: orderItemsData, error } = await supabase
        .from('order_items')
        .select(`
          order_id,
          *,
          product:products!inner(seller_id)
        `)
        .eq('product.seller_id', sellerId);

      if (error) throw error;

      // Get unique order IDs
      const orderIds = [...new Set(orderItemsData?.map(item => item.order_id))];

      if (orderIds.length === 0) {
        setOrders([]);
        return;
      }

      // Fetch full order details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch items for each order (only seller's products)
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select(`
              *,
              product:products!inner(*)
            `)
            .eq('order_id', order.id)
            .eq('product.seller_id', sellerId);

          return {
            ...order,
            items: itemsData || [],
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: Order['status']) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Ralat semasa mengemas kini status pesanan');
    }
  }

  function getStatusColor(status: Order['status']) {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-700';
      case 'Preparing':
        return 'bg-yellow-100 text-yellow-700';
      case 'Ready':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-gray-100 text-gray-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  function getNextStatus(currentStatus: Order['status']): Order['status'] | null {
    switch (currentStatus) {
      case 'New':
        return 'Preparing';
      case 'Preparing':
        return 'Ready';
      case 'Ready':
        return 'Completed';
      default:
        return null;
    }
  }

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Kembali ke Halaman Utama
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🏪 Dashboard Peniaga
              </h1>
              <p className="text-gray-600">Urus pesanan masuk dari pelanggan</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Jumlah Pesanan</p>
              <p className="text-3xl font-bold text-green-600">{orders.length}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/seller/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              📦 Produk Saya
            </Link>
            <Link
              href="/seller/stock-history"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              📊 Sejarah Stok
            </Link>
            <Link
              href="/seller/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              ⚙️ Tetapan Kedai
            </Link>
          </div>
        </header>

        {/* Status Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua ({orders.length})
            </button>
            <button
              onClick={() => setSelectedStatus('New')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'New'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Baru ({orders.filter(o => o.status === 'New').length})
            </button>
            <button
              onClick={() => setSelectedStatus('Preparing')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'Preparing'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Sedang Disediakan ({orders.filter(o => o.status === 'Preparing').length})
            </button>
            <button
              onClick={() => setSelectedStatus('Ready')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'Ready'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Siap ({orders.filter(o => o.status === 'Ready').length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? 'Tiada pesanan buat masa ini.' 
                : `Tiada pesanan dengan status "${selectedStatus}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              
              return (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(order.created_at).toLocaleString('ms-MY')}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Pesanan #{order.id.substring(0, 8)}
                      </h3>
                      <p className="text-gray-600">
                        {order.items?.length || 0} item(s)
                      </p>
                      {order.is_custom_preorder && order.delivery_datetime && (
                        <p className="text-sm text-purple-600 mt-1">
                          📅 Pre-Order: {new Date(order.delivery_datetime).toLocaleString('ms-MY')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Item Pesanan:</h4>
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.product?.name || 'Produk'}
                          </span>
                          <span className="text-gray-800 font-medium">
                            RM {(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span>Jumlah:</span>
                      <span className="text-green-600">
                        RM {order.total_price.toFixed(2)}
                      </span>
                    </div>
                    {order.special_notes && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600">
                          <strong>Catatan:</strong> {order.special_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {nextStatus && (
                      <button
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition font-semibold"
                      >
                        Tukar ke "{nextStatus}"
                      </button>
                    )}
                    {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                        className="px-4 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition font-semibold"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
