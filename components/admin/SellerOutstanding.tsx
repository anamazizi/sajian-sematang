'use client';

import { SellerOutstandingSummary } from '../../types/database';

interface SellerOutstandingProps {
  seller: SellerOutstandingSummary;
  onViewDetails: (sellerId: string) => void;
  onCreatePayout: (sellerId: string) => void;
}

export default function SellerOutstanding({
  seller,
  onViewDetails,
  onCreatePayout,
}: SellerOutstandingProps) {
  const hasOutstanding = seller.total_outstanding > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        {/* Seller Info */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            {seller.shop_name}
          </h3>
          {seller.phone_number && (
            <p className="text-gray-600 text-sm mb-2">
              📞 {seller.phone_number}
            </p>
          )}
          
          {/* Outstanding Amount */}
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-1">Tunggakan:</p>
            <p className={`text-3xl font-bold ${hasOutstanding ? 'text-orange-600' : 'text-green-600'}`}>
              RM {seller.total_outstanding.toFixed(2)}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-3 flex gap-4 text-sm">
            <div>
              <p className="text-gray-500">Pesanan Selesai:</p>
              <p className="font-semibold text-gray-800">{seller.unpaid_orders_count}</p>
            </div>
            <div>
              <p className="text-gray-500">Jumlah Jualan:</p>
              <p className="font-semibold text-gray-800">
                RM {seller.total_sales?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {seller.last_order_date && (
            <p className="text-xs text-gray-500 mt-2">
              Pesanan terakhir: {new Date(seller.last_order_date).toLocaleDateString('ms-MY')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 md:min-w-[200px]">
          <button
            onClick={() => onViewDetails(seller.seller_id)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium text-sm"
          >
            📋 Lihat Detail
          </button>
          
          <button
            onClick={() => onCreatePayout(seller.seller_id)}
            disabled={!hasOutstanding}
            className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
              hasOutstanding
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {hasOutstanding ? '✅ Sahkan Sudah Bayar' : '✓ Tiada Tunggakan'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {hasOutstanding && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min((seller.total_outstanding / 1000) * 100, 100)}%`
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tunggakan perlu dibayar
          </p>
        </div>
      )}
    </div>
  );
}
