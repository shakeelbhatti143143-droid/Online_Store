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
      <div className="pt-32 pb-24 min-h-[75vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 border border-white/5 flex items-center justify-center text-gray-500 mx-auto mb-6">
            <Heart className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Your Wishlist is Empty
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
            Curate your personal collection of rare horology, planar magnetic monitors, and bespoke artisan pieces.
          </p>
          <Link href="/shop" className="mt-8 inline-block">
            <Button variant="gold" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Discover Masterpieces
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border-light flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Saved Privileges</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Personal Wishlist ({wishlistCount})
            </h1>
          </div>
          <button
            onClick={clearWishlist}
            className="text-xs text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Wishlist</span>
          </button>
        </div>

        {/* Grid of Wishlisted Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const isOutOfStock = product.stockQuantity <= 0;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col rounded-2xl glass-card overflow-hidden bg-surface-200/60 border border-border-light hover:border-gold-500/30 transition-all"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full bg-surface-100 overflow-hidden">
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
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-rose-400 flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {product.badge && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="gold" size="sm">{product.badge}</Badge>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">
                      {product.brandName}
                    </span>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-sm font-bold text-white hover:text-gold-400 transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.shortDescription}</p>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-base font-extrabold text-white">
                      {formatPrice(product.price)}
                    </span>
                    <Button
                      variant="gold"
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
