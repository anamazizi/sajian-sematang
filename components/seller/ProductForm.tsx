'use client';

// Phase R3C: Product Form Component (Shared for Add/Edit)

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
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
  options: Array<{
    id?: string; // For existing options
    option_group: string;
    option_name: string;
    price_adjustment: number;
    is_available: boolean;
    display_order: number;
  }>;
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
    options: [], // Will be loaded separately if editing existing product
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load existing options when editing a product
  useEffect(() => {
    async function loadProductOptions() {
      if (!product?.id) return;

      setLoadingOptions(true);
      try {
        const { data: options, error } = await supabase
          .from('product_options')
          .select('*')
          .eq('product_id', product.id)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error loading product options:', error);
          return;
        }

        if (options && options.length > 0) {
          setFormData(prev => ({
            ...prev,
            options: options.map(opt => ({
              id: opt.id,
              option_group: opt.option_group,
              option_name: opt.option_name,
              price_adjustment: opt.price_adjustment,
              is_available: opt.is_available,
              display_order: opt.display_order,
            }))
          }));
        }
      } catch (err) {
        console.error('Error in loadProductOptions:', err);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadProductOptions();
  }, [product?.id]);

  // Functions for managing options
  const addOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {
          option_group: 'Add-ons',
          option_name: '',
          price_adjustment: 0,
          is_available: true,
          display_order: formData.options.length,
        },
      ],
    });
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value,
    };
    setFormData({ ...formData, options: updatedOptions });
  };

  const removeOption = (index: number) => {
    const updatedOptions = formData.options.filter((_, i) => i !== index);
    // Update display order
    const reorderedOptions = updatedOptions.map((option, i) => ({
      ...option,
      display_order: i,
    }));
    setFormData({ ...formData, options: reorderedOptions });
  };

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
            Harga Sajian Sematang (RM) <span className="text-red-500">*</span>
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
            Harga untuk dibayar oleh Sajian Sematang
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

      {/* Product Options / Add-ons Section */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-900">Pilihan / Add-ons</h3>
          <button
            type="button"
            onClick={addOption}
            disabled={submitting}
            className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-medium transition"
          >
            + Tambah Pilihan / Add-on
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Tambah pilihan untuk produk ini seperti saiz, topping, atau variant.
        </p>

        {formData.options.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-gray-500">Belum ada pilihan ditambah</p>
            <p className="text-sm text-gray-400 mt-1">
              Klik "Tambah Pilihan / Add-on" untuk mula
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.options.map((option, index) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-slate-900">
                    Pilihan #{index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={submitting}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Padam
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Nama Option
                    </label>
                    <input
                      type="text"
                      value={option.option_name}
                      onChange={(e) =>
                        updateOption(index, 'option_name', e.target.value)
                      }
                      placeholder="Contoh: Extra Cheese, Saiz Besar, Kurang Manis"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white placeholder:text-gray-400"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Harga Tambahan (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={option.price_adjustment}
                      onChange={(e) =>
                        updateOption(
                          index,
                          'price_adjustment',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white placeholder:text-gray-400"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={option.is_available}
                      onChange={(e) =>
                        updateOption(index, 'is_available', e.target.checked)
                      }
                      className="w-4 h-4"
                      disabled={submitting}
                    />
                    <span>Option aktif (boleh dipilih)</span>
                  </label>
                </div>
              </div>
            ))}
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
