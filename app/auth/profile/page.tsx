'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MapPicker from '../../../components/MapPicker';
import { useAuth, updateUserProfile, getRedirectAfterLogin } from '../../../lib/auth/hooks';
import { UserRole } from '../../../types/database';

export default function ProfileCompletionPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    address: '',
    google_maps_url: '', // Renamed from maps_url for consistency
    latitude: '',
    longitude: '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
// Add state for map location
  const [mapLocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    googleMapsLink: string;
  } | null>(null);
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
        google_maps_url: (profile as any).google_maps_url || '',
        latitude: (profile as any).latitude?.toString() || '',
        longitude: (profile as any).longitude?.toString() || '',
      });

      // Set map location if coordinates exist
      if ((profile as any).latitude && (profile as any).longitude) {
        const lat = (profile as any).latitude;
        const lng = (profile as any).longitude;
        setMapLocation({
          latitude: lat,
          longitude: lng,
          address: profile.address || 'Lokasi profil anda',
          googleMapsLink: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      }
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

      // Parse coordinates from mapLocation or form
      let lat: number | null = null;
      let lng: number | null = null;
      let googleMapsUrl = formData.google_maps_url.trim();

      if (mapLocation) {
        // Use coordinates from map picker
        lat = mapLocation.latitude;
        lng = mapLocation.longitude;
        googleMapsUrl = mapLocation.googleMapsLink;
        
        // Update address if map location has different address
        if (!formData.address.trim() && mapLocation.address !== 'Lokasi profil anda') {
          setFormData(prev => ({ ...prev, address: mapLocation.address }));
        }
      } else {
        // Fallback to form input
        lat = formData.latitude.trim() ? parseFloat(formData.latitude.trim()) : null;
        lng = formData.longitude.trim() ? parseFloat(formData.longitude.trim()) : null;
      }

      // Update profile
      await updateUserProfile(user!.id, {
        name: formData.name.trim(),
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim() || undefined,
        google_maps_url: googleMapsUrl || undefined,
        latitude: lat,
        longitude: lng,
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
                className="w-full px-4 py-2 text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Ahmad bin Ali"
                required
                disabled={submitting}
              />
            </div>

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
                className="w-full px-4 py-2 text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: 0123456789"
                required
                disabled={submitting}
              />
            </div>

          <div className="mb-4">
              <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
                Alamat Penghantaran
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 text-slate-900 bg-white placeholder:text-gray-400 border-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="No 123, Jalan ABC..."
                rows={3}
                disabled={submitting}
              />
            </div>

          {/* Map Picker */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              📍 Pilih Lokasi Anda
            </label>
            <MapPicker
              initialLat={mapLocation?.latitude || (formData.latitude ? parseFloat(formData.latitude) : null)}
              initialLng={mapLocation?.longitude || (formData.longitude ? parseFloat(formData.longitude) : null)}
              initialAddress={formData.address}
              onLocationChange={(location) => {
                setMapLocation(location);
                // Auto-update form fields
                setFormData(prev => ({
                  ...prev,
                  latitude: location.latitude.toString(),
                  longitude: location.longitude.toString(),
                  google_maps_url: location.googleMapsLink,
                  address: prev.address || location.address,
                }));
              }}
              className="h-[350px] w-full rounded-lg border border-gray-300"
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
