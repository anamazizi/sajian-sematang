'use client';

import { SellerOutstandingSummary } from '@/types/database';

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
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg">{seller.shop_name}</h3>
          <div className="text-sm text-gray-600 mt-1">
            <p>ID: {seller.seller_id.substring(0, 8)}...</p>
            <p>Telefon: {seller.phone_number || 'Tiada'}</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-right">
            <p className="text-sm text-gray-600">Baki Tertunggak</p>
            <p className="text-2xl font-bold text-green-600">
              RM {seller.total_outstanding.toFixed(2)}
            </p>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onViewDetails(seller.seller_id)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Lihat Detail
            </button>
            <button
              onClick={() => onCreatePayout(seller.seller_id)}
              disabled={seller.total_outstanding <= 0}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buat Payout
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Order Belum Bayar</p>
            <p className="font-semibold">{seller.unpaid_orders_count}</p>
          </div>
          <div>
            <p className="text-gray-500">Jumlah Sales</p>
            <p className="font-semibold">RM {seller.total_sales.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500">Order Terakhir</p>
            <p className="font-semibold">
              {seller.last_order_date 
                ? new Date(seller.last_order_date).toLocaleDateString('ms-MY')
                : 'Tiada'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}