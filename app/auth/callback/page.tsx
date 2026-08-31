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

      // Check profile completion (ALL users need complete profile)
      if (!profile) {
        // No profile yet - redirect to profile page
        setMessage("Sila lengkapkan profil anda...");
        router.push('/profile');
        return;
      }

      const hasName = !!profile.name && profile.name.trim() !== '';
      const hasPhone = !!profile.phone_number && profile.phone_number.trim() !== '';
      const hasAddress = !!profile.address && profile.address.trim() !== '';
      const isComplete = hasName && hasPhone && hasAddress;

      if (!isComplete) {
        // Profile incomplete - redirect to profile page
        setMessage("Sila lengkapkan profil anda...");
        router.push('/profile');
        return;
      }

      // Profile is complete - redirect based on role
      if (profile.role === 'customer' || !profile.role) {
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
          router.push('/jualan/onboarding');
          return;
        }

        // Seller record exists, go to dashboard
        setMessage("Log masuk berjaya!");
        router.push('/jualan');
        return;
      }

      // Jika admin, staf, atau seller, arahkan ke laluan khusus mereka
      const redirectPath = profile.role === 'admin' ? '/kawalan' : profile.role === 'staff' ? '/kawalan' : profile.role === 'seller' ? '/jualan' : '/';
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
