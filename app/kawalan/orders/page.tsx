'use client';

// Pengurusan Pesanan - Admin & Staff
// Route: /kawalan/orders

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import { Order, OrderItem, Product } from '../../../types/database';
import Link from 'next/link';

interface OrderWithItems extends Order {
  items?: (OrderItem & { product?: Product })[];
}

export default function OrdersManagementPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && profile && profile.role !== 'admin' && profile.role !== 'staff') {
      router.push('/');
      return;
    }

    if (!authLoading && user) {
      fetchOrders();
    }
  }, [user, profile, authLoading, router]);

  async function fetchOrders() {
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, product:products(*)')
            .eq('order_id', order.id);

          return { ...order, items: itemsData || [] };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
      alert('Status dikemaskini: ' + newStatus);
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengemas kini.');
    }
  }

  const filteredOrders = orders.filter(order => 
    selectedStatus === 'all' || order.status === selectedStatus
  );

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Accepted': 'bg-blue-100 text-blue-700',
      'Ready': 'bg-purple-100 text-purple-700',
      'Delivering': 'bg-indigo-100 text-indigo-700',
      'Completed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      'Pending': 'Accepted',
      'Accepted': 'Ready',
      'Ready': 'Delivering',
      'Delivering': 'Completed',
    };
    return flow[current] || null;
  };

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <Link href="/kawalan" className="text-green-600 hover:text-green-700 text-sm mb-2 inline-block">
            ← Kembali ke Panel Kawalan
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            📦 Pengurusan Pesanan
          </h1>
          <p className="text-gray-600 mt-2">Urus semua pesanan dari pelanggan</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'Pending', 'Accepted', 'Ready', 'Delivering', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                  selectedStatus === status
                    ? 'bg-yellow-400 text-slate-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Semua' : status}
                {status !== 'all' && ` (${orders.filter(o => o.status === status).length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">Tiada pesanan dijumpai.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const nextStatus = getNextStatus(order.status);

              return (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('ms-MY')}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Pesanan #{order.id.substring(0, 8)}
                      </h3>
                      <p className="text-gray-600">
                        {order.customer_name} - {order.customer_phone}
                      </p>
                      {order.delivery_mode === 'Delivery' && order.customer_address && (
                        <p className="text-sm text-gray-600 mt-1">
                          📍 {order.customer_address}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

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
                      <span className="text-green-600">RM {order.total_price.toFixed(2)}</span>
                    </div>
                  </div>

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
      </main>
    </div>
  );
}
