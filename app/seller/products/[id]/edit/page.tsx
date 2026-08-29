'use client';

// Phase R3C: Edit Product Page

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../lib/auth/hooks';
import { supabase } from '../../../../../lib/supabase/client';
import ProductForm, { ProductFormData } from '../../../../../components/seller/ProductForm';
import { uploadProductImage, replaceProductImage } from '../../../../../lib/storage/product-images';
import { Product } from '../../../../../types/database';
import Link from 'next/link';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const productId = params.id as string;
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
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

    fetchSellerAndProduct();
  }, [user, profile, authLoading, productId]);

  async function fetchSellerAndProduct() {
    if (!user) return;

    try {
      // Get seller ID
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (sellerError || !seller) {
        router.push('/seller/onboarding');
        return;
      }

      setSellerId(seller.id);

      // Fetch product (with ownership check)
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('seller_id', seller.id) // SECURITY: Only seller's own products
        .single();

      if (productError || !productData) {
        console.error('Product not found or unauthorized:', productError);
        alert('Produk tidak dijumpai atau anda tidak mempunyai akses.');
        router.push('/seller/products');
        return;
      }

      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      router.push('/seller/products');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: ProductFormData) {
    if (!sellerId || !product) {
      throw new Error('Seller ID atau produk tidak dijumpai');
    }

    let imageUrl = product.image_url;

    try {
      // Handle image update
      if (formData.image) {
        console.log('Uploading new product image...');
        
        // Replace old image with new one
        const uploadResult = await replaceProductImage(
          formData.image,
          sellerId,
          productId,
          product.image_url || undefined
        );
        
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Gagal memuat naik gambar');
        }
        
        imageUrl = uploadResult.url;
      }

      // Update product
      console.log('Updating product...');
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('seller_id', sellerId) // SECURITY: Double-check ownership
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Gagal mengemas kini produk');
      }

      console.log('Product updated:', updatedProduct);
      alert('✅ Produk berjaya dikemaskini!');
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  function handleCancel() {
    router.push('/seller/products');
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuatkan produk...</p>
        </div>
      </div>
    );
  }

  if (!sellerId || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Produk tidak dijumpai</p>
          <Link
            href="/seller/products"
            className="text-green-600 hover:text-green-700"
          >
            ← Kembali ke Senarai Produk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/seller/products"
            className="text-green-600 hover:text-green-700 mb-2 inline-block"
          >
            ← Kembali ke Senarai Produk
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ✏️ Edit Produk
          </h1>
          <p className="text-gray-600">
            Kemaskini maklumat produk: {product.name}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ProductForm
            product={product}
            sellerId={sellerId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Simpan Perubahan"
          />
        </div>
      </div>
    </div>
  );
}
