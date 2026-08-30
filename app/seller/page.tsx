'use client';

// DEPRECATED: Redirect to /jualan
// This route is kept for backward compatibility only

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldSellerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/jualan');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengalihkan ke /jualan...</p>
      </div>
    </div>
  );
}
