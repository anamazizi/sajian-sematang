'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import SellerOutstanding from '../../../components/admin/SellerOutstanding';
import PayoutModal from '../../../components/admin/PayoutModal';
import { getAllSellersOutstanding } from '../../../lib/financial/payout';
import { supabase } from '../../../lib/supabase/client';
import { SellerOutstandingSummary } from '../../../types/database';
import Link from 'next/link';

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<SellerOutstandingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<SellerOutstandingSummary | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSellers();
  }, []);

  async function fetchSellers() {
    try {
      setLoading(true);
      const data = await getAllSellersOutstanding();
      setSellers(data);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetails(sellerId: string) {
    // Navigate to seller detail page (to be implemented)
    router.push(`/admin/sellers/${sellerId}`);
  }

  async function handleCreatePayout(sellerId: string) {
    const seller = sellers.find(s => s.seller_id === sellerId);
    if (!seller) return;

    // Fetch full seller details including duitnow_qr_url
    const { data: sellerData } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (sellerData) {
      setSelectedSeller({
        ...seller,
        duitnow_qr_url: sellerData.duitnow_qr_url,
      } as any);
      setShowPayoutModal(true);
    }
  }

  const filteredSellers = sellers.filter(seller =>
    seller.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.phone_number?.includes(searchQuery)
  );

  const totalOutstanding = sellers.reduce((sum, s) => sum + s.total_outstanding, 0);
  const sellersWithOutstanding = sellers.filter(s => s.total_outstanding > 0).length;

  if (loading) {
    return (
      <ProtectedRoute requireAuth allowedRoles={['admin']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuatkan...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/admin" className="text-green-600 hover:text-green-700 text-sm mb-2 inline-block">
                  ← Kembali ke Admin Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">
                  🏦 Dashboard Payout
                </h1>
                <p className="text-gray-600 mt-1">
                  Urus pembayaran kepada peniaga
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Outstanding */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <p className="text-sm text-gray-600 mb-1">Total Tunggakan</p>
              <p className="text-3xl font-bold text-orange-600">
                RM {totalOutstanding.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Semua peniaga
              </p>
            </div>

            {/* Sellers with Outstanding */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Peniaga Perlu Bayar</p>
              <p className="text-3xl font-bold text-blue-600">
                {sellersWithOutstanding}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Daripada {sellers.length} peniaga
              </p>
            </div>

            {/* Total Sellers */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Jumlah Peniaga</p>
              <p className="text-3xl font-bold text-green-600">
                {sellers.length}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Aktif dalam sistem
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari peniaga (nama atau telefon)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={fetchSellers}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Sellers List */}
          {filteredSellers.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600">
                {searchQuery ? 'Tiada peniaga dijumpai' : 'Tiada peniaga dalam sistem'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSellers.map(seller => (
                <SellerOutstanding
                  key={seller.seller_id}
                  seller={seller}
                  onViewDetails={handleViewDetails}
                  onCreatePayout={handleCreatePayout}
                />
              ))}
            </div>
          )}
        </main>

        {/* Payout Modal */}
        {showPayoutModal && selectedSeller && (
          <PayoutModal
            sellerId={selectedSeller.seller_id}
            sellerName={selectedSeller.shop_name}
            sellerPhone={selectedSeller.phone_number || ''}
            duitnowQrUrl={(selectedSeller as any).duitnow_qr_url}
            isOpen={showPayoutModal}
            onClose={() => {
              setShowPayoutModal(false);
              setSelectedSeller(null);
            }}
            onSuccess={() => {
              setShowPayoutModal(false);
              setSelectedSeller(null);
              fetchSellers(); // Refresh data
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
