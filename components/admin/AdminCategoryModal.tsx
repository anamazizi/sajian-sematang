'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  product_count?: number;
}

interface AdminCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Props untuk backward compatibility (optional)
  categories?: Category[];
  onSaveCategory?: (categoryData: any) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

export default function AdminCategoryModal({ 
  isOpen, 
  onClose,
  categories: propCategories = [],
  onSaveCategory,
  onDeleteCategory 
}: AdminCategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>(propCategories);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      if (propCategories && propCategories.length > 0) {
        // Gunakan categories dari prop jika diberikan
        setCategories(propCategories);
      } else {
        // Fetch categories jika tidak diberikan sebagai prop
        fetchCategories();
      }
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, propCategories]);

  async function fetchCategories() {
    try {
      console.log('Fetching categories from Supabase...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories from Supabase:', error);
        throw error;
      }

      console.log('Categories fetched successfully:', data?.length || 0, 'categories found');
      
      // Also fetch product counts for each category
      const categoriesWithProductCounts = await Promise.all(
        (data || []).map(async (cat) => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('category', cat.name);

          return {
            id: cat.id,
            name: cat.name,
            description: cat.description,
            is_active: cat.is_active,
            created_at: cat.created_at,
            updated_at: cat.updated_at,
            created_by: cat.created_by,
            product_count: count || 0
          };
        })
      );

      setCategories(categoriesWithProductCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }

  async function handleAddCategory() {
    if (!categoryName.trim()) {
      setError('Sila masukkan nama kategori');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (onSaveCategory) {
        // Gunakan external handler jika diberikan
        await onSaveCategory({
          name: categoryName.trim(),
          description: categoryDescription.trim() || null,
          is_active: true
        });
      } else {
        // Use internal implementation
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        const { error } = await supabase
          .from('categories')
          .insert({
            name: categoryName.trim(),
            description: categoryDescription.trim() || null,
            is_active: true,
            created_by: userId
          });

        if (error) throw error;
      }

      const addedCategoryName = categoryName.trim();
      
      setCategoryName('');
      setCategoryDescription('');
      setSuccessMessage(`Kategori "${addedCategoryName}" berjaya ditambah!`);
      
      // Optimistic update: tambah kategori baru ke senarai sementara
      const optimisticCategory = {
        id: 'temp-' + Date.now(), // Temporary ID untuk optimistic update
        name: addedCategoryName,
        description: categoryDescription.trim() || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        product_count: 0
      };
      
      setCategories(prev => [...prev, optimisticCategory].sort((a, b) => 
        a.name.localeCompare(b.name)
      ));
      
      // Always refresh categories list from server untuk data terkini
      await fetchCategories();
    } catch (error: any) {
      console.error('Error adding category:', error);
      setError(`Gagal menambah kategori: ${error.message || 'Sila cuba lagi'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    setDeleteLoading(categoryId);
    setError(null);

    try {
      const category = categories.find(c => c.id === categoryId);
      
      if (category?.product_count && category.product_count > 0) {
        setError(`Kategori tidak boleh dipadam kerana sedang digunakan oleh ${category.product_count} produk sedia ada`);
        setDeleteLoading(null);
        return;
      }

      if (onDeleteCategory) {
        // Gunakan external handler jika diberikan
        await onDeleteCategory(categoryId);
      } else {
        // Check if category is being used by any active products (internal implementation)
        const { data: productsData, error: checkError } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('category', categoryId)
          .eq('is_available', true);

        if (checkError) throw checkError;

        const productCount = productsData?.length || 0;

        if (productCount > 0) {
          setError(`Kategori tidak boleh dipadam kerana sedang digunakan oleh ${productCount} produk sedia ada`);
          setDeleteLoading(null);
          return;
        }

        // Proceed with deletion
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;
      }

      setSuccessMessage('Kategori berjaya dipadam!');
      
      // Refresh categories list
      if (!propCategories || propCategories.length === 0) {
        await fetchCategories();
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setError(`Gagal memadam kategori: ${error.message || 'Sila cuba lagi'}`);
    } finally {
      setDeleteLoading(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">🏷️ Urus Kategori</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Add Category Form */}
          <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">Tambah Kategori Baru</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Contoh: Makanan, Minuman, Kuih-Muih, Snek"
                  className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg p-2.5 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Penerangan (Opsional)
                </label>
                <input
                  type="text"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Penerangan ringkas kategori..."
                  className="text-slate-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-lg p-2.5 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
              </div>

              <button
                onClick={handleAddCategory}
                disabled={loading || !categoryName.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Memproses...
                  </>
                ) : (
                  <>
                    <span className="text-lg">+</span>
                    Tambah Kategori
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Senarai Kategori Sedia Ada</h3>
            
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                Tiada kategori dijumpai. Sila tambah kategori pertama anda.
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800">{category.name}</span>
                        {category.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            Tidak Aktif
                          </span>
                        )}
                      </div>
                      
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-1">{category.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        <span className="inline-block mr-3">
                          📦 {category.product_count || 0} produk
                        </span>
                        <span className="inline-block">
                          📅 {new Date(category.created_at).toLocaleDateString('ms-MY')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deleteLoading === category.id || category.product_count! > 0}
                      className={`ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors ${
                        category.product_count! > 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={
                        category.product_count! > 0 
                          ? `Kategori sedang digunakan oleh ${category.product_count} produk`
                          : 'Padam kategori'
                      }
                    >
                      {deleteLoading === category.id ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></span>
                      ) : (
                        <span className="text-lg">🗑️</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}