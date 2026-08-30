'use client';

// Phase R3A: Seller Onboarding Flow

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    phone_number: '',
    bank_name: '',
    bank_account_number: '',
    account_holder_name: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && profile && profile.role !== 'seller') {
      router.push('/');
      return;
    }

    checkExistingSeller();
  }, [user, profile, loading]);

  async function checkExistingSeller() {
    if (!user) return;

    const { data: existingSeller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSeller) {
      router.push('/jualan');
    }
  }

  // QR upload functions removed - moved to profile page

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.shop_name.trim()) {
        throw new Error('Nama kedai diperlukan.');
      }

      if (!formData.bank_name.trim()) {
        throw new Error('Nama bank diperlukan.');
      }

      if (!formData.bank_account_number.trim()) {
        throw new Error('Nombor akaun bank diperlukan.');
      }

      if (!formData.account_holder_name.trim()) {
        throw new Error('Nama pemegang akaun diperlukan.');
      }

      if (!user) {
        throw new Error('Sesi tamat. Sila log masuk semula.');
      }

      console.log('📝 Creating seller record...');
      console.log('👤 User ID:', user.id);
      console.log('🏪 Shop name:', formData.shop_name.trim());
      
      const { data: seller, error: sellerError} = await supabase
        .from('sellers')
        .insert({
          user_id: user.id,
          name: formData.shop_name.trim(), // FIXED: use 'name' column
          shop_name: formData.shop_name.trim(), // Keep for compatibility
          description: formData.description.trim() || null,
          phone_number: formData.phone_number.trim() || null,
          bank_name: formData.bank_name.trim(),
          bank_account_number: formData.bank_account_number.trim(),
          account_holder_name: formData.account_holder_name.trim(),
          duitnow_qr_url: null, // QR can be uploaded later in profile
        })
        .select()
        .single();

      if (sellerError) {
        console.error('❌ Seller record creation failed:', sellerError);
        throw new Error(`Gagal mencipta rekod peniaga: ${sellerError.message}`);
      }

      console.log('✅ Seller registered successfully!');
      alert('🎉 Kedai anda berjaya didaftarkan!');
      router.push('/jualan');
    } catch (err: any) {
      console.error('❌ Onboarding error:', err);
      const errorMessage = err.message || 'Ralat tidak dijangka.';
      setError(errorMessage);
      
      // Also show alert for ALL upload errors (verbose mode)
      if (errorMessage.includes('Gagal memuat naik') || 
          errorMessage.includes('Bucket') || 
          errorMessage.includes('kebenaran') ||
          errorMessage.includes('RLS')) {
        alert(`⚠️ ERROR DETAIL:\n\n${errorMessage}\n\nSila semak console (F12) untuk maklumat lanjut.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏪 Selamat Datang, Peniaga!
          </h1>
          <p className="text-gray-600">
            Mari lengkapkan maklumat kedai anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Maklumat Kedai
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Nama Kedai <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.shop_name}
              onChange={(e) =>
                setFormData({ ...formData, shop_name: e.target.value })
              }
              placeholder="Contoh: Kedai Makan Sedap"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
              required
              disabled={submitting}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Keterangan Kedai
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ceritakan tentang kedai anda..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
              disabled={submitting}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Nombor Telefon Kedai
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              placeholder="Contoh: 0123456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
              disabled={submitting}
            />
          </div>

          {/* BANK INFORMATION - REQUIRED */}
          <div className="mb-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💳 Maklumat Bank (untuk Pembayaran)
            </h3>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Nama Bank <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
                placeholder="Contoh: Maybank, CIMB, Bank Islam, RHB"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
                required
                disabled={submitting}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Nombor Akaun Bank <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bank_account_number}
                onChange={(e) =>
                  setFormData({ ...formData, bank_account_number: e.target.value })
                }
                placeholder="Contoh: 1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
                required
                disabled={submitting}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Nama Penuh Pemegang Akaun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.account_holder_name}
                onChange={(e) =>
                  setFormData({ ...formData, account_holder_name: e.target.value })
                }
                placeholder="Nama seperti dalam akaun bank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* QR Upload removed - moved to profile page */}
          <div className="mb-6 border-t pt-6">
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
              ℹ️ <strong>Muat naik QR DuitNow</strong> boleh dilakukan kemudian di halaman <strong>Profil Kedai</strong> selepas pendaftaran selesai.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              !formData.shop_name.trim() ||
              !formData.bank_name.trim() ||
              !formData.bank_account_number.trim() ||
              !formData.account_holder_name.trim()
            }
            className={`w-full py-3 rounded-lg font-semibold ${
              submitting ||
              !formData.shop_name.trim() ||
              !formData.bank_name.trim() ||
              !formData.bank_account_number.trim() ||
              !formData.account_holder_name.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {submitting ? '⏳ Sedang Mendaftar...' : '✅ Daftar Kedai Saya'}
          </button>
        </form>
      </div>
    </div>
  );
}
