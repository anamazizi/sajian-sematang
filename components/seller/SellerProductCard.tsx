'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '../../types/database';

interface SellerProductCardProps {
  product: Product;
  onToggleAvailability: (productId: string, currentStatus: boolean) => void;
  onDelete: (productId: string) => void;
  onMoveUp: (productId: string) => Promise<void>;
  onMoveDown: (productId: string) => Promise<void>;
  isFirstProduct?: boolean;
  isLastProduct?: boolean;
}

const SellerProductCard: React.FC<SellerProductCardProps> = ({
  product,
  onToggleAvailability,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirstProduct = false,
  isLastProduct = false,
}) => {
  const [isMovingUp, setIsMovingUp] = useState(false);
  const [isMovingDown, setIsMovingDown] = useState(false);

  const handleMoveUp = async () => {
    if (isFirstProduct || isMovingUp) return;
    setIsMovingUp(true);
    try {
      await onMoveUp(product.id);
    } finally {
      setIsMovingUp(false);
    }
  };

  const handleMoveDown = async () => {
    if (isLastProduct || isMovingDown) return;
    setIsMovingDown(true);
    try {
      await onMoveDown(product.id);
    } finally {
      setIsMovingDown(false);
    }
  };
    return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        {product.is_preorder ? (
          <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
            Pre-Order
          </span>
        ) : product.is_available ? (
          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
            Aktif
          </span>
        ) : (
          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
            Tidak Aktif
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500 uppercase">
            {product.category || 'Tanpa Kategori'}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Display Order Info (Optional) */}
        {typeof product.display_order !== 'undefined' && (
          <div className="mb-2 text-xs text-gray-500">
            📍 Kedudukan: {product.display_order}
          </div>
        )}

        {/* Pricing */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-xs text-gray-500">Harga Jualan</p>
            <p className="text-lg font-bold text-green-600">
              RM {product.price.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Harga SS</p>
            <p className="text-sm font-semibold text-gray-700">
              RM {product.cost_price.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Stock */}
        {!product.is_preorder && (
          <div className="mb-3 pb-3 border-b">
            <p className="text-xs text-gray-500">Stok</p>
            <p className={`text-sm font-semibold ${
              product.stock_quantity > 10
                ? 'text-green-600'
                : product.stock_quantity > 0
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {product.stock_quantity} unit
            </p>
          </div>
        )}

        {/* Reorder Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleMoveUp}
            disabled={isFirstProduct || isMovingUp}
            className={`flex-1 px-3 py-2 rounded-lg transition text-sm font-semibold flex items-center justify-center min-h-[40px] ${
              isFirstProduct || isMovingUp
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={isFirstProduct ? 'Sudah di kedudukan paling atas' : 'Ke Atas'}
          >
            {isMovingUp ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <span>{isFirstProduct ? '⏫' : '▲'}</span>
            )}
          </button>
          <button
            onClick={handleMoveDown}
            disabled={isLastProduct || isMovingDown}
            className={`flex-1 px-3 py-2 rounded-lg transition text-sm font-semibold flex items-center justify-center min-h-[40px] ${
              isLastProduct || isMovingDown
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={isLastProduct ? 'Sudah di kedudukan paling bawah' : 'Ke Bawah'}
          >
            {isMovingDown ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <span>{isLastProduct ? '⏬' : '▼'}</span>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/jualan/products/${product.id}/edit`}
            className="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
          >
            ✏️ Edit
          </Link>
          <button
            onClick={() => onToggleAvailability(product.id, product.is_available)}
            className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
              product.is_available
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {product.is_available ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerProductCard;