'use client';

import { useState, useEffect } from 'react';
import { Product, ProductFormData } from '../../types/database';

interface ProductFormProps {
  product?: Product;
  sellerId: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({
  product,
  sellerId,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    cost_price: product?.cost_price || 0,
    category: product?.category || '',
    image_url: product?.image_url || '',
    is_available: product?.is_available ?? true,
    stock_quantity: product?.stock_quantity || 0,
    is_preorder: product?.is_preorder || false,
    available_from: product?.available_from || null,
    available_until: product?.available_until || null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [margin, setMargin] = useState(0);
  const [marginPercentage, setMarginPercentage] = useState(0);

  // Calculate margin whenever prices change
  useEffect(() => {
    const calculatedMargin = formData.price - formData.cost_price;
    const calculatedPercentage = formData.cost_price > 0 
      ? (calculatedMargin / formData.cost_price) * 100 
      : 0;
    
    setMargin(calculatedMargin);
    setMarginPercentage(calculatedPercentage);
  }, [formData.price, formData.cost_price]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Nama produk diperlukan');
      return;
    }

    if (formData.cost_price <= 0) {
      setError('Harga kos mesti lebih besar daripada RM0.00');
      return;
    }

    if (formData.price <= formData.cost_price) {
      setError('Harga jualan mesti lebih tinggi daripada harga kos');
      return;
    }

    if (formData.stock_quantity < 0) {
      setError('Kuantiti stok tidak boleh negatif');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Ralat semasa menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {product ? 'Edit Produk' : 'Tambah Produk Baru'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Product Name */}
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
          Nama Produk <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Contoh: Nasi Lemak Special"
          required
          disabled={submitting}
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
          Penerangan
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Penerangan produk..."
          rows={3}
          disabled={submitting}
        />
      </div>

      {/* Dual Pricing Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">💰 Penetapan Harga</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Cost Price */}
          <div>
            <label htmlFor="cost_price" className="block text-gray-700 font-medium mb-2">
              Harga Kos (Kedai → Seller) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">RM</span>
              <input
                type="number"
                id="cost_price"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                required
                disabled={submitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Harga yang kedai bayar kepada seller
            </p>
          </div>

          {/* Selling Price */}
          <div>
            <label htmlFor="price" className="block text-gray-700 font-medium mb-2">
              Harga Jualan (Customer) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">RM</span>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                required
                disabled={submitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Harga yang customer bayar
            </p>
          </div>
        </div>

        {/* Margin Display */}
        <div className={`p-3 rounded-lg ${margin > 0 ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Margin Keuntungan:</span>
            <div className="text-right">
              <span className={`text-xl font-bold ${margin > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                RM {margin.toFixed(2)}
              </span>
              <span className={`text-sm ml-2 ${marginPercentage > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                ({marginPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          {margin <= 0 && formData.price > 0 && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Harga jualan mesti lebih tinggi daripada harga kos
            </p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="mb-4">
        <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
          Kategori
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Contoh: Makanan, Minuman"
          disabled={submitting}
        />
      </div>

      {/* Image URL */}
      <div className="mb-4">
        <label htmlFor="image_url" className="block text-gray-700 font-medium mb-2">
          URL Gambar
        </label>
        <input
          type="url"
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="https://example.com/image.jpg"
          disabled={submitting}
        />
      </div>

      {/* Stock Quantity */}
      <div className="mb-4">
        <label htmlFor="stock_quantity" className="block text-gray-700 font-medium mb-2">
          Kuantiti Stok
        </label>
        <input
          type="number"
          id="stock_quantity"
          name="stock_quantity"
          value={formData.stock_quantity}
          onChange={handleChange}
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={submitting}
        />
      </div>

      {/* Checkboxes */}
      <div className="mb-6 space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_available"
            checked={formData.is_available}
            onChange={handleChange}
            className="w-4 h-4"
            disabled={submitting}
          />
          <span className="text-gray-700">Produk tersedia untuk dijual</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_preorder"
            checked={formData.is_preorder}
            onChange={handleChange}
            className="w-4 h-4"
            disabled={submitting}
          />
          <span className="text-gray-700">Produk pre-order</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || margin <= 0}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Menyimpan...
            </span>
          ) : (
            product ? 'Simpan Perubahan' : 'Tambah Produk'
          )}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
