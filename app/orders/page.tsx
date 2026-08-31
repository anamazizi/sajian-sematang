'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/auth/hooks';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  delivery_mode: string;
  delivery_fee: number;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  customer_address_snapshot?: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price: number;
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && user) {
      fetchOrders();
    }
  }, [user, authLoading, router]);

  async function fetchOrders() {
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);

      // Fetch order items for each order
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(order => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (!itemsError && itemsData) {
          const itemsByOrderId = itemsData.reduce((acc, item) => {
            if (!acc[item.order_id]) {
              acc[item.order_id] = [];
            }
            acc[item.order_id].push(item);
            return acc;
          }, {} as Record<string, OrderItem[]>);
          
          setOrderItems(itemsByOrderId);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Memuatkan sejarah tempahan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link
            href="/"
            className="text-slate-600 hover:text-slate-700 mb-4 inline-block"
          >
            ← Kembali ke Laman Utama
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📋 Sejarah Tempahan Anda
          </h1>
          <p className="text-gray-600">
            Semak status dan butiran tempahan terdahulu
          </p>
        </header>

        {/* Status Filter Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${selectedStatus === 'all' ? 'bg-yellow-400 text-slate-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedStatus('Pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${selectedStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setSelectedStatus('Accepted')}
              className={`px-4 py-2 rounded-lg font-medium transition ${selectedStatus === 'Accepted' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Diterima
            </button>
            <button
              onClick={() => setSelectedStatus('Completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${selectedStatus === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Selesai
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Tiada tempahan ditemui
            </h3>
            <p className="text-gray-600 mb-4">
              Anda belum membuat sebarang tempahan.
            </p>
            <Link
              href="/"
              className="inline-block bg-yellow-400 text-slate-900 px-6 py-3 rounded-lg hover:bg-yellow-500 transition font-semibold"
            >
              Buat Tempahan Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const items = orderItems[order.id] || [];

              return (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">
                        Pesanan #{order.order_number}
                      </h3>
                      <p className="text-gray-600">
                        {order.delivery_mode === 'Delivery' ? '🚗 Penghantaran' : '🏪 Ambil Sendiri'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  {items.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Item Pesanan:</h4>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.product_name_snapshot}
                            </span>
                            <span className="text-gray-800 font-medium">
                              RM {(item.unit_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Jumlah Item:</span>
                      <span className="text-gray-800 font-medium">
                        {items.reduce((sum, item) => sum + item.quantity, 0)} item
                      </span>
                    </div>
                    {order.delivery_mode === 'Delivery' && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Caj Penghantaran:</span>
                        <span className="text-gray-800 font-medium">
                          RM {order.delivery_fee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-lg font-bold text-gray-800">Jumlah:</span>
                      <span className="text-2xl font-bold text-slate-900">
                        RM {order.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Order Details Link */}
                  <div className="mt-4 pt-4 border-t">
                    <Link
                      href={`/order/success/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                    >
                      Lihat butiran penuh pesanan →
                    </Link>
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