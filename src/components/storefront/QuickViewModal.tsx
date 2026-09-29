'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/ui/RatingStars';
import { Product, ProductVariant } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ShoppingBag, Heart, Check, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);
  const currentPrice = product.price + (selectedVariant?.priceModifier || 0);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedVariant, selectedVariant?.colorName, selectedVariant?.size);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" className="p-0 overflow-hidden bg-white text-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Left: Gallery */}
        <div className="relative p-6 bg-slate-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xs">
            <Image
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.title}
              fill
              className="object-cover object-center transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    'relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all',
                    selectedImageIndex === idx
                      ? 'border-slate-900 shadow-sm'
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  )}
                >
                  <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase */}
        <div className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
                {product.brandName || 'Luxe Atelier'}
              </span>
              <div className="flex items-center gap-2">
                {product.badge && <Badge variant="gold" size="sm">{product.badge}</Badge>}
                <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {product.title}
            </h2>

            <div className="flex items-center gap-3 mt-3">
              <RatingStars rating={product.rating} showCount reviewsCount={product.reviewsCount} />
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Certified Authentic
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {formatPrice(currentPrice)}
              </span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-base text-slate-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Variant selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6 space-y-2.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Select Edition / Variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={cn(
                          'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2',
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        {variant.colorHex && (
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{ backgroundColor: variant.colorHex }}
                          />
                        )}
                        <span>{variant.name}</span>
                        {variant.priceModifier > 0 && (
                          <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                            +{formatPrice(variant.priceModifier)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-6 flex items-center gap-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quantity
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 shadow-sm"
                leftIcon={justAdded ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
              >
                {justAdded ? 'Added to Bag!' : isOutOfStock ? 'Sold Out' : `Add to Bag • ${formatPrice(currentPrice * quantity)}`}
              </Button>

              <button
                onClick={() => toggleWishlist(product)}
                className={cn(
                  'w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shadow-xs',
                  isFavorited
                    ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-rose-50'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                )}
                aria-label="Wishlist"
              >
                <Heart className={cn('w-5 h-5', isFavorited && 'fill-rose-500 text-rose-500')} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-600" /> Complimentary worldwide express
              </span>
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 transition-colors"
              >
                Full Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
