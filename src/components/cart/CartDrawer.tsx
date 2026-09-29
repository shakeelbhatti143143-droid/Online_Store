'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

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
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between text-slate-900"
            >
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Your Shopping Bag</h2>
                    <p className="text-xs text-slate-500">
                      {itemCount} {itemCount === 1 ? 'curated item' : 'curated items'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close bag"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Shipping Meter */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-600">
                  {freeShippingRemaining > 0 ? (
                    <span>
                      Add <strong className="text-slate-900 font-bold">{formatPrice(freeShippingRemaining)}</strong> for Free Express Delivery
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> You unlocked Free Express Shipping!
                    </span>
                  )}
                  <span className="text-slate-400 font-semibold">{Math.round(freeShippingProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShippingProgress}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Your bag is empty</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                      Discover our curated collections of rare timepieces, planar audio, and bespoke artisan goods.
                    </p>
                    <Link
                      href="/shop"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs"
                    >
                      {/* Image */}
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
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
                            <h4 className="text-xs font-semibold text-slate-900 truncate leading-snug">
                              {item.product.title}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {(item.selectedColor || item.selectedSize || item.selectedVariant) && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.selectedVariant?.name || `${item.selectedColor || ''} ${item.selectedSize ? `• ${item.selectedSize}` : ''}`}
                            </p>
                          )}
                        </div>

                        {/* Quantity & Price */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-bold text-slate-900">
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
                <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50 space-y-3.5">
                  {/* Promo Code */}
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Coupon (e.g. LUXURY10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl px-3.5 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-slate-900 shadow-2xs"
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
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{appliedCoupon.code} (-{formatPrice(discountAmount)})</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-slate-400 hover:text-slate-700 text-[11px] underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Totals Breakdown */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-900 font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Discount</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Express Shipping</span>
                      <span className="text-slate-900 font-medium">
                        {shippingAmount === 0 ? 'FREE' : formatPrice(shippingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Estimated Total</span>
                      <span className="text-base font-extrabold text-slate-900">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="/cart"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors block"
                    >
                      View Full Bag & Summary
                    </Link>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
