import React from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity?: number;
  is_preorder?: boolean;
  available_from?: string | null;
  available_until?: string | null;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isLowStock = !product.is_preorder && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
        <span className="text-lg font-bold text-orange-600">
          RM {product.price.toFixed(2)}
        </span>
      </div>
      
      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {product.is_preorder && (
          <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
            📅 Pre-Order
          </span>
        )}
        {isLowStock && (
          <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
            ⚠️ Stok Terhad ({product.stock_quantity})
          </span>
        )}
        {product.available_from && product.available_until && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
            ⏰ Tawaran Terhad
          </span>
        )}
      </div>
      
      <p className="text-gray-600 mb-4">{product.description}</p>
      
      <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
        Tambah ke Pesanan
      </button>
    </div>
  );
};

export default ProductCard;
