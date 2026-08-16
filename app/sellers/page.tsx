'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { Seller } from '../../types/database';
import Link from 'next/link';

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  async function fetchSellers() {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan peniaga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
            ← Kembali ke Halaman Utama
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏪 Senarai Peniaga
          </h1>
          <p className="text-gray-600">Pilih peniaga untuk melihat menu mereka</p>
        </header>

        {sellers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">Tiada peniaga tersedia buat masa ini.</p>
            <p className="text-sm text-gray-500">
              Sila setup database dengan menjalankan script SQL di Supabase.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map((seller) => (
              <Link
                key={seller.id}
                href={`/sellers/${seller.id}`}
                className="bg-white p-6 rounded-lg shadow-md border-2 border-transparent hover:border-orange-400 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {seller.shop_name}
                  </h2>
                  <span className="text-2xl">🍽️</span>
                </div>
                {seller.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {seller.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Lihat Menu →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
