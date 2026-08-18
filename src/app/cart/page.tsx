'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    shippingAmount,
    taxAmount,
    total,
    appliedCoupon,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplying(true);
    await applyCoupon(couponCode);
    setIsApplying(false);
    setCouponCode('');
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-[75vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 border border-white/5 flex items-center justify-center text-gray-500 mx-auto mb-6">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
            Your personal curation currently holds no items. Explore our master horology and planar acoustics collections.
          </p>
          <Link href="/shop" className="mt-8 inline-block">
            <Button variant="gold" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Master Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-border-light flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Review Order</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Shopping Bag ({itemCount})
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Bag</span>
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Items Table (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-3xl glass-panel border border-border-light overflow-hidden divide-y divide-border-subtle">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:bg-white/[0.01] transition-colors"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-surface-100 shrink-0 border border-white/5"
                  >
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">
                      {item.product.brandName}
                    </span>
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="text-sm font-bold text-white hover:text-gold-400 transition-colors truncate">
                        {item.product.title}
                      </h3>
                    </Link>
                    {(item.selectedVariant || item.selectedColor || item.selectedSize) && (
                      <p className="text-xs text-gray-400 mt-1">
                        Specification: <strong className="text-gray-200">{item.selectedVariant?.name || `${item.selectedColor || ''} ${item.selectedSize ? `• ${item.selectedSize}` : ''}`}</strong>
                      </p>
                    )}
                    <p className="text-xs font-mono text-gray-500 mt-0.5">SKU: {item.product.sku}</p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-border-light rounded-xl overflow-hidden bg-surface-100">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      +
                    </button>
                  </div>

                  {/* Price & Delete */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <span className="text-base font-extrabold text-white">
                      {formatPrice(item.totalPrice)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-500 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Back link */}
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Exploring Catalog</span>
              </Link>
            </div>
          </div>

          {/* Order Summary Box (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-light bg-surface-200/90 space-y-6">
              <h2 className="text-lg font-bold text-white tracking-tight">Order Summary</h2>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-surface-100 border border-border-light rounded-xl px-4 py-2.5 text-xs uppercase tracking-wider text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
                <Button type="submit" variant="secondary" size="sm" isLoading={isApplying}>
                  Apply
                </Button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs">
                  <div className="flex items-center gap-2 text-gold-300 font-semibold">
                    <Tag className="w-4 h-4" />
                    <span>{appliedCoupon.code} (-{formatPrice(discountAmount)})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-gray-400 hover:text-white underline text-[11px]">
                    Remove
                  </button>
                </div>
              )}

              {/* Cost Calculations */}
              <div className="space-y-3 text-xs text-gray-300 border-t border-border-subtle pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Privilege Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Courier Shipping</span>
                  <span className="font-semibold text-white">
                    {shippingAmount === 0 ? 'FREE' : formatPrice(shippingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated VAT / Tax (7.5%)</span>
                  <span className="font-semibold text-white">{formatPrice(taxAmount)}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-white pt-4 border-t border-border-light">
                  <span>Total Amount</span>
                  <span className="text-xl text-gold-400 font-display">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Proceed to Checkout CTA */}
              <Link href="/checkout" className="block w-full">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full text-sm font-bold shadow-xl shadow-gold-500/20"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Multi-Step Checkout
                </Button>
              </Link>

              {/* Security badges */}
              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit SSL Encrypted & Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
