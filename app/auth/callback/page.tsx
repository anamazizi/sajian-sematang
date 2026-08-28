'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Sedang mengesahkan log masuk...');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      setMessage("Memeriksa profil...");
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Jika tiada profil atau pengguna ialah customer, terus ke halaman utama (/)
      if (!profile || profile.role === 'customer') {
        setMessage("Log masuk berjaya! Mengalihkan...");
        router.push('/');
        return;
      }

      // If seller role, check if seller record exists
      if (profile.role === 'seller') {
        const { data: sellerRecord } = await supabase
          .from('sellers')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        // If no seller record, redirect to onboarding
        if (!sellerRecord) {
          setMessage("Mengalihkan ke pendaftaran kedai...");
          router.push('/seller/onboarding');
          return;
        }

        // Seller record exists, go to dashboard
        setMessage("Log masuk berjaya!");
        router.push('/seller');
        return;
      }

      // Jika admin, staf, atau seller, arahkan ke laluan khusus mereka
      const redirectPath = profile.role === 'admin' ? '/admin' : profile.role === 'staff' ? '/staff' : '/sellers';
      router.push(redirectPath);

    } catch (error: any) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Ralat semasa log masuk');
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-sm w-full">
        <h2 className="text-lg font-bold mb-2 text-gray-800">Sajian Sematang</h2>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
