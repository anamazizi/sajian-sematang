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
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, product:products(*)')
            .eq('order_id', order.id);

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
      
      const { error } = await supabase.rpc('update_order_status_with_audit', {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_notes: '',
        p_actor_name: 'Seller Dashboard'
      });

      if (error) throw error;

      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === orderId) {
            return { 
              ...order, 
              status: newStatus,
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

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Seller</h1>
          <p className="text-gray-600 mt-2">Urus pesanan dan lihat status terkini</p>
        </header>

        {/* Status Filter */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">PENAPIS STATUS</h3>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition"
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
          
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {STATUS_FILTER_OPTIONS.slice(1).map((option) => {
              const count = orders.filter(o => o.status === option.value).length;
              if (count === 0) return null;
              
              return (
                <span 
                  key={option.value}
                  className={`px-3 py-1 text-xs rounded-full font-medium border ${
                    selectedStatus === option.value 
                      ? 'bg-yellow-500 text-white border-yellow-500' 
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              <p className="mt-4 text-gray-600">Memuatkan pesanan...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">Tiada pesanan ditemui</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedStatus === 'all' ? 'Belum ada pesanan dibuat' : `Tiada pesanan dengan status "${STATUS_FILTER_OPTIONS.find(o => o.value === selectedStatus)?.label}"`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                
                return (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(order.created_at)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-2">
                          Pesanan #{order.id.substring(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {totalItems} item • RM {order.total_price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      
                      {/* Status Dropdown */}
                      <div className="flex items-center gap-3">
                        <div className="relative min-w-[200px]">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            disabled={updatingOrderId === order.id || order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                            className={`appearance-none w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition ${
                              updatingOrderId === order.id 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : order.status === 'COMPLETED' || order.status === 'CANCELLED'
                                ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                                : 'bg-white border-gray-300 text-gray-800 hover:border-yellow-400'
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
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Item Pesanan:</h4>
                      <div className="space-y-3">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm bg-white p-3 rounded border border-gray-200">
                            <div>
                              <span className="font-medium text-gray-900">
                                {item.quantity}x {item.product?.name || 'Produk'}
                              </span>
                              {item.product?.description && (
                                <p className="text-gray-500 text-xs mt-1">{item.product.description}</p>
                              )}
                            </div>
                            <span className="font-bold text-gray-900">
                              RM {(item.unit_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-gray-300 mt-4 pt-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            {order.delivery_mode && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Jenis:</span> {order.delivery_mode}
                              </p>
                            )}
                            {order.delivery_datetime && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Masa Penghantaran:</span> {formatDateTime(order.delivery_datetime)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              RM {order.total_price?.toFixed(2) || '0.00'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Jumlah Bayaran</p>
                          </div>
                        </div>
                      </div>
                      
                      {order.special_notes && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-medium text-gray-800 mb-2">Catatan Pelanggan</h5>
                          <p className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-gray-700">
                            {order.special_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Order History */}
                    <div className="border-t border-gray-200 pt-4">
                      <button
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="flex items-center justify-between w-full text-left hover:bg-gray-100 p-2 rounded-lg transition"
                      >
                        <h4 className="font-semibold text-gray-800">
                          Sejarah Status Pesanan
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
                        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
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
                                    {formatDateTime(history.created_at)}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">Tiada sejarah status tersedia</p>
                              <p className="text-sm text-gray-400 mt-1">Sejarah akan direkod apabila status diubah</p>
                            </div>
                          )}
                          
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
                                {formatDateTime(order.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <p className="text-sm text-gray-600">Jumlah Pesanan</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'COMPLETED').length}
            </div>
            <p className="text-sm text-gray-600">Selesai</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'DELIVERING').length}
            </div>
            <p className="text-sm text-gray-600">Dihantar</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
            <p className="text-sm text-gray-600">Menunggu</p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
            >
              ← Kembali ke Menu
            </Link>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium text-sm"
            >
              🔄 Muat Semula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
