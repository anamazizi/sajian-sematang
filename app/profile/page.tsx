'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';
import { getMalaysiaTime } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
        setName(existingProfile.name || session.user.user_metadata?.full_name || '');
        setPhone(existingProfile.phone_number || '');
        setAddress(existingProfile.address || '');
        setGoogleMapsUrl(existingProfile.google_maps_url || '');
      } else {
        setName(session.user.user_metadata?.full_name || '');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Auth check error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (!name.trim()) throw new Error('Nama diperlukan');
      if (!phone.trim()) throw new Error('Nombor telefon diperlukan');
      if (!address.trim()) throw new Error('Alamat diperlukan');

      const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        throw new Error('Format nombor telefon tidak sah');
      }

      if (!user) throw new Error('Sesi tamat');

      // Phase R6.3: Use Malaysia timezone for updated_at
      const profileData = {
        id: user.id,
        name: name.trim(),
        email: user.email,
        phone_number: phone.trim(),
        address: address.trim(),
        google_maps_url: googleMapsUrl.trim() || null,
        role: profile?.role || 'customer',
        is_active: true,
        updated_at: getMalaysiaTime().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      setSuccess('✅ Profil berjaya disimpan!');

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);

    } catch (err: any) {
      console.error('Save profile error:', err);
      setError(err.message || 'Ralat menyimpan profil');
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block mb-4 text-slate-700 hover:text-slate-900 font-medium"
          >
            ← Kembali ke Halaman Utama
          </Link>
          <div className="inline-block bg-yellow-400 text-slate-900 p-4 rounded-full mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {profile ? 'Kemaskini Profil' : 'Lengkapkan Profil Anda'}
          </h1>
          <p className="text-gray-600">
            {profile 
              ? 'Pastikan maklumat anda adalah terkini'
              : 'Isi maklumat di bawah untuk mula membuat tempahan'
            }
          </p>
        </div>

        {/* Profile Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Nama Penuh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Contoh: Ahmad bin Abdullah"
                required
                disabled={saving}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                Nombor Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Contoh: 0123456789"
                required
                disabled={saving}
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Contoh: No 123, Jalan ABC, 12345 Kuala Lumpur"
                rows={3}
                required
                disabled={saving}
              />
            </div>

            {/* Google Maps URL */}
            <div>
              <label htmlFor="googleMapsUrl" className="block text-gray-700 font-medium mb-2">
                Pautan Google Maps (Pilihan)
              </label>
              <input
                type="url"
                id="googleMapsUrl"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full px-4 py-3 text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="https://maps.google.com/..."
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                📍 Untuk pengiraan jarak penghantaran yang tepat
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-yellow-400 text-slate-900 py-3 rounded-lg hover:bg-yellow-500 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : (profile ? 'Kemaskini Profil' : 'Simpan & Teruskan')}
            </button>
          </form>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2 text-sm"
          >
            Log Keluar
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Kenapa perlu lengkapkan profil?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Untuk penghantaran pesanan anda</li>
            <li>• Untuk kami hubungi jika diperlukan</li>
            <li>• Maklumat selamat dan tidak dikongsi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
