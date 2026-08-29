'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '@/types/database';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getSellerIds: () => string[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

const CART_STORAGE_KEY = 'sajian_sematang_cart';

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from sessionStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
        } catch (error) {
          console.error('Error loading cart from storage:', error);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Save cart to sessionStorage whenever it changes
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, isHydrated]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      // Check if exact same item with same options exists
      const existingItem = prevCart.find((cartItem) => {
        if (cartItem.id !== item.id) return false;
        
        // Compare options (Phase R4D)
        const cartOptions = cartItem.selectedOptions || [];
        const newOptions = item.selectedOptions || [];
        
        if (cartOptions.length !== newOptions.length) return false;
        
        // Check if all options match
        return cartOptions.every((cartOpt) =>
          newOptions.some(
            (newOpt) => newOpt.option_id === cartOpt.option_id
          )
        );
      });
      
      if (existingItem) {
        // Increment quantity if exact item (with same options) exists
        return prevCart.map((cartItem) =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      
      // Add new item with quantity 1 (different product or different options)
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      
      if (existingItem && existingItem.quantity > 1) {
        // Decrement quantity
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      
      // Remove item completely if quantity is 1
      return prevCart.filter((item) => item.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => {
      // Base price
      let itemPrice = item.price;
      
      // Add option prices (Phase R4D)
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        const optionsTotal = item.selectedOptions.reduce(
          (sum, opt) => sum + opt.price_adjustment,
          0
        );
        itemPrice += optionsTotal;
      }
      
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const getCartCount = (): number => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getSellerIds = (): string[] => {
    const sellerIds = cart.map((item) => item.seller_id);
    return Array.from(new Set(sellerIds)); // Remove duplicates
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getSellerIds,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
