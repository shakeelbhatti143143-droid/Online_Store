'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl" className="p-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Left: Gallery */}
        <div className="relative p-6 bg-surface-100/50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border-light">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-surface-200 border border-white/5">
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
                      ? 'border-gold-500 shadow-md shadow-gold-500/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
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
              <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                {product.brandName || 'Luxe Atelier'}
              </span>
              <div className="flex items-center gap-2">
                {product.badge && <Badge variant="gold" size="sm">{product.badge}</Badge>}
                <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              {product.title}
            </h2>

            <div className="flex items-center gap-3 mt-3">
              <RatingStars rating={product.rating} showCount reviewsCount={product.reviewsCount} />
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Certified Authentic
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-white">
                {formatPrice(currentPrice)}
              </span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-base text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-300 mt-4 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Variant selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6 space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                            ? 'bg-gold-500/10 border-gold-500 text-gold-300'
                            : 'bg-surface-100 border-border-light text-gray-300 hover:border-white/20'
                        )}
                      >
                        {variant.colorHex && (
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: variant.colorHex }}
                          />
                        )}
                        <span>{variant.name}</span>
                        {variant.priceModifier > 0 && (
                          <span className="text-gray-400">+{formatPrice(variant.priceModifier)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-6 flex items-center gap-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Quantity
              </label>
              <div className="flex items-center border border-border-light rounded-xl overflow-hidden bg-surface-100">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-semibold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-border-light flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                variant="gold"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1"
                leftIcon={justAdded ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
              >
                {justAdded ? 'Added to Bag!' : isOutOfStock ? 'Sold Out' : `Add to Bag • ${formatPrice(currentPrice * quantity)}`}
              </Button>

              <button
                onClick={() => toggleWishlist(product)}
                className={cn(
                  'w-13 h-13 rounded-xl border flex items-center justify-center transition-colors',
                  isFavorited
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                    : 'bg-surface-100 text-gray-300 border-border-light hover:text-white'
                )}
                aria-label="Wishlist"
              >
                <Heart className={cn('w-5 h-5', isFavorited && 'fill-rose-400')} />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400" /> Complimentary worldwide shipping
              </span>
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="text-gold-400 hover:text-gold-300 font-semibold flex items-center gap-1 transition-colors"
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
