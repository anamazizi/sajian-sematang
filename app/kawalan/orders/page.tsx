'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import OrderStatusControl from '../../../components/admin/OrderStatusControl-final';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERING', label: 'Delivering' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
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
      
      // Debug: Log user info
      console.log('Fetching orders for user:', user?.id, 'Role:', profile?.role);
      
      // First verify authentication session is valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      console.log('Session valid:', !!session?.user);
      
      // Try to fetch orders with expanded select to see all columns
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, customer_pin_location_snapshot, customer_address_snapshot')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Fetch orders error:', ordersError);
        console.error('Error details:', {
          message: ordersError.message,
          code: ordersError.code,
          details: ordersError.details,
          hint: ordersError.hint
        });
        throw ordersError;
      }

      // Debug: Log raw data
      console.log('Raw orders data:', ordersData?.length || 0, 'orders found');
      if (ordersData && ordersData.length > 0) {
        console.log('Sample order:', {
          id: ordersData[0].id,
          status: ordersData[0].status,
          customer_name: ordersData[0].customer_name
        });
      }

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Fetch order items once
          const { data: orderItemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*, product:products(*)')
            .eq('order_id', order.id);
          
          if (itemsError) {
            console.error('Error fetching items for order', order.id, itemsError);
          }

          const items = orderItemsData || [];
          
          return { 
            ...order, 
            order_items: items, // For WhatsApp dispatch
            items: items // For main display (same data)
          };
        })
      );

      console.log('Processed orders:', ordersWithItems.length);
      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = () => {
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (selectedStatus === 'all') {
      return true;
    }
    
    // Normalize both statuses to uppercase for comparison
    const orderStatus = order.status?.toUpperCase() || '';
    const selectedStatusUpper = selectedStatus.toUpperCase();
    
    const matches = orderStatus === selectedStatusUpper;
    
    // Debug logging for filter issues
    if (process.env.NODE_ENV === 'development' && selectedStatusUpper !== 'ALL') {
      console.log(`Filter check: Order ${order.id} status="${order.status}" (normalized: "${orderStatus}") vs selected="${selectedStatus}" (normalized: "${selectedStatusUpper}") => ${matches ? 'MATCHES' : 'NO MATCH'}`);
    }
    
    return matches;
  });

  // Debug: Log filter results
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Filter debug:', {
        totalOrders: orders.length,
        selectedStatus,
        filteredCount: filteredOrders.length,
        availableStatuses: [...new Set(orders.map(o => o.status?.toUpperCase()).filter(Boolean))],
        sampleOrderStatuses: orders.slice(0, 3).map(o => ({ id: o.id, status: o.status }))
      });
    }
  }, [orders, selectedStatus, filteredOrders.length]);

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // WhatsApp Dispatch function
  const openWhatsAppDispatch = (order: any) => {
    // Format phone number to international format (+601xxxxxxxxx)
    const formatPhoneNumber = (phone: string): string => {
      if (!phone) return '';
      // Remove all non-digit characters
      const cleaned = phone.replace(/\D/g, '');
      // If starts with 60, return as is with +
      if (cleaned.startsWith('60')) {
        return `+${cleaned}`;
      }
      // If starts with 0, replace with +60
      if (cleaned.startsWith('0')) {
        return `+6${cleaned}`;
      }
      // If starts with 1 (without 0), add +60
      if (cleaned.startsWith('1') && cleaned.length === 9) {
        return `+60${cleaned}`;
      }
      // Default: assume Malaysian number with +60
      return `+60${cleaned.replace(/^0/, '')}`;
    };

    // Format items list without price - use order_items data directly
    const formatItemsList = (order: any): string => {
      if (!order.order_items || order.order_items.length === 0) {
        // Try to use items if order_items not available
        if (order.items && order.items.length > 0) {
          return order.items.map((item: any, index: number) => 
            `${index + 1}. ${item.quantity}x ${item.product?.name || item.product_name_snapshot || 'Produk'}`
          ).join('\n');
        }
        return 'Tidak ada item spesifik';
      }
      
      return order.order_items.map((item: any, index: number) => 
        `${index + 1}. ${item.quantity}x ${item.product_name_snapshot || 'Product'}`
      ).join('\n');
    };

    // Get correct address and maps data
    const getAddress = (order: any): string => {
      // Priority: customer_address_snapshot, customer_address, address, delivery_address
      return order.customer_address_snapshot || 
             order.customer_address || 
             order.address || 
             order.delivery_address || 
             'Alamat tidak tersedia';
    };

    const getMapsUrl = (order: any, address: string): string => {
      // Priority: customer_pin_location_snapshot, google_maps_url, customer_pin_location
      const pinUrl = order.customer_pin_location_snapshot || 
                     order.google_maps_url ||
                     order.customer_pin_location;
      
      // If we have a valid pin URL, use it
      if (pinUrl && pinUrl !== 'N/A' && pinUrl.includes('maps')) {
        return pinUrl;
      }
      
      // Fallback: Generate Google Maps search URL based on address
      if (address && address !== 'Alamat tidak tersedia' && address !== 'N/A') {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      }
      
      // Ultimate fallback
      return 'URL peta tidak tersedia';
    };

    const customerPhone = formatPhoneNumber(order.customer_phone || '');
    const address = getAddress(order);
    const mapsUrl = getMapsUrl(order, address);
    const itemsList = formatItemsList(order);
    
    // WhatsApp message template with proper spacing (NO PRICE mentioned)
    const message = `📦 *TUGASAN RUNNER SAJIAN SEMATANG*

🧾 *Order ID:* ${order.id}

👤 *Nama Pelanggan:* ${order.customer_name || 'N/A'}

📞 *Telefon Pelanggan:* ${customerPhone}

📍 *Alamat Penghantaran:*
${address}

🗺️ *Google Maps:*
${mapsUrl}

🍽️ *Item Pesanan:*
${itemsList}

📝 *Catatan:* Sila pastikan makanan dihantar dalam keadaan baik. Terima kasih!`;

    // Encode for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

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
            {orders.length === 0 ? (
              <div>
                <p className="text-gray-600 mb-2">Tiada pesanan dijumpai dalam sistem.</p>
                <p className="text-sm text-gray-500">
                  Status pengguna: {profile?.role} | Total orders dalam database: 0
                </p>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                  <p className="font-medium">Debug info:</p>
                  <ul className="text-left mt-1 space-y-1">
                    <li>• User ID: {user?.id}</li>
                    <li>• Role: {profile?.role}</li>
                    <li>• Selected status filter: {selectedStatus}</li>
                    <li>• Check browser console for detailed fetch logs</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Tiada pesanan dengan status "{selectedStatus}" dijumpai.
                </p>
                <p className="text-sm text-gray-500">
                  Total orders: {orders.length} | Available statuses: {[...new Set(orders.map(o => o.status))].join(', ')}
                </p>
              </div>
            )}
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
                  <h4 className="font-semibold text-slate-900 mb-2">Item Pesanan:</h4>
                  <div className="space-y-2">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-800 font-medium">
                          {item.quantity}x {item.product?.name || 'Produk'}
                        </span>
                        <span className="text-slate-800 font-medium">
                          RM {(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span className="text-slate-900 font-bold text-base">Jumlah:</span>
                    <span className="text-slate-900 font-bold text-base">RM {order.total_price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <OrderStatusControl
                    orderId={order.id}
                    currentStatus={order.status}
                    onStatusUpdate={handleStatusUpdate}
                  />
                  
                  {/* WhatsApp Dispatch Button for Delivery Orders */}
                  {(order.delivery_mode === 'Delivery' || order.status === 'DELIVERING') && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Operasi Penghantaran:</h4>
                      <button
                        onClick={() => openWhatsAppDispatch(order)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition flex items-center gap-2"
                      >
                        <span>🚚</span>
                        Hantar Info ke Runner
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        WhatsApp akan dibuka dengan maklumat pesanan (tanpa harga). Pilih runner dari contact list.
                      </p>
                    </div>
                  )}
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
