'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingBag, Check } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/ui/RatingStars';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  priority = false,
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = !isOutOfStock && product.stockQuantity <= product.lowStockThreshold;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsAdding(true);
    addToCart(product, 1);
    setJustAdded(true);
    setIsAdding(false);

    setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  const primaryImage = product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop';
  const secondaryImage = product.images[1] || primaryImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col rounded-2xl glass-card overflow-hidden bg-surface-200/50 border border-border-light hover:border-gold-500/30 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-100/60">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={isHovered && product.images.length > 1 ? secondaryImage : primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.badge === 'NEW' && <Badge variant="cyan" size="sm">NEW</Badge>}
          {product.badge === 'BEST SELLER' && <Badge variant="gold" size="sm">BEST SELLER</Badge>}
          {product.badge === 'SALE' && <Badge variant="rose" size="sm">SALE</Badge>}
          {product.badge === 'LIMITED' && <Badge variant="emerald" size="sm">LIMITED</Badge>}
          {isOutOfStock && <Badge variant="default" size="sm">OUT OF STOCK</Badge>}
          {product.discountPercentage && product.discountPercentage > 0 && !isOutOfStock && (
            <Badge variant="rose" size="sm">-{product.discountPercentage}%</Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md',
            isFavorited
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg'
              : 'bg-black/40 text-gray-300 hover:text-white hover:bg-black/60 border border-white/10'
          )}
        >
          <Heart className={cn('w-4 h-4 transition-transform active:scale-125', isFavorited && 'fill-rose-400')} />
        </button>

        {/* Quick Actions Hover Overlay */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {onQuickView && (
            <button
              onClick={handleQuickViewClick}
              className="flex-1 h-10 rounded-xl bg-surface-50/90 hover:bg-surface-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 backdrop-blur-md shadow-lg transition-all active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick View</span>
            </button>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={cn(
              'flex-1 h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 backdrop-blur-md',
              isOutOfStock
                ? 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white border border-emerald-400'
                : 'bg-white hover:bg-gray-100 text-black font-bold'
            )}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-1 p-4">
        {/* Brand & Category */}
        <div className="flex items-center justify-between gap-2 text-xs text-gray-400 mb-1 font-medium tracking-wide">
          <span>{product.brandName || 'Luxe Atelier'}</span>
          {isLowStock && <span className="text-gold-400 text-[11px]">Only {product.stockQuantity} left!</span>}
        </div>

        {/* Title */}
        <Link href={`/products/${product.slug}`} className="group-hover:text-gold-400 transition-colors">
          <h3 className="text-sm font-semibold text-white line-clamp-1 leading-snug">
            {product.title}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="text-xs text-gray-400 line-clamp-1 mt-1 leading-relaxed">
          {product.shortDescription}
        </p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5">
          <RatingStars rating={product.rating} size="sm" showCount reviewsCount={product.reviewsCount} />
        </div>

        {/* Price Row */}
        <div className="mt-3 pt-3 border-t border-border-subtle flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-white tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Free Express Ship</span>
        </div>
      </div>
    </motion.div>
  );
};
