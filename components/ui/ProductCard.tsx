'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/auth/hooks';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity?: number;
  is_preorder?: boolean;
  available_from?: string | null;
  available_until?: string | null;
  total_likes?: number;
  total_sold?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(product.total_likes || 0);
  const [loading, setLoading] = useState(false);
  const isLowStock = !product.is_preorder && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5;

  // Check if user has liked this product
  useEffect(() => {
    if (user) {
      checkUserLike();
    }
  }, [user, product.id]);

  async function checkUserLike() {
    try {
      const { data, error } = await supabase
        .from('product_likes')
        .select('id')
        .eq('product_id', product.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!error && data) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error checking like:', error);
    }
  }

  async function toggleLike() {
    if (!user) {
      alert('Sila log masuk untuk like produk');
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('product_likes')
          .delete()
          .eq('product_id', product.id)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Like
        const { error } = await supabase
          .from('product_likes')
          .insert({
            product_id: product.id,
            user_id: user.id
          });

        if (!error) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Ralat semasa mengemaskini like.');
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      alert(`${product.name} ditambah ke pesanan!`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
        <span className="text-lg font-bold text-slate-900">
          RM {product.price.toFixed(2)}
        </span>
      </div>
      
      {/* Badges & Stats */}
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
        
        {/* Likes & Sales Stats */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleLike}
            disabled={loading}
            className={`flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            title={isLiked ? 'Unlike produk ini' : 'Like produk ini'}
          >
            <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
            <span>{likesCount}</span>
          </button>
          
          {product.total_sold !== undefined && product.total_sold > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600" title="Jumlah berjaya dijual">
              <span>📦</span>
              <span>{product.total_sold}</span>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">{product.description}</p>
      
      {/* Additional Stats */}
      {(likesCount > 0 || product.total_sold) && (
        <div className="mb-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {likesCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-red-400">❤️</span>
                  <span>{likesCount} likes</span>
                </span>
              )}
              {product.total_sold !== undefined && product.total_sold > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-green-500">📦</span>
                  <span>{product.total_sold} terjual</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      <button 
        onClick={handleAddToCart}
        className="w-full bg-yellow-400 text-slate-900 py-2 rounded-lg hover:bg-yellow-500 transition font-semibold"
      >
        Tambah ke Pesanan
      </button>
    </div>
  );
};

export default ProductCard;
