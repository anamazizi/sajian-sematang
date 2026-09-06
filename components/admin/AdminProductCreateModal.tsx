'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

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
  // Debug: Log received categories
  console.log('AdminProductCreateModal received categories:', categories);
  console.log('Categories type:', typeof categories);
  console.log('Is array?', Array.isArray(categories));
  
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    seller_id: sellers[0]?.id || '',
    name: '',
    category: '',
    price: '',
    cost_price: '',
    stock_quantity: '0',
    image_url: '',
    display_order: 1,
    is_available: true,
    is_preorder: false,
    preorder_start: '',
    preorder_end: '',
  });
  const [productOptions, setProductOptions] = useState<Array<{
    option_name: string;
    price_adjustment: string;
    is_available: boolean;
    display_order: number;
  }>>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories jika prop kosong
  useEffect(() => {
    const fetchCategoriesIfNeeded = async () => {
      // Jika prop categories kosong atau undefined, fetch sendiri dari Supabase
      if (!Array.isArray(categories) || categories.length === 0) {
        console.log('CreateModal: Fetching categories from Supabase (fallback)...');
        try {
          const { data: categoriesData, error } = await supabase
            .from('categories')
            .select('id, name')
            .eq('is_active', true)
            .order('name', { ascending: true });

          if (error) throw error;
          
          console.log('CreateModal: Fallback categories fetched:', categoriesData);
          setLocalCategories(categoriesData || []);
        } catch (error) {
          console.error('CreateModal: Error fetching categories (fallback):', error);
          setLocalCategories([]);
        }
      } else {
        // Gunakan prop categories yang diberikan
        console.log('CreateModal: Using prop categories, count:', categories.length);
        setLocalCategories(categories);
      }
    };

    fetchCategoriesIfNeeded();
  }, [categories]);

  // Update formData.category apabila localCategories berubah dan formData.category kosong
  useEffect(() => {
    if (Array.isArray(localCategories) && localCategories.length > 0 && !formData.category) {
      const defaultCategory = localCategories[0]?.name;
      if (defaultCategory) {
        console.log('Setting default category to:', defaultCategory);
        setFormData(prev => ({ ...prev, category: defaultCategory }));
      }
    }
  }, [localCategories, formData.category]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    setProductOptions([
      ...productOptions,
      {
        option_name: '',
        price_adjustment: '0.00',
        is_available: true,
        display_order: productOptions.length + 1
      }
    ]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...productOptions];
    newOptions.splice(index, 1);
    // Update display order
    const updatedOptions = newOptions.map((option, idx) => ({
      ...option,
      display_order: idx + 1
    }));
    setProductOptions(updatedOptions);
  };

  const handleOptionChange = (index: number, field: string, value: string | boolean) => {
    const newOptions = [...productOptions];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value
    };
    setProductOptions(newOptions);
  };

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
        options: productOptions.map(option => ({
          ...option,
          price_adjustment: parseFloat(option.price_adjustment)
        }))
      });
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mencipta produk.');
    } finally {
      setIsSubmitting(false);
    }
  };



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
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Pilih Kategori</option>
                {Array.isArray(localCategories) && localCategories.length > 0 ? (
                  localCategories.map((cat: any, index: number) => {
                    const catName = typeof cat === 'string' ? cat : cat.name;
                    const catId = cat.id || `cat-${index}`;
                    console.log(`CreateModal Category option: ${catName} (ID: ${catId})`);
                    return (
                      <option key={catId} value={catName}>
                        {catName}
                      </option>
                    );
                  })
                ) : (
                  <option disabled value="">(Tiada kategori ditemui - Sila semak data)</option>
                )}
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

            {/* Gambar Produk */}
            <div>
              <label className="text-slate-900 font-semibold text-sm mb-1 block">
                Gambar Produk (URL / Pautan Imej)
              </label>
              <input
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
              />
              {formData.image_url && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">Pratonton:</p>
                  <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const imgElement = e.currentTarget;
                        const parentElement = imgElement.parentElement;
                        
                        imgElement.style.display = 'none';
                        
                        if (parentElement) {
                          parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full text-xs text-gray-500">Gambar tidak boleh dimuatkan</div>';
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.image_url.length > 60 ? formData.image_url.substring(0, 60) + '...' : formData.image_url}
                  </p>
                </div>
              )}
            </div>

            {/* Susunan Paparan */}
            <div>
              <label className="text-slate-900 font-semibold text-sm mb-1 block">
                Susunan Paparan (Sort Order)
              </label>
              <input
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-600 mt-1">Nombor lebih rendah = lebih awal dalam senarai</p>
            </div>

            {/* Product Options Section */}
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-slate-900 font-semibold text-sm mb-1">Pilihan / Add-ons</h3>
                  <p className="text-xs text-gray-600">Tambahan seperti saiz, topping, atau bahan tambahan</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                >
                  + Tambah Pilihan
                </button>
              </div>

              {productOptions.length > 0 ? (
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  {productOptions.map((option, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            #{option.display_order}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            Pilihan {option.display_order}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️ Padam
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-900 font-semibold text-xs mb-1 block">Nama Option</label>
                          <input
                            type="text"
                            value={option.option_name}
                            onChange={(e) => handleOptionChange(index, 'option_name', e.target.value)}
                            className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                            placeholder="Contoh: Saiz Besar, Extra Cheese, Ais"
                          />
                        </div>
                        <div>
                          <label className="text-slate-900 font-semibold text-xs mb-1 block">Harga Tambahan (RM)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={option.price_adjustment}
                            onChange={(e) => handleOptionChange(index, 'price_adjustment', e.target.value)}
                            className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div>
                          <p className="text-slate-900 font-semibold text-xs mb-1">Status Aktif</p>
                          <p className="text-xs text-gray-600">Paparkan kepada pelanggan</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOptionChange(index, 'is_available', !option.is_available)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 ${
                            option.is_available ? 'bg-green-400' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`bg-white w-3 h-3 rounded-full transform ${
                            option.is_available ? 'translate-x-5' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500 text-sm">Tiada pilihan ditambah.</p>
                  <p className="text-gray-400 text-xs mt-1">Klik "Tambah Pilihan" untuk menambah add-on.</p>
                </div>
              )}
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