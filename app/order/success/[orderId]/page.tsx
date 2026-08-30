'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase/client';
import { Order } from '../../../../types/database';
import { generateWhatsAppLink } from '../../../../lib/utils';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsappLink, setWhatsappLink] = useState<string>('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  async function fetchOrder() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);

      // Fetch order items with product details including options
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, product:products(*)')
        .eq('order_id', orderId);

      if (itemsData) {
        // Generate WhatsApp link with full details
        const subtotal = itemsData.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        
        const waLink = generateWhatsAppLink({
          orderId: data.id,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          customerAddress: data.customer_address || undefined,
          customerPinLocation: data.customer_pin_location || undefined,
          items: itemsData.map(item => ({
            name: item.product?.name || 'Produk',
            quantity: item.quantity,
            price: item.unit_price,
            selectedOptions: item.selected_options || [],
          })),
          subtotal: subtotal,
          deliveryFee: data.delivery_fee || 0,
          totalPrice: data.total_price,
          deliveryMode: data.delivery_mode || 'Self-Pickup',
          calculatedDistance: data.calculated_distance || undefined,
          deliveryDateTime: data.delivery_datetime || undefined,
          specialNotes: data.special_notes || undefined,
        });
        setWhatsappLink(waLink);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pesanan tidak dijumpai</p>
          <Link href="/sellers" className="text-slate-600 hover:text-slate-700">
            Kembali ke Senarai Peniaga
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Pesanan Berjaya!
            </h1>
            <p className="text-gray-600">
              Terima kasih atas pesanan anda. Peniaga akan memproses pesanan anda tidak lama lagi.
            </p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Maklumat Pesanan
            </h2>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Pesanan:</span>
                <span className="font-mono text-sm text-slate-900">
                  {order.id.substring(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nama:</span>
                <span className="font-medium text-slate-900">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Telefon:</span>
                <span className="font-medium text-slate-900">{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jumlah:</span>
                <span className="font-bold text-slate-600">
                  RM {order.total_price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Sila simpan nombor telefon anda untuk dihubungi oleh admin.
              </p>
              
              {whatsappLink && (
                <button
                  onClick={() => window.location.href = whatsappLink}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold text-center"
                >
                  📱 Hantar ke WhatsApp Admin HQ
                </button>
              )}
              
              <Link
                href="/sellers"
                className="inline-block w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition font-semibold text-center"
              >
                Kembali ke Senarai Peniaga
              </Link>
              <Link
                href="/"
                className="inline-block w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold text-center"
              >
                Halaman Utama
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
