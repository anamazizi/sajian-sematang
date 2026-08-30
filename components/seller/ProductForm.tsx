'use client';

// Phase R3C: Product Form Component (Shared for Add/Edit)

import { useState } from 'react';
import { Product } from '../../types/database';

interface ProductFormProps {
  product?: Product;
  sellerId: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  is_available: boolean;
  is_preorder: boolean;
  available_from: string;
  available_until: string;
  // Image removed - products don't have images
}

const CATEGORIES = ['Makanan', 'Minuman', 'Combo', 'Lain-lain'];

export default function ProductForm({
  product,
  sellerId,
  onSubmit,
  onCancel,
  submitLabel = 'Simpan Produk',
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'Makanan',
    price: product?.price || 0,
    cost_price: product?.cost_price || 0,
    stock_quantity: product?.stock_quantity || 0,
    is_available: product?.is_available ?? true,
    is_preorder: product?.is_preorder || false,
    available_from: product?.available_from || '',
    available_until: product?.available_until || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image functionality removed - products don't have images

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('Nama produk diperlukan.');
      }

      if (formData.price <= 0) {
        throw new Error('Harga jualan mesti lebih besar daripada RM0.');
      }

      if (formData.cost_price < 0) {
        throw new Error('Harga kos tidak boleh negatif.');
      }

      if (formData.is_preorder) {
        if (!formData.available_from || !formData.available_until) {
          throw new Error('Tarikh mula dan tamat pre-order diperlukan.');
        }
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Ralat tidak dijangka.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Product Image section removed - products don't have images */}

      {/* Product Name */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Nama Produk <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Contoh: Nasi Lemak Special"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
          required
          disabled={submitting}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Keterangan
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Terangkan tentang produk ini..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
          disabled={submitting}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Kategori <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
          required
          disabled={submitting}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Pricing */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Harga Jualan (RM) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
            required
            disabled={submitting}
          />
          <p className="text-sm text-gray-500 mt-1">
            Harga yang pelanggan bayar
          </p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Harga Kos (RM) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_price}
            onChange={(e) =>
              setFormData({
                ...formData,
                cost_price: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
            required
            disabled={submitting}
          />
          <p className="text-sm text-gray-500 mt-1">
            Kos anda sediakan produk
          </p>
        </div>
      </div>

      {/* Stock & Availability */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Kuantiti Stok
          </label>
          <input
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) =>
              setFormData({
                ...formData,
                stock_quantity: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-slate-900 dark:text-slate-900 bg-white placeholder:text-gray-400"
            disabled={submitting || formData.is_preorder}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.is_preorder ? 'Tidak digunakan untuk pre-order' : 'Bilangan unit tersedia'}
          </p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Status
          </label>
          <div className="flex items-center gap-3 h-12">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) =>
                setFormData({ ...formData, is_available: e.target.checked })
              }
              className="w-5 h-5"
              disabled={submitting}
            />
            <label htmlFor="is_available" className="text-gray-700">
              Produk Aktif (Boleh Dipesan)
            </label>
          </div>
        </div>
      </div>

      {/* Pre-order Mode */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            id="is_preorder"
            checked={formData.is_preorder}
            onChange={(e) =>
              setFormData({ ...formData, is_preorder: e.target.checked })
            }
            className="w-5 h-5"
            disabled={submitting}
          />
          <label htmlFor="is_preorder" className="text-gray-700 font-medium">
            Mod Pre-Order
          </label>
        </div>

        {formData.is_preorder && (
          <div className="grid md:grid-cols-2 gap-4 pl-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Tarikh Mula
              </label>
              <input
                type="datetime-local"
                value={formData.available_from}
                onChange={(e) =>
                  setFormData({ ...formData, available_from: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required={formData.is_preorder}
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Tarikh Tamat
              </label>
              <input
                type="datetime-local"
                value={formData.available_until}
                onChange={(e) =>
                  setFormData({ ...formData, available_until: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required={formData.is_preorder}
                disabled={submitting}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className={`flex-1 py-3 rounded-lg font-semibold transition ${
            submitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {submitting ? '⏳ Menyimpan...' : submitLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
