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
    bank_name: '',
    bank_account_number: '',
    account_holder_name: '',
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
      router.push('/jualan');
    }
  }

  async function handleQRFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Format fail tidak sah. Sila gunakan JPEG, PNG, atau WebP.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // Increased to 10MB
    if (file.size > maxSize) {
      setError('Saiz fail terlalu besar. Maksimum 10MB.');
      return;
    }

    setError(null);

    // Client-side compression/resize
    try {
      const compressedFile = await compressImage(file);
      setQrFile(compressedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Compression error:', err);
      // If compression fails, use original
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Image compression helper
  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85 // Quality 85%
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

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

      // QR upload is now OPTIONAL
      let qrUrl: string | null = null;
      
      if (qrFile) {
        console.log('📤 Starting QR upload...');
        console.log('👤 User ID:', user.id);
        console.log('📁 File:', qrFile.name, qrFile.type, (qrFile.size / 1024).toFixed(2) + 'KB');
        
        const uploadResult = await uploadSellerQR(qrFile, user.id);

        if (!uploadResult.success || !uploadResult.url) {
          // Display VERBOSE error from Supabase
          const detailedError = uploadResult.error || 'Gagal memuat naik QR.';
          console.error('❌ Upload failed:', detailedError);
          console.error('❌ Upload error details:', uploadResult.errorDetails);
          
          // Show full Supabase error to user for debugging
          throw new Error(detailedError);
        }

        qrUrl = uploadResult.url;
        console.log('✅ QR uploaded successfully:', qrUrl);
      } else {
        console.log('ℹ️ No QR file uploaded - seller can upload later in profile');
      }

      console.log('📝 Creating seller record...');
      
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .insert({
          user_id: user.id,
          shop_name: formData.shop_name.trim(),
          description: formData.description.trim() || null,
          phone_number: formData.phone_number.trim() || null,
          bank_name: formData.bank_name.trim(),
          bank_account_number: formData.bank_account_number.trim(),
          account_holder_name: formData.account_holder_name.trim(),
          duitnow_qr_url: qrUrl, // Can be NULL
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

          <div className="mb-6 border-t pt-6">
            <label className="block text-gray-700 font-medium mb-2">
              QR DuitNow <span className="text-gray-500 text-sm">(Pilihan)</span>
            </label>
            <p className="text-sm text-gray-600 mb-3">
              ℹ️ Anda boleh muat naik QR DuitNow sekarang atau kemudian di halaman Profil Kedai.
            </p>
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
                    accept="image/jpeg,image/jpg,image/png,image/webp"
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
                    Format: JPEG, PNG, WebP | Max: 10MB
                    <br />
                    <span className="text-xs">Imej akan dimampatkan secara automatik</span>
                  </p>
                </div>
              )}
            </div>
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
