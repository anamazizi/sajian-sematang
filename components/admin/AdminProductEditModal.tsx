'use client';

export default function AdminProductEditModal({ product, isOpen, onClose }: any) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto pb-32 shadow-2xl">
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">✏️ Edit Produk</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg">✕</button>
          </div>
          <p className="text-gray-600">Modal Edit Produk</p>
        </div>
      </div>
    </div>
  );
}