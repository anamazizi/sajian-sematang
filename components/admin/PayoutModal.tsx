'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/hooks';
import { 
  getUnpaidOrders, 
  createPayout, 
  calculateTotalCostFromOrders 
} from '../../lib/financial/payout';
import { generatePayoutWhatsAppLink } from '../../lib/utils';
import { UnpaidOrder } from '../../types/database';
import Image from 'next/image';

interface PayoutModalProps {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  duitnowQrUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PayoutModal({
  sellerId,
  sellerName,
  sellerPhone,
  duitnowQrUrl,
  isOpen,
  onClose,
  onSuccess,
}: PayoutModalProps) {
  const { user } = useAuth();
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'DuitNow' | 'Cash' | 'Bank Transfer' | 'Other'>('DuitNow');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchUnpaidOrders();
    }
  }, [isOpen, sellerId]);

  useEffect(() => {
    // Calculate total when selection changes
    if (selectedOrders.length > 0) {
      calculateTotal();
    } else {
      setTotalAmount(0);
    }
  }, [selectedOrders]);

  async function fetchUnpaidOrders() {
    try {
      setLoading(true);
      const orders = await getUnpaidOrders(sellerId);
      setUnpaidOrders(orders);
      // Select all by default
      setSelectedOrders(orders.map(o => o.order_id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function calculateTotal() {
    try {
      const total = await calculateTotalCostFromOrders(selectedOrders);
      setTotalAmount(total);
    } catch (err: any) {
      console.error('Error calculating total:', err);
    }
  }

  function toggleOrder(orderId: string) {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }

  function toggleAll() {
    if (selectedOrders.length === unpaidOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(unpaidOrders.map(o => o.order_id));
    }
  }

  async function handleSubmit() {
    if (selectedOrders.length === 0) {
      setError('Sila pilih sekurang-kurangnya satu pesanan');
      return;
    }

    if (!user) {
      setError('Anda perlu log masuk');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create payout record
      const payout = await createPayout({
        sellerId,
        amount: totalAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        orderIds: selectedOrders,
        paidBy: user.id,
      });

      // Generate WhatsApp link
      const whatsappLink = generatePayoutWhatsAppLink({
        sellerName,
        sellerPhone,
        amount: totalAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        orderIds: selectedOrders,
        paidDate: payout.created_at,
        notes: notes.trim(),
      });

      // Redirect to WhatsApp (no popup blocker issues)
      window.location.href = whatsappLink;

      // Success callback
      onSuccess();
    } catch (err: any) {
      console.error('Error creating payout:', err);
      setError(err.message || 'Ralat semasa membuat payout');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sahkan Pembayaran</h2>
            <p className="text-gray-600">{sellerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuatkan...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Orders */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Pesanan Belum Bayar</h3>
                  <button
                    onClick={toggleAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedOrders.length === unpaidOrders.length ? 'Nyahpilih Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unpaidOrders.map(order => (
                    <label
                      key={order.order_id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.order_id)}
                        onChange={() => toggleOrder(order.order_id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">#{order.order_id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.order_date).toLocaleDateString('ms-MY')}
                        </p>
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          RM {order.total_cost.toFixed(2)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {unpaidOrders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Tiada pesanan belum bayar
                  </p>
                )}
              </div>

              {/* Right Column - Payment Details */}
              <div>
                {/* QR DuitNow */}
                {duitnowQrUrl && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold mb-2">QR DuitNow Seller</h3>
                    <div className="bg-white p-2 rounded inline-block">
                      <Image
                        src={duitnowQrUrl}
                        alt="QR DuitNow"
                        width={200}
                        height={200}
                        className="mx-auto"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Skan QR ini untuk membuat pembayaran
                    </p>
                  </div>
                )}

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kaedah Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={submitting}
                  >
                    <option value="DuitNow">DuitNow</option>
                    <option value="Cash">Tunai</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Lain-lain</option>
                  </select>
                </div>

                {/* Reference Number */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombor Rujukan (Optional)
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: REF123456"
                    disabled={submitting}
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Catatan tambahan..."
                    disabled={submitting}
                  />
                </div>

                {/* Total Amount */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Jumlah Bayaran:</span>
                    <span className="text-2xl font-bold text-green-600">
                      RM {totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedOrders.length} pesanan dipilih
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedOrders.length === 0}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    '✅ Sahkan Sudah Bayar & Hantar WhatsApp'
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Resit akan dihantar ke WhatsApp seller
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
