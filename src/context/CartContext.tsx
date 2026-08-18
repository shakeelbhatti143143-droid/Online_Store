'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, CartItem, ProductVariant, Coupon } from '@/types';
import { useToast } from './ToastContext';
import { storeApi } from '@/lib/api/store-client';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  appliedCoupon: Coupon | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariant?: ProductVariant,
    selectedColor?: string,
    selectedSize?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 500;
const STANDARD_SHIPPING_FEE = 25;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();

  // Load cart from LocalStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('luxe_cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      const savedCoupon = localStorage.getItem('luxe_coupon');
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Save cart to LocalStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem('luxe_cart', JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }, [items]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('luxe_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('luxe_coupon');
      }
    } catch (e) {
      // ignore
    }
  }, [appliedCoupon]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedVariant?: ProductVariant,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    const variantModifier = selectedVariant?.priceModifier || 0;
    const unitPrice = product.price + variantModifier;

    const variantId = selectedVariant?.id || '';
    const colorKey = selectedColor || '';
    const sizeKey = selectedSize || '';
    const cartItemId = `${product.id}-${variantId}-${colorKey}-${sizeKey}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          product,
          quantity,
          selectedVariant,
          selectedColor: selectedColor || selectedVariant?.colorName,
          selectedSize: selectedSize || selectedVariant?.size,
          unitPrice,
          totalPrice: unitPrice * quantity,
        };
        return [...prevItems, newItem];
      }
    });

    showToast({
      type: 'success',
      title: 'Added to Bag',
      message: `${quantity}x ${product.title} added to your cart.`,
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast({
      type: 'info',
      title: 'Item Removed',
      message: 'Item removed from your shopping bag.',
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity,
          };
        }
        return item;
      })
    );
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const trimmed = code.trim().toUpperCase();
    try {
      const result = await storeApi.validateCoupon(trimmed, subtotal);
      if (!result.valid || !result.coupon) {
        const msg = result.message || 'The promo code entered does not exist or has expired.';
        showToast({ type: 'error', title: 'Invalid Coupon', message: msg });
        return { success: false, message: msg };
      }
      setAppliedCoupon(result.coupon);
      showToast({
        type: 'success',
        title: 'Promo Code Applied',
        message: `${result.coupon.code}: ${result.coupon.description}`,
      });
      return { success: true, message: 'Promo code applied!' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to validate promo code.';
      showToast({ type: 'error', title: 'Invalid Coupon', message: msg });
      return { success: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast({
      type: 'info',
      title: 'Coupon Removed',
      message: 'Promotion code has been removed.',
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    localStorage.removeItem('luxe_cart');
    localStorage.removeItem('luxe_coupon');
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || subtotal === 0) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      const calc = (subtotal * appliedCoupon.discountValue) / 100;
      return appliedCoupon.maxDiscountAmount ? Math.min(calc, appliedCoupon.maxDiscountAmount) : calc;
    }
    return Math.min(subtotal, appliedCoupon.discountValue);
  }, [appliedCoupon, subtotal]);

  const shippingAmount = useMemo(() => {
    if (subtotal === 0) return 0;
    if (appliedCoupon?.code === 'FREESHIP') return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  }, [subtotal, appliedCoupon]);

  const taxAmount = useMemo(() => {
    const taxable = Math.max(0, subtotal - discountAmount);
    return Math.round(taxable * 0.075 * 100) / 100; // 7.5% est.
  }, [subtotal, discountAmount]);

  const total = useMemo(() => {
    if (subtotal === 0) return 0;
    return Math.max(0, subtotal - discountAmount + shippingAmount + taxAmount);
  }, [subtotal, discountAmount, shippingAmount, taxAmount]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        total,
        appliedCoupon,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
