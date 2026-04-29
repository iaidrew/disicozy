import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, MenuItem } from '../types';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { APP_CONFIG } from '../constants';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  taxes: number;
  serviceCharge: number;
  itemCount: number;
  customerId: string;
  config: typeof APP_CONFIG;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(APP_CONFIG);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('desi-cozy-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [customerId] = useState(() => {
    let id = localStorage.getItem('desi-cozy-customer-id');
    if (!id) {
      id = 'cust_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('desi-cozy-customer-id', id);
    }
    return id;
  });

  useEffect(() => {
    localStorage.setItem('desi-cozy-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) setConfig(prev => ({ ...prev, ...snap.data() }));
    });
    return () => unsub();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxes = Math.round(subtotal * (config.gstPercentage / 100));
  const serviceCharge = Math.round(subtotal * (config.serviceCharge / 100));
  const total = subtotal + taxes + serviceCharge;
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
        cart, addToCart, removeFromCart, updateQuantity, clearCart, 
        subtotal, total, taxes, serviceCharge, itemCount, customerId, config 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
