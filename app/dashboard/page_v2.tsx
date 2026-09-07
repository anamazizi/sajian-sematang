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
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">PENAPIS STATUS</h3>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            {STATUS_FILTER_OPTIONS.slice(1).map((option) => {
              const count = orders.filter(o => o.status === option.value).length;
              if (count === 0) return null;
              
              return (
                <span 
                  key={option.value}
                  className={`px-3 py-1 text-xs rounded-full font-medium border ${
                    selectedStatus === option.value 
                      ? 'bg-green-500 text-white border-green-500' 
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {option.label.replace(/^[^\s]+\s/, '')}: {count}
                </span>
              );
            })}
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

                  {/* Status Control and History */}
                    <div className="space-y-4">
                      {/* Status Dropdown */}
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-gray-700">Status Pesanan:</h4>
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            disabled={updatingOrderId === order.id || order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                            className={`appearance-none min-w-[180px] px-4 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none transition ${
                              updatingOrderId === order.id 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : order.status === 'COMPLETED' || order.status === 'CANCELLED'
                                ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                                : 'bg-white border-gray-300 text-gray-800 hover:border-green-400'
                            }`}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {updatingOrderId === order.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            ) : (
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </div>
                        </div>
{/* Order History Toggle */}
                      <div className="border-t border-gray-200 pt-3">
                        <button
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                          className="flex items-center justify-between w-full text-left hover:bg-gray-100 p-2 rounded-lg transition"
                        >
                          <h4 className="font-semibold text-gray-700">
                            Sejarah Status
                            <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                              {order.status_history?.length || 0} perubahan
                            </span>
                          </h4>
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {expandedOrderId === order.id && (
                          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                            {order.status_history && order.status_history.length > 0 ? (
                              order.status_history.map((history) => (
                                <div key={history.id} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          getStatusColor(history.new_status)
                                        }`}>
                                          {history.new_status}
                                        </span>
                                        {history.previous_status && (
                                          <span className="text-xs text-gray-500">
                                            dari {history.previous_status}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        {history.actor_name || 'Sistem'}
                                        {history.notes && (
                                          <span className="ml-2 text-xs text-gray-500">• {history.notes}</span>
                                        )}
                                      </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(history.created_at).toLocaleString('ms-MY')}
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">Tiada sejarah status tersedia</p>
                                <p className="text-sm text-gray-400 mt-1">Sejarah akan direkod apabila status diubah</p>
                              </div>
                            )}
                            
                            {/* Initial creation entry */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                      DIBUAT
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Pesanan dibuat oleh pelanggan
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(order.created_at).toLocaleString('ms-MY')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
