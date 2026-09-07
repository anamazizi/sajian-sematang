'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Order, OrderItem, Product, OrderStatusHistoryRecord } from '../../types/database';
import Link from 'next/link';

interface OrderWithItems extends Order {
  items?: (OrderItem & { product?: Product })[];
  status_history?: OrderStatusHistoryRecord[];
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'PENDING (Menunggu)' },
  { value: 'ACCEPTED', label: 'ACCEPTED (Diterima)' },
  { value: 'READY', label: 'READY (Sedia)' },
  { value: 'DELIVERING', label: 'DELIVERING (Dihantar)' },
  { value: 'COMPLETED', label: 'COMPLETED (Selesai)' },
  { value: 'CANCELLED', label: 'CANCELLED (Batal)' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '📋 Semua Status' },
  { value: 'PENDING', label: '⏳ Menunggu' },
  { value: 'ACCEPTED', label: '✅ Diterima' },
  { value: 'READY', label: '📦 Sedia' },
  { value: 'DELIVERING', label: '🚚 Dihantar' },
  { value: 'COMPLETED', label: '✓ Selesai' },
  { value: 'CANCELLED', label: '✗ Batal' },
];

export default function SellerDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  async function fetchOrders() {
    try {
      // For Phase 1, we'll fetch all orders
      // In production, this should be filtered by seller_id based on authenticated user
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items and status history for each order
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Fetch order items
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, product:products(*)')
            .eq('order_id', order.id);

          // Fetch status history
          const { data: statusHistoryData } = await supabase
            .from('order_status_history')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false });

          return {
            ...order,
            items: itemsData || [],
            status_history: statusHistoryData || [],
          };
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: Order['status']) {
    try {
      setUpdatingOrderId(orderId);
      
      // Use the RPC function that includes audit logging
      const { error } = await supabase.rpc('update_order_status_with_audit', {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_notes: '',
        p_actor_name: 'Seller Dashboard'
      });

      if (error) throw error;

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === orderId) {
            return { 
              ...order, 
              status: newStatus,
              // Refresh status history
              status_history: [
                {
                  id: `temp-${Date.now()}`,
                  order_id: orderId,
                  previous_status: order.status,
                  new_status: newStatus,
                  actor_id: '',
                  actor_name: 'Seller Dashboard',
                  notes: '',
                  created_at: new Date().toISOString()
                },
                ...(order.status_history || [])
              ]
            };
          }
          return order;
        })
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Ralat semasa mengemas kini status pesanan');
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function getStatusColor(status: Order['status']) {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READY':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getNextStatus(currentStatus: Order['status']): Order['status'] | null {
    switch (currentStatus) {
      case 'PENDING':
        return 'ACCEPTED';
      case 'ACCEPTED':
        return 'DELIVERING';
      case 'DELIVERING':
        return 'READY';
      case 'READY':
        return 'COMPLETED';
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
              onClick={() => setSelectedStatus('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'PENDING'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Baru ({orders.filter(o => o.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setSelectedStatus('ACCEPTED')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'ACCEPTED'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Diterima ({orders.filter(o => o.status === 'ACCEPTED').length})
            </button>
            <button
              onClick={() => setSelectedStatus('DELIVERING')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'DELIVERING'
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              Dihantar ({orders.filter(o => o.status === 'DELIVERING').length})
            </button>
            <button
              onClick={() => setSelectedStatus('READY')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === 'READY'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Sedia ({orders.filter(o => o.status === 'READY').length})
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
                    {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
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
