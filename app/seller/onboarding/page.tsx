'use client';

// Phase R3A: Seller Onboarding Flow

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import { uploadSellerQR } from '../../../lib/storage/seller-qr';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    phone_number: '',
  });

  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
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
      router.push('/seller');
    }
  }

  function handleQRFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format fail tidak sah. Sila gunakan JPEG, PNG, atau WebP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Saiz fail terlalu besar. Maksimum 5MB.');
      return;
    }

    setQrFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.shop_name.trim()) {
        throw new Error('Nama kedai diperlukan.');
      }

      if (!qrFile) {
        throw new Error('Sila muat naik QR DuitNow.');
      }

      if (!user) {
        throw new Error('Sesi tamat. Sila log masuk semula.');
      }

      console.log('Uploading QR...');
      const uploadResult = await uploadSellerQR(qrFile, user.id);

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Gagal memuat naik QR.');
      }

      console.log('Creating seller record...');
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .insert({
          user_id: user.id,
          shop_name: formData.shop_name.trim(),
          description: formData.description.trim() || null,
          phone_number: formData.phone_number.trim() || null,
          duitnow_qr_url: uploadResult.url,
        })
        .select()
        .single();

      if (sellerError) {
        throw new Error('Gagal mencipta rekod peniaga.');
      }

      alert('🎉 Kedai anda berjaya didaftarkan!');
      router.push('/seller');
    } catch (err: any) {
      setError(err.message || 'Ralat tidak dijangka.');
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={submitting}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              QR DuitNow <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {qrPreview ? (
                <div>
                  <img
                    src={qrPreview}
                    alt="QR Preview"
                    className="max-w-xs mx-auto mb-4 rounded-lg shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQrFile(null);
                      setQrPreview(null);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                    disabled={submitting}
                  >
                    🗑️ Buang & Pilih Semula
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-3">
                    📷 Muat naik kod QR DuitNow anda
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleQRFileChange}
                    className="hidden"
                    id="qr-upload"
                    disabled={submitting}
                  />
                  <label
                    htmlFor="qr-upload"
                    className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer"
                  >
                    Pilih Fail QR
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Format: JPEG, PNG, WebP | Max: 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !qrFile || !formData.shop_name.trim()}
            className={`w-full py-3 rounded-lg font-semibold ${
              submitting || !qrFile || !formData.shop_name.trim()
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
