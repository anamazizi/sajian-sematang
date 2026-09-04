'use client';

export default function AdminBottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around items-center h-16">
        <button className="flex flex-col items-center p-2 text-blue-600 hover:text-blue-800">
          <span className="text-2xl">📊</span>
          <span className="text-xs font-medium">Dashboard</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-800">
          <span className="text-2xl">📦</span>
          <span className="text-xs font-medium">Stok</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-800">
          <span className="text-2xl">👥</span>
          <span className="text-xs font-medium">Pembeli</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-gray-600 hover:text-gray-800">
          <span className="text-2xl">📝</span>
          <span className="text-xs font-medium">Laporan</span>
        </button>
      </div>
    </div>
  );
}