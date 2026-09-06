'use client';

import { useState } from 'react';

interface AdminProductCreateModalProps {
  sellers: any[];
  categories: any[];
  isOpen: boolean;
  onClose: () => void;
  onCreate: (productData: any) => Promise<void>;
  onCloseAndOpenCategoryModal?: () => void;
}

export default function AdminProductCreateModal({
  sellers,
  categories,
  isOpen,
  onClose,
  onCreate,
}: AdminProductCreateModalProps) {
  const [formData, setFormData] = useState({
    seller_id: sellers[0]?.id || '',
    name: '',
    category: categories[0]?.name || '',
    price: '',
    cost_price: '',
    stock_quantity: '0',
    is_available: true,
    is_preorder: false,
    preorder_start: '',
    preorder_end: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onCreate({
        ...formData,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity),
        is_preorder: formData.is_preorder,
        preorder_start: formData.is_preorder && formData.preorder_start ? formData.preorder_start : null,
        preorder_end: formData.is_preorder && formData.preorder_end ? formData.preorder_end : null,
      });
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mencipta produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const standardCategories = ['Makanan', 'Minuman', 'Kuih-Muih', 'Snek', 'Pencuci Mulut'];

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl pb-28">
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-slate-900 text-xl font-bold">➕ Tambah Produk Baru</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-900 font-semibold text-sm mb-1 block">Peniaga</label>
              <select
                value={formData.seller_id}
                onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })}
                className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
                required
              >
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>{seller.shop_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-900 font-semibold text-sm mb-1 block">Nama Produk</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
                placeholder="Contoh: Nasi Lemak Ayam Goreng"
                required
              />
            </div>

            <div>
              <label className="text-slate-900 font-semibold text-sm mb-1 block">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
                required
              >
                {standardCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-900 font-semibold text-sm mb-1 block">Harga Jualan (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-900 font-semibold text-sm mb-1 block">Harga Kos (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-900 font-semibold text-sm mb-1 block">Stok</label>
              <input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Mod Pre-Order Section */}
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-slate-900 font-semibold text-sm mb-1">Mod Pre-Order</h3>
                  <p className="text-xs text-gray-600">Aktifkan untuk tempahan masa hadapan</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_preorder: !formData.is_preorder })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 ${
                    formData.is_preorder ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full transform ${
                    formData.is_preorder ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>

              {formData.is_preorder && (
                <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-900 font-semibold text-sm mb-1 block">Mula Pre-Order</label>
                      <input
                        type="datetime-local"
                        value={formData.preorder_start}
                        onChange={(e) => setFormData({ ...formData, preorder_start: e.target.value })}
                        className="text-slate-900 bg-white border border-gray-300 rounded-lg p-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="text-slate-900 font-semibold text-sm mb-1 block">Tamat Pre-Order</label>
                      <input
                        type="datetime-local"
                        value={formData.preorder_end}
                        onChange={(e) => setFormData({ ...formData, preorder_end: e.target.value })}
                        className="text-slate-900 bg-white border border-gray-300 rounded-lg p-2 w-full"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Nota: Apabila Mod Pre-Order aktif, stok dikira sebagai kuantiti tidak terhad dan tempahan hanya boleh dibuat dalam tempoh yang ditetapkan.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-slate-900 font-semibold text-sm mb-1">Status Aktif</p>
                <p className="text-xs text-gray-600">Paparkan kepada pelanggan</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                className={`w-12 h-6 flex items-center rounded-full p-1 ${
                  formData.is_available ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full transform ${
                  formData.is_available ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>
            
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}