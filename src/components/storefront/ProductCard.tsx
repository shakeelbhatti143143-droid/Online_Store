'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <div
      className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={isHovered && product.images.length > 1 ? secondaryImage : primaryImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* Badges in Top Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.badge === 'NEW' && <Badge variant="cyan" size="sm">NEW</Badge>}
          {product.badge === 'BEST SELLER' && <Badge variant="gold" size="sm">BEST SELLER</Badge>}
          {product.badge === 'SALE' && <Badge variant="rose" size="sm">SALE</Badge>}
          {product.badge === 'LIMITED' && <Badge variant="emerald" size="sm">LIMITED</Badge>}
          {isOutOfStock && <Badge variant="default" size="sm">SOLD OUT</Badge>}
          {product.discountPercentage && product.discountPercentage > 0 && !isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-sm">
              -{product.discountPercentage}%
            </span>
          )}
        </div>

        {/* Wishlist Button in Top Right */}
        <button
          onClick={handleWishlist}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm',
            isFavorited
              ? 'bg-rose-50 text-rose-500 border border-rose-200 shadow-rose-100'
              : 'bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 border border-slate-200/60'
          )}
        >
          <Heart className={cn('w-4 h-4 transition-transform active:scale-125', isFavorited && 'fill-rose-500 text-rose-500')} />
        </button>

        {/* Quick View Button on Hover */}
        {onQuickView && (
          <button
            onClick={handleQuickViewClick}
            className="absolute bottom-2.5 left-2.5 right-2.5 z-10 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200/80 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
            aria-label="Quick View product"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Quick View</span>
          </button>
        )}
      </div>

      {/* Product Information Container */}
      <div className="flex flex-col flex-1 p-3 sm:p-3.5 justify-between">
        <div>
          {/* Brand / Category Metadata */}
          <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span className="truncate">{product.brandName || product.categoryName || 'Luxe Atelier'}</span>
            {isLowStock && (
              <span className="text-amber-700 font-bold shrink-0 text-[10px]">
                {product.stockQuantity} left
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block group-hover:text-amber-700 transition-colors">
            <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 line-clamp-1 leading-snug" title={product.title}>
              {product.title}
            </h3>
          </Link>

          {/* Rating */}
          <div className="mt-1.5 flex items-center">
            <RatingStars rating={product.rating} size="sm" showCount reviewsCount={product.reviewsCount} />
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {product.discountPercentage && product.discountPercentage > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                Save {product.discountPercentage}%
              </span>
            )}
          </div>

          {/* Compact Add to Bag Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={cn(
              'w-full h-8 sm:h-8.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98]',
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm hover:shadow'
            )}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added to Bag</span>
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
    </div>
  );
};
