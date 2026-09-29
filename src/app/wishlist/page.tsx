'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function WishlistPage() {
  const { wishlist, wishlistCount, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="pt-24 pb-24 min-h-[75vh] flex items-center justify-center bg-white">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-xs">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Your Wishlist is Empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Curate your personal collection of rare horology, planar magnetic monitors, and bespoke artisan pieces.
          </p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Discover Masterpieces
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 min-h-screen bg-white text-slate-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Saved Privileges</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Personal Wishlist ({wishlistCount})
            </h1>
          </div>
          <button
            onClick={clearWishlist}
            className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Wishlist</span>
          </button>
        </div>

        {/* Grid of Wishlisted Items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {wishlist.map((product) => {
            const isOutOfStock = product.stockQuantity <= 0;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full bg-slate-50 overflow-hidden border-b border-slate-100">
                  <Link href={`/products/${product.slug}`}>
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-500 flex items-center justify-center border border-slate-200 shadow-xs transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {product.badge && (
                    <div className="absolute top-2.5 left-2.5">
                      <Badge variant="gold" size="sm">{product.badge}</Badge>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      {product.brandName || 'Luxe Atelier'}
                    </span>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-amber-700 transition-colors line-clamp-1 mt-0.5">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{product.shortDescription}</p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">
                      {formatPrice(product.price)}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => {
                        addToCart(product, 1);
                        removeFromWishlist(product.id);
                      }}
                      leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      {isOutOfStock ? 'Sold Out' : 'Move to Bag'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
