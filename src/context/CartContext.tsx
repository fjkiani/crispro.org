import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem } from '../types/triage';

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (clinvar_id: string) => void;
  clearCart: () => void;
  isInCart: (clinvar_id: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  function addToCart(item: CartItem) {
    setCartItems((prev) => {
      if (prev.some((i) => i.clinvar_id === item.clinvar_id)) return prev;
      return [...prev, item];
    });
  }

  function removeFromCart(clinvar_id: string) {
    setCartItems((prev) => prev.filter((i) => i.clinvar_id !== clinvar_id));
  }

  function clearCart() {
    setCartItems([]);
  }

  function isInCart(clinvar_id: string) {
    return cartItems.some((i) => i.clinvar_id === clinvar_id);
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
