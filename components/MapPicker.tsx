// components/MapPicker.tsx
'use client';

import { useEffect, useState } from 'react';

interface MapPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onLocationChange: (location: {
    latitude: number;
    longitude: number;
    address: string;
    googleMapsLink: string;
  }) => void;
  readonly?: boolean;
  className?: string;
}

const DEFAULT_LAT = 3.1390;
const DEFAULT_LNG = 101.6869;

export default function MapPicker(props: MapPickerProps) {
  const { initialLat, initialLng, initialAddress = '', onLocationChange, readonly = false, className = 'h-[400px] w-full rounded-lg' } = props;
  
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [address, setAddress] = useState(initialAddress || '');

  // Initialize position
  useEffect(() => {
    if (initialLat && initialLng) {
      setLatitude(initialLat);
      setLongitude(initialLng);
    }
  }, [initialLat, initialLng]);

  // Update parent when location changes
  useEffect(() => {
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    onLocationChange({
      latitude,
      longitude,
      address: address || `Lokasi: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      googleMapsLink,
    });
  }, [latitude, longitude, address, onLocationChange]);

  const getCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Browser anda tidak menyokong GPS. Sila masukkan koordinat manual.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat);
        setLongitude(lng);
        setAddress('Lokasi semasa anda (GPS)');
      },
      (error) => {
        console.error('GPS error:', error);
        alert('Gagal mendapatkan lokasi GPS. Sila pastikan GPS diaktifkan.');
      }
    );
  };

  const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="space-y-4">
      <div className={className}>
        <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-300">
          <iframe
            src={googleMapsEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Location"
          />
          <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
            <div className="text-sm font-medium text-gray-700">
              📍 {address || 'Pilih lokasi anda'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {!readonly && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              📍 Kesan Lokasi Saya (GPS)
            </button>
            <button
              type="button"
              onClick={() => {
                setLatitude(DEFAULT_LAT);
                setLongitude(DEFAULT_LNG);
                setAddress('Kuala Lumpur (Default)');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              🏙️ Kuala Lumpur (Default)
            </button>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">📍 Maklumat Lokasi</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => {
                  if (readonly) return;
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) setLatitude(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3.1390"
                disabled={readonly}
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => {
                  if (readonly) return;
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) setLongitude(value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="101.6869"
                disabled={readonly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pautan Google Maps</p>
              <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all text-sm">
                {googleMapsLink}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Koordinat</p>
              <p className="font-mono text-gray-800 text-sm">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {!readonly && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Arahan:</strong> Klik butang "Kesan Lokasi Saya" untuk gunakan GPS anda, atau masukkan koordinat manual. 
              Lokasi akan dipaparkan secara automatik pada peta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
