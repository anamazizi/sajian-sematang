'use client';

// Phase R3D: Seller Profile Management
// Allows seller to edit shop info and update DuitNow QR

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/hooks';
import { supabase } from '../../../lib/supabase/client';
import { replaceSellerQR } from '../../../lib/storage/seller-qr';
import { Seller } from '../../../types/database';

export default function SellerProfilePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(true);

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
  const [currentQrUrl, setCurrentQrUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Authentication & Authorization
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && profile && profile.role !== 'seller') {
      router.push('/');
      return;
    }

    if (!loading && user) {
      fetchSellerProfile();
    }
  }, [user, profile, loading]);

  // Fetch seller profile from database
  async function fetchSellerProfile() {
    if (!user) return;

    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sellerError) {
        console.error('Error fetching seller:', sellerError);
        setError('Gagal memuatkan profil. Sila cuba lagi.');
        setFetchingProfile(false);
        return;
      }

      if (!sellerData) {
        // No seller record - redirect to onboarding
        router.push('/jualan/onboarding');
        return;
      }

      setSeller(sellerData);
      setFormData({
        shop_name: sellerData.shop_name || '',
        description: sellerData.description || '',
        phone_number: sellerData.phone_number || '',
        bank_name: sellerData.bank_name || '',
        bank_account_number: sellerData.bank_account_number || '',
        account_holder_name: sellerData.account_holder_name || '',
      });
      setCurrentQrUrl(sellerData.duitnow_qr_url || null);
      setFetchingProfile(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Ralat tidak dijangka.');
      setFetchingProfile(false);
    }
  }

  // Handle QR file selection
  function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format fail tidak sah. Sila gunakan JPEG, PNG, atau WebP.');
      return;
    }

    // Validate file size (max 10MB after compression)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Saiz fail terlalu besar. Maksimum 10MB.');
      return;
    }

    setQrFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Clear QR selection
  function clearQrSelection() {
    setQrFile(null);
    setQrPreview(null);
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user || !seller) {
      setError('Sesi tamat. Sila log masuk semula.');
      return;
    }

    // Validation
    if (!formData.shop_name.trim()) {
      setError('Nama kedai diperlukan.');
      return;
    }

    // Bank validation
    if (!formData.bank_name.trim()) {
      setError('Nama bank diperlukan.');
      return;
    }

    if (!formData.bank_account_number.trim()) {
      setError('Nombor akaun bank diperlukan.');
      return;
    }

    if (!formData.account_holder_name.trim()) {
      setError('Nama pemegang akaun diperlukan.');
      return;
    }

    setSubmitting(true);

    try {
      let newQrUrl = currentQrUrl;

      // If new QR file selected, upload and replace
      if (qrFile) {
        console.log('📤 Uploading new QR...');
        console.log('🆔 Seller ID:', seller.id);
        console.log('📁 File:', qrFile.name, qrFile.type);
        
        const uploadResult = await replaceSellerQR(
          qrFile,
          seller.id,
          currentQrUrl || undefined
        );

        if (!uploadResult.success) {
          const detailedError = uploadResult.error || 'Gagal memuat naik QR. Sila cuba lagi.';
          console.error('❌ Upload failed:', detailedError);
          console.error('❌ Upload error details:', uploadResult.errorDetails);
          
          // Show verbose error with alert
          alert(`⚠️ UPLOAD ERROR:\n\n${detailedError}\n\nSila semak console (F12) untuk maklumat lanjut.`);
          
          setError(detailedError);
          setSubmitting(false);
          return;
        }

        newQrUrl = uploadResult.url || null;
        console.log('✅ QR uploaded successfully:', newQrUrl);
      }

      // Update seller record
      console.log('📝 Updating seller profile...');
      const { error: updateError } = await supabase
        .from('sellers')
        .update({
          shop_name: formData.shop_name.trim(),
          description: formData.description.trim() || null,
          phone_number: formData.phone_number.trim() || null,
          bank_name: formData.bank_name.trim(),
          bank_account_number: formData.bank_account_number.trim(),
          account_holder_name: formData.account_holder_name.trim(),
          duitnow_qr_url: newQrUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', seller.id)
        .eq('user_id', user.id); // Security: double-check ownership

      if (updateError) {
        console.error('❌ Profile update error:', updateError);
        setError(`Gagal mengemaskini profil: ${updateError.message}`);
        setSubmitting(false);
        return;
      }

      // Update local state
      setCurrentQrUrl(newQrUrl);
      setQrFile(null);
      setQrPreview(null);
      setSuccess(true);
      setSubmitting(false);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Optionally refresh seller data
      setTimeout(() => {
        fetchSellerProfile();
      }, 1000);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Ralat tidak dijangka. Sila cuba lagi.');
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan profil...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or not seller
  if (!user || !profile || profile.role !== 'seller' || !seller) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/jualan')}
            className="text-green-600 hover:text-green-700 flex items-center gap-2 mb-4"
          >
            ← Kembali ke Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Profil Kedai</h1>
          <p className="text-gray-600 mt-2">Kemaskini maklumat kedai anda</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✅ Profil berjaya dikemaskini!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Shop Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Nama Kedai <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.shop_name}
              onChange={(e) =>
                setFormData({ ...formData, shop_name: e.target.value })
              }
              placeholder="Contoh: Kedai Makan Anam"
              className="text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Penerangan Kedai
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Contoh: Hidangan tradisional tempatan dengan cita rasa istimewa..."
              rows={4}
              className="text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Nombor Telefon
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              placeholder="Contoh: 0123456789"
              className="text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Bank Account Information */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Maklumat Akaun Bank</h3>
            <p className="text-sm text-gray-600 mb-4">
              Digunakan untuk pembayaran settlement dari Sajian Sematang kepada peniaga.
            </p>

            <div>
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
                className="text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
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
                className="text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Nama Pemegang Akaun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.account_holder_name}
                onChange={(e) =>
                  setFormData({ ...formData, account_holder_name: e.target.value })
                }
                placeholder="Nama seperti dalam akaun bank"
                className="text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Current QR Code */}
          {currentQrUrl && !qrPreview && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                QR DuitNow Semasa
              </label>
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <img
                  src={currentQrUrl}
                  alt="Current DuitNow QR"
                  className="w-48 h-48 object-contain mx-auto"
                />
                <p className="text-center text-sm text-gray-600 mt-2">
                  QR DuitNow untuk pembayaran
                </p>
              </div>
            </div>
          )}

          {/* New QR Code Upload */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {currentQrUrl ? 'Tukar QR DuitNow' : 'Muat Naik QR DuitNow'}
              {!currentQrUrl && <span className="text-red-500"> *</span>}
            </label>

            {qrPreview ? (
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <img
                  src={qrPreview}
                  alt="QR Preview"
                  className="w-48 h-48 object-contain mx-auto"
                />
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={clearQrSelection}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    ✕ Batalkan
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleQrChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Format: JPEG, PNG, WebP • Maksimum: 5MB
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/jualan')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400 font-medium text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Petua</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Pastikan QR DuitNow adalah sah dan boleh diimbas</li>
            <li>• Maklumat telefon digunakan untuk komunikasi pelanggan</li>
            <li>• Penerangan yang menarik dapat meningkatkan jualan</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

