'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Mengikut rujukan laluan standard projek Anam

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUserAndFetch();
    fetchProducts();
  }, []);

  async function checkUserAndFetch() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Ambil profil pelanggan terakhir
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (data) setProfile(data);
      }
    } catch (err) {
      console.error('Ralat semak sesi:', err);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setProfile(null);
    window.location.reload(); // Muat semula laman untuk kosongkan paparan
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) throw error;

      if (data) {
        const filtered = data.filter((item: any) => {
          let stokBaki = item.stock_quantity ?? 0;
          let isAvailable = item.is_available ?? true;
          if (!isAvailable || stokBaki <= 0) return false;
          return true;
        });
        setProducts(filtered);
      }
    } catch (err) {
      console.error('Ralat memuatkan produk:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* HEADER & STATUS LOGIN */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <div>
            <h1 className="text-3xl font-bold text-orange-600 mb-1">
              🍽️ Sajian Sematang
            </h1>
            <p className="text-gray-600 text-sm">Platform Tempahan Makanan</p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{profile?.name || 'Pengguna'}</p>
                  <p className="text-xs text-gray-500">{profile?.phone_number || 'Tiada No Phone'}</p>
                </div>
                <Link href="/auth/profile">
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium transition">
                    Edit Profil
                  </button>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium transition"
                >
                  Log Keluar
                </button>
              </div>
            ) : (
              <Link href="/auth/login">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  Log Masuk (Google)
                </button>
              </Link>
            )}
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* PAPARAN ALAMAT TERAKHIR (AUTO-DETECT) */}
          {profile && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-8 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Maklumat Penghantaran Anda:</p>
                <p className="text-gray-800 text-sm font-medium mt-0.5">{profile.address || 'Alamat belum diisi'}</p>
                {profile.maps_url && (
                  <a href={profile.maps_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                    📍 Buka Lokasi Google Maps
                  </a>
                )}
              </div>
              <Link href="/auth/profile" className="text-xs text-orange-600 hover:underline font-semibold whitespace-nowrap bg-white px-3 py-1.5 rounded border border-orange-200">
                Tukar/Edit
              </Link>
            </div>
          )}

          {/* SENARAI MENU */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Menu Makanan Semasa</h2>
            
            {loading ? (
              <p className="text-center text-gray-500 py-6">Memuat turun menu dari pangkalan data...</p>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-500 py-6 bg-white rounded-lg shadow-sm">Tiada menu aktif buat masa ini.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {products.map((item) => {
                  return (
                    <div key={item.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">Stok: {item.stock_quantity ?? 0}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                        <p className="text-orange-600 font-bold text-xl mb-4">RM {parseFloat(item.price || 0).toFixed(2)}</p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm font-medium transition">
                          <span>👍 Suka</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (!user) {
                              alert('Sila log masuk dengan Google terlebih dahulu untuk membuat pesanan.');
                              router.push('/auth/login');
                            } else {
                              alert(`Tempahan berjaya direkodkan untuk ${item.name}! Penghantaran ke alamat: ${profile?.address || 'Alamat lalai'}`);
                            }
                          }}
                          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition text-sm font-medium"
                        >
                          Tempah
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
