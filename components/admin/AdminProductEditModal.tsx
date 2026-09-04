'use client';

import { useState, useEffect } from 'react';

export default function AdminProductEditModal({ product, categories, isOpen, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    is_available: true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '0',
        is_available: product.is_available !== false,
      });
    }
  }, [product]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave({
        ...product,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        stock_quantity: parseInt(formData.stock_quantity),
        is_available: formData.is_available,
      });
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengemaskini produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">✏️ Edit Produk</h2>
            <button onClick={onClose} className="text-gray-500">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Produk</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Pilih Kategori</option>
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
                <option value="Kuih-Muih">Kuih-Muih</option>
                <option value="Snek">Snek</option>
                <option value="Pencuci Mulut">Pencuci Mulut</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Harga Jualan</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Harga Kos</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stok</label>
              <input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status Aktif</p>
                <p className="text-xs text-gray-500">Paparkan kepada pelanggan</p>
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
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