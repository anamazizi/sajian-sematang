'use client';

// Phase R3C: Add New Product Page

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth/hooks';
import { supabase } from '../../../../lib/supabase/client';
import ProductForm, { ProductFormData } from '../../../../components/seller/ProductForm';
import { uploadProductImage } from '../../../../lib/storage/product-images';
import Link from 'next/link';

export default function AddProductPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && profile && profile.role !== 'seller') {
      router.push('/');
      return;
    }

    fetchSeller();
  }, [user, profile, authLoading]);

  async function fetchSeller() {
    if (!user) return;

    try {
      const { data: seller, error } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error || !seller) {
        router.push('/jualan/onboarding');
        return;
      }

      setSellerId(seller.id);
    } catch (error) {
      console.error('Error fetching seller:', error);
      router.push('/jualan/onboarding');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: ProductFormData) {
    if (!sellerId) {
      throw new Error('Seller ID tidak dijumpai');
    }

    let imageUrl: string | null = null;

    try {
      // Upload image if provided
      if (formData.image) {
        console.log('Uploading product image...');
        const uploadResult = await uploadProductImage(formData.image, sellerId);
        
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Gagal memuat naik gambar');
        }
        
        imageUrl = uploadResult.url;
      }

      // Insert product
      console.log('Creating product...');
      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: sellerId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          price: formData.price,
          cost_price: formData.cost_price,
          stock_quantity: formData.is_preorder ? 0 : formData.stock_quantity,
          is_available: formData.is_available,
          is_preorder: formData.is_preorder,
          available_from: formData.is_preorder ? formData.available_from : null,
          available_until: formData.is_preorder ? formData.available_until : null,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Gagal mencipta produk');
      }

      console.log('Product created:', product);
      alert('🎉 Produk berjaya ditambah!');
      router.push('/jualan/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  function handleCancel() {
    router.push('/jualan/products');
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan...</p>
        </div>
      </div>
    );
  }

  if (!sellerId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/jualan/products"
            className="text-green-600 hover:text-green-700 mb-2 inline-block"
          >
            ← Kembali ke Senarai Produk
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ➕ Tambah Produk Baharu
          </h1>
          <p className="text-gray-600">
            Lengkapkan maklumat produk di bawah
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ProductForm
            sellerId={sellerId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Tambah Produk"
          />
        </div>
      </div>
    </div>
  );
}
