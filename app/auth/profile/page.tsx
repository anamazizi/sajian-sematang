'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, updateUserProfile, getRedirectAfterLogin } from '../../../lib/auth/hooks';
import { UserRole } from '../../../types/database';

export default function ProfileCompletionPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    address: '',
    maps_url: '', // <-- Ditambah di sini
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }


    // Pre-fill form with existing data
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        maps_url: (profile as any).maps_url || '', // <-- Dimuatkan jika ada
      });
    }
  }, [user, profile, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Sila masukkan nama penuh');
      }

      if (!formData.phone_number.trim()) {
        throw new Error('Sila masukkan nombor telefon');
      }

      // Validate phone number format (Malaysian)
      const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
      if (!phoneRegex.test(formData.phone_number.replace(/\s/g, ''))) {
        throw new Error('Format nombor telefon tidak sah. Contoh: 0123456789');
      }

      // Seller needs address
      if (profile?.role === 'seller' && !formData.address.trim()) {
        throw new Error('Seller mesti masukkan alamat');
      }

      // Update profile
      await updateUserProfile(user!.id, {
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim() || undefined,
        maps_url: formData.maps_url.trim() || undefined, // <-- Disimpan di sini
      } as any);

      // Redirect to appropriate dashboard
      const redirectPath = getRedirectAfterLogin(profile?.role as UserRole || 'customer');
      router.push(redirectPath);

    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Ralat semasa menyimpan profil');
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-green-600 text-white p-4 rounded-full mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Lengkapkan Profil
          </h1>
          <p className="text-gray-600">
            Sila lengkapkan maklumat anda untuk meneruskan
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              Nama Penuh <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: Ahmad bin Ali"
              required
              disabled={submitting}
            />
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label htmlFor="phone_number" className="block text-gray-700 font-medium mb-2">
              Nombor Telefon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Contoh: 0123456789"
              required
              disabled={submitting}
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
              Alamat Penghantaran
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="No 123, Jalan ABC..."
              rows={3}
              disabled={submitting}
            />
          </div>

          {/* Google Maps URL */}
          <div className="mb-6">
            <label htmlFor="maps_url" className="block text-gray-700 font-medium mb-2">
              Pautan Lokasi (Google Maps URL)
            </label>
            <input
              type="url"
              id="maps_url"
              name="maps_url"
              value={formData.maps_url}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://maps.app.goo.gl/..."
              disabled={submitting}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan & Teruskan'}
          </button>
        </form>
      </div>
    </div>
  );
}
