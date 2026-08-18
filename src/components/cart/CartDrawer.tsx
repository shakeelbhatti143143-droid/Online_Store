'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    shippingAmount,
    total,
    appliedCoupon,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const freeShippingThreshold = 500;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponCode);
    setIsApplyingCoupon(false);
    setCouponCode('');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-md bg-surface-200 border-l border-border-light shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-border-light flex items-center justify-between bg-surface-100/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide">Your Shopping Bag</h2>
                    <p className="text-xs text-gray-400">
                      {itemCount} {itemCount === 1 ? 'exclusive item' : 'exclusive items'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close bag"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Meter */}
              <div className="px-6 py-3 bg-surface-300/90 border-b border-border-subtle">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  {freeShippingRemaining > 0 ? (
                    <span className="text-gray-300">
                      Add <strong className="text-gold-400 font-bold">{formatPrice(freeShippingRemaining)}</strong> for Complimentary Express Shipping
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> You unlocked Free Express Shipping!
                    </span>
                  )}
                  <span className="text-gray-400">{Math.round(freeShippingProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShippingProgress}%` }}
                    className="h-full bg-gradient-to-r from-gold-500 to-amber-300 rounded-full"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-surface-100 border border-white/5 flex items-center justify-center text-gray-500 mb-4">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Your bag is empty</h3>
                    <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                      Discover our curated collections of rare timepieces, planar audio, and bespoke artisan goods.
                    </p>
                    <Link
                      href="/shop"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-200 transition-colors shadow-lg"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3.5 rounded-xl bg-surface-100/60 border border-border-subtle hover:border-border-light transition-all"
                    >
                      {/* Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-200 shrink-0 border border-white/5">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-white truncate">
                              {item.product.title}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-500 hover:text-rose-400 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {(item.selectedColor || item.selectedSize || item.selectedVariant) && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {item.selectedVariant?.name || `${item.selectedColor || ''} ${item.selectedSize ? `• ${item.selectedSize}` : ''}`}
                            </p>
                          )}
                        </div>

                        {/* Quantity & Price */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center border border-border-light rounded-lg overflow-hidden bg-surface-200">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-semibold text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-bold text-white">
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer & Checkout */}
              {items.length > 0 && (
                <div className="p-6 border-t border-border-light bg-surface-100/80 space-y-4">
                  {/* Promo Code */}
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Coupon (e.g. LUXURY10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full bg-surface-200 text-white placeholder-gray-500 border border-border-light rounded-xl px-3.5 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      isLoading={isApplyingCoupon}
                      className="px-4"
                    >
                      Apply
                    </Button>
                  </form>

                  {/* Applied coupon banner */}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs">
                      <div className="flex items-center gap-1.5 text-gold-300 font-semibold">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{appliedCoupon.code} (-{formatPrice(discountAmount)})</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-gray-400 hover:text-white text-[11px] underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Totals Breakdown */}
                  <div className="space-y-1.5 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-white font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Express Shipping</span>
                      <span className="text-white font-medium">
                        {shippingAmount === 0 ? 'FREE' : formatPrice(shippingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-border-light">
                      <span>Estimated Total</span>
                      <span className="text-base text-gold-400">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 transition-all active:scale-[0.99]"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="/cart"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full py-2 text-center text-xs text-gray-400 hover:text-white transition-colors block"
                    >
                      View Full Bag & Summary
                    </Link>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-Bit Encrypted Secure Checkout</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
