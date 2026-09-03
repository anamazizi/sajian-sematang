'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import OrderStatusControl from '../../../components/admin/OrderStatusControl';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Ready', label: 'Ready' },
  { value: 'Delivering', label: 'Delivering' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function OrdersManagementPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  const handleStatusUpdate = () => {
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => 
    selectedStatus === 'all' || order.status === selectedStatus
  );

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Pengurusan Pesanan</h1>
          <p className="text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pengurusan Pesanan</h1>
          <p className="text-gray-600">Urus status pesanan dan pantau audit trail</p>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-semibold text-gray-800">{orders.length}</div>
            </div>
            {STATUS_FILTERS.filter(s => s.value !== 'all').map(status => (
              <div key={status.value} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">{status.label}</div>
                <div className="text-2xl font-semibold text-gray-800">
                  {statusCounts[status.value] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedStatus === filter.value 
                    ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-400' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Tiada pesanan dijumpai.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
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
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Item Pesanan:</h4>
                  <div className="space-y-2">
                    {order.items?.map((item: any) => (
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

                <div className="border-t pt-4">
                  <OrderStatusControl
                    orderId={order.id}
                    currentStatus={order.status}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Ciri-ciri Sistem Status Pesanan:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ <strong>Status Workflow:</strong> PENDING → ACCEPTED → READY → DELIVERING → COMPLETED</li>
            <li>✅ <strong>Revert Capability:</strong> Admin/Staff boleh tukar ke status sebelumnya jika tersilap</li>
            <li>✅ <strong>Locked State:</strong> COMPLETED & CANCELLED status dikunci</li>
            <li>✅ <strong>Audit Log:</strong> Setiap perubahan status direkod dengan user info & timestamp</li>
            <li>✅ <strong>Notes Support:</strong> Catatan untuk COMPLETED & CANCELLED status</li>
            <li>✅ <strong>History View:</strong> Modal untuk lihat timeline semua status changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
