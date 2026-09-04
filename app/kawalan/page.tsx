'use client';

// Halaman Kawalan (Admin & Staff Dashboard)
// Route: /kawalan
// Accessible by: admin + staff
// Staff CANNOT access payout/financial section

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/hooks';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

export default function KawalanDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && profile && profile.role !== 'admin' && profile.role !== 'staff') {
      router.push('/');
      return;
    }

    setLoading(false);
  }, [user, profile, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🎛️ Panel Kawalan</h1>
              <p className="text-gray-600 mt-1">{isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}</p>
            </div>
            <Link href="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">← Kembali</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Orders Management - Admin & Staff */}
          <Link href="/kawalan/orders" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-blue-500">
            <div className="text-4xl mb-3">📦</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Pengurusan Pesanan</h2>
            <p className="text-gray-600 text-sm">Lihat dan kemaskini status pesanan</p>
          </Link>

          {/* Products Management - Admin Only */}
          {isAdmin && (
            <Link href="/kawalan/products" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-green-500">
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Pengurusan Produk</h2>
              <p className="text-gray-600 text-sm">Urus semua produk dari semua peniaga</p>
              <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">🔒 Admin Sahaja</span>
            </Link>
          )}

          {/* Payout Management - Admin Only */}
          {isAdmin && (
            <Link href="/kawalan/payouts" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-yellow-500">
              <div className="text-4xl mb-3">💰</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Pembayaran Peniaga</h2>
              <p className="text-gray-600 text-sm">Urus pembayaran tunai kepada seller</p>
              <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">🔒 Admin Sahaja</span>
            </Link>
          )}
        </div>

        {isStaff && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Nota untuk Staff</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Anda boleh urus pesanan dan menu seller</li>
              <li>❌ Anda tidak mempunyai akses kepada Pembayaran (Payout)</li>
              <li>❌ Hanya Admin yang boleh urus pembayaran kepada seller</li>
            </ul>
          </div>
        )}
      </main>
      
      {/* Bottom Navigation for Admin/Staff */}
      <AdminBottomNav />
    </div>
  );
}
