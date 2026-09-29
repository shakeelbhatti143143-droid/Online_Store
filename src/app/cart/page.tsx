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
  Tag,
  ArrowLeft,
  Lock,
  Sparkles,
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
      <div className="pt-24 pb-24 min-h-[75vh] flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-xs">
            <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Your personal curation currently holds no items. Explore our master horology and planar acoustics collections.
          </p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Master Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 min-h-screen bg-white text-slate-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Review Order</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Shopping Bag ({itemCount})
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Bag</span>
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Items Table (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-xs">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-200"
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
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      {item.product.brandName}
                    </span>
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-amber-700 transition-colors truncate mt-0.5">
                        {item.product.title}
                      </h3>
                    </Link>
                    {(item.selectedVariant || item.selectedColor || item.selectedSize) && (
                      <p className="text-xs text-slate-500 mt-1">
                        Option: <strong className="text-slate-800">{item.selectedVariant?.name || `${item.selectedColor || ''} ${item.selectedSize ? `• ${item.selectedSize}` : ''}`}</strong>
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {item.product.sku}</p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3.5 py-1 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Price & Delete */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">
                      {formatPrice(item.totalPrice)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors"
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
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-amber-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-amber-600" />
                <span>Continue Exploring Catalog</span>
              </Link>
            </div>
          </div>

          {/* Order Summary Box (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Order Summary</h2>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs uppercase tracking-wider text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs"
                />
                <Button type="submit" variant="secondary" size="sm" isLoading={isApplying}>
                  Apply
                </Button>
              </form>

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{appliedCoupon.code} (-{formatPrice(discountAmount)})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-slate-400 hover:text-slate-700 underline text-[11px]">
                    Remove
                  </button>
                </div>
              )}

              {/* Cost Calculations */}
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Privilege Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Courier Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingAmount === 0 ? 'FREE' : formatPrice(shippingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (7.5%)</span>
                  <span className="font-semibold text-slate-900">{formatPrice(taxAmount)}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-xl font-extrabold text-slate-900 font-display">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Proceed to Checkout CTA */}
              <Link href="/checkout" className="block w-full pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-xs sm:text-sm font-bold shadow-sm hover:shadow"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Checkout
                </Button>
              </Link>

              {/* Security badges */}
              <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted & Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
