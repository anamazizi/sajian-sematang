'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ARCHITECTURE CHANGE: Centralized Menu Model
// Customers no longer browse by seller - redirect to homepage

export default function SellersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to centralized menu
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengalihkan ke menu utama...</p>
      </div>
    </div>
  );
}
