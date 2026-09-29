'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';

import {
  ShoppingBag,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Maximize2,
  X,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

import { storeApi } from '@/lib/store-api';
import { INITIAL_PRODUCTS } from '@/lib/data/initial-data';

import {
  Product,
  ProductVariant,
  ProductReview,
} from '@/types';

import {
  formatPrice,
  formatDate,
  cn,
} from '@/lib/utils';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { Modal } from '@/components/ui/Modal';

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/context/ToastContext';

import { ProductCard } from '@/components/storefront/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  /*
   * ============================================================
   * SLUG
   * ============================================================
   */

  const slug = Array.isArray(params?.slug)
    ? params.slug[0]
    : params?.slug;

  /*
   * ============================================================
   * PRODUCT STATE
   * ============================================================
   */

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * ============================================================
   * GALLERY STATE
   * ============================================================
   */

  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  /*
   * ============================================================
   * VARIANT STATE
   * ============================================================
   */

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | undefined>(undefined);

  const [selectedColor, setSelectedColor] =
    useState<string | undefined>(undefined);

  const [selectedSize, setSelectedSize] =
    useState<string | undefined>(undefined);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  /*
   * ============================================================
   * REVIEW STATE
   * ============================================================
   */

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] =
    useState(false);

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] =
    useState('');

  /*
   * ============================================================
   * LOAD PRODUCT
   * ============================================================
   */

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setProduct(null);
      setError('Product slug is missing.');
      return;
    }

    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await storeApi.getProductBySlug(String(slug));

        if (cancelled) return;

        if (!data) {
          setProduct(null);
          setError('Product not found.');
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error(
          'Failed to load product:',
          err
        );

        if (!cancelled) {
          setProduct(null);

          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load product.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /*
   * ============================================================
   * RESET PRODUCT-DEPENDENT STATE
   * ============================================================
   */

  useEffect(() => {
    if (!product) return;

    const firstVariant =
      product.variants &&
      product.variants.length > 0
        ? product.variants[0]
        : undefined;

    setSelectedImage(0);
    setIsFullscreenOpen(false);

    setSelectedVariant(firstVariant);
    setSelectedColor(firstVariant?.colorName);
    setSelectedSize(firstVariant?.size);

    setQuantity(1);
    setJustAdded(false);

    setReviews(product.reviews || []);

    setIsReviewModalOpen(false);
    setNewReviewRating(5);
    setNewReviewName('');
    setNewReviewTitle('');
    setNewReviewComment('');
  }, [product]);

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 w-48 bg-slate-100 rounded-lg mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7">
                <div className="aspect-[4/3] rounded-3xl bg-slate-100" />
              </div>
              <div className="lg:col-span-5 space-y-5">
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-10 w-3/4 bg-slate-100 rounded-lg" />
                <div className="h-6 w-32 bg-slate-100 rounded" />
                <div className="h-24 w-full bg-slate-100 rounded-xl" />
                <div className="h-14 w-full bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PRODUCT NOT FOUND
   * ============================================================
   */

  if (!product) {
    return (
      <main className="min-h-screen bg-white pt-32 pb-24">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
            <X className="w-7 h-7 text-rose-500" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3 font-display">
            Product Not Found
          </h1>

          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            {error ||
              'The product you are looking for does not exist or is no longer available in our collection.'}
          </p>

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => router.back()}
            >
              Go Back
            </Button>

            <Link href="/shop">
              <Button
                variant="gold"
                size="md"
              >
                Browse Collection
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PRODUCT CALCULATIONS
   * ============================================================
   */

  const isFavorited = isInWishlist(product.id);

  const currentPrice =
    product.price + (selectedVariant?.priceModifier || 0);

  const isOutOfStock = product.stockQuantity <= 0;

  const isLowStock =
    !isOutOfStock &&
    product.stockQuantity <= product.lowStockThreshold;

  /*
   * ============================================================
   * ADD TO CART
   * ============================================================
   */

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(
      product,
      quantity,
      selectedVariant,
      selectedColor,
      selectedSize
    );

    setJustAdded(true);

    setTimeout(() => {
      setJustAdded(false);
    }, 2000);
  };

  /*
   * ============================================================
   * BUY NOW
   * ============================================================
   */

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    addToCart(
      product,
      quantity,
      selectedVariant,
      selectedColor,
      selectedSize
    );

    router.push('/checkout');
  };

  /*
   * ============================================================
   * SHARE
   * ============================================================
   */

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text:
            product.shortDescription ||
            product.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        showToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Product link copied to clipboard.',
        });
      }
    } catch {
      // User cancelled native share.
    }
  };

  /*
   * ============================================================
   * ADD REVIEW
   * ============================================================
   */

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReviewName.trim() || !newReviewComment.trim()) {
      return;
    }

    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      userName: newReviewName.trim(),
      rating: newReviewRating,
      title:
        newReviewTitle.trim() || 'Verified Collector Review',
      comment: newReviewComment.trim(),
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [newRev, ...prev]);
    setIsReviewModalOpen(false);

    setNewReviewName('');
    setNewReviewTitle('');
    setNewReviewComment('');
    setNewReviewRating(5);

    showToast({
      type: 'success',
      title: 'Review Published',
      message: 'Thank you for sharing your collector experience.',
    });
  };

  /*
   * ============================================================
   * RELATED PRODUCTS
   * ============================================================
   */

  const relatedProducts = INITIAL_PRODUCTS.filter(
    (p) =>
      p.id !== product.id &&
      (p.categoryId === product.categoryId ||
        p.brandName === product.brandName)
  ).slice(0, 4);

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-white pt-28 pb-24 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8 font-medium">
          <Link
            href="/"
            className="hover:text-slate-900 transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link
            href="/shop"
            className="hover:text-slate-900 transition-colors"
          >
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link
            href={`/shop?category=${product.categoryId}`}
            className="hover:text-slate-900 transition-colors"
          >
            {product.categoryName || 'Collection'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 font-semibold truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* Left: Gallery (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-sm group">
              <Image
                src={
                  product.images?.[selectedImage] ||
                  product.images?.[0] ||
                  '/placeholder-product.png'
                }
                alt={product.title}
                fill
                priority
                className="object-cover object-center transition-all duration-500 group-hover:scale-105"
              />

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.badge && (
                  <Badge variant="gold" size="sm">
                    {product.badge}
                  </Badge>
                )}

                {product.discountPercentage &&
                  product.discountPercentage > 0 && (
                    <Badge variant="rose" size="sm">
                      -{product.discountPercentage}% OFF
                    </Badge>
                  )}
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(true)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 shadow-sm backdrop-blur-md border border-slate-200 transition-colors"
                aria-label="View Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {product.images.map((img, idx) => (
                  <button
                    type="button"
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'relative w-20 h-16 sm:w-24 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all bg-slate-50',
                      selectedImage === idx
                        ? 'border-amber-600 ring-2 ring-amber-600/20 shadow-md'
                        : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                    )}
                  >
                    <Image
                      src={img}
                      alt={`View ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Information (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3 text-xs mb-2">
                <span className="font-bold text-amber-700 uppercase tracking-widest text-[11px]">
                  {product.brandName || 'Luxe Atelier'}
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  SKU: {product.sku}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
                {product.title}
              </h1>

              {/* Rating and Authentication */}
              <div className="flex items-center gap-3 mt-3">
                <RatingStars
                  rating={product.rating}
                  showCount
                  reviewsCount={reviews.length}
                />
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Authentic
                </span>
              </div>

              {/* Pricing Display */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
                  {formatPrice(currentPrice)}
                </span>
                {product.originalPrice &&
                  product.originalPrice > currentPrice && (
                    <span className="text-base text-slate-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
              </div>

              {/* Inventory Alert Strip */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isOutOfStock
                        ? 'bg-rose-500'
                        : isLowStock
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500'
                    )}
                  />
                  <span className="text-slate-700 font-medium">
                    {isOutOfStock
                      ? 'Currently Sold Out'
                      : isLowStock
                        ? `Vault Notice: Only ${product.stockQuantity} pieces remaining!`
                        : 'In Stock & Ready for Priority Dispatch'}
                  </span>
                </div>
              </div>
            </div>

            {/* Short / Detailed Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Variants / Editions */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Edition / Specification
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => {
                    const isSelected =
                      selectedVariant?.id === variant.id;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant(variant);
                          setSelectedColor(variant.colorName);
                          setSelectedSize(variant.size);
                        }}
                        className={cn(
                          'p-3 rounded-xl text-left border transition-all flex items-center gap-3',
                          isSelected
                            ? 'bg-amber-50/80 border-amber-600 text-slate-900 shadow-sm ring-1 ring-amber-600/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {variant.colorHex && (
                          <span
                            className="w-4 h-4 rounded-full border border-slate-200 shadow-xs shrink-0"
                            style={{
                              backgroundColor: variant.colorHex,
                            }}
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {variant.name}
                          </p>
                          {variant.priceModifier > 0 && (
                            <p className="text-[10px] text-amber-700 font-mono">
                              +{formatPrice(variant.priceModifier)}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quantity
              </label>

              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.max(1, q - 1))
                  }
                  className="px-3.5 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  -
                </button>

                <span className="px-5 py-2 text-sm font-bold text-slate-900">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(product.stockQuantity || 999, q + 1)
                    )
                  }
                  className="px-3.5 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  disabled={quantity >= product.stockQuantity}
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions & Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex gap-3">
                <Button
                  variant="gold"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 text-sm font-bold shadow-md shadow-amber-600/15"
                  leftIcon={
                    justAdded ? (
                      <Check className="w-5 h-5 text-slate-900" />
                    ) : (
                      <ShoppingBag className="w-5 h-5" />
                    )
                  }
                >
                  {justAdded
                    ? 'Added to Bag!'
                    : isOutOfStock
                      ? 'Sold Out'
                      : `Add to Bag • ${formatPrice(
                          currentPrice * quantity
                        )}`}
                </Button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={cn(
                    'w-13 h-13 rounded-xl border flex items-center justify-center transition-colors shadow-xs',
                    isFavorited
                      ? 'bg-rose-50 text-rose-500 border-rose-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                  )}
                  aria-label="Wishlist"
                >
                  <Heart
                    className={cn(
                      'w-5 h-5',
                      isFavorited && 'fill-rose-500'
                    )}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-13 h-13 rounded-xl bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-xs"
                  aria-label="Share Product"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white"
                rightIcon={
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                }
              >
                Instant Buy with 1-Click Checkout
              </Button>
            </div>

            {/* Guarantees & Perks */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Complimentary Express Courier</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-600" />
                <span>30-Day Private Vault Returns</span>
              </div>
            </div>

          </div>
        </div>

        {/* Features & Specifications */}
        <div className="mt-20 pt-12 border-t border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Distinguished Features
              </h3>

              <ul className="space-y-3">
                {(product.features || []).map((feat, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 leading-relaxed"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                Technical Specifications
              </h3>

              <div className="rounded-2xl bg-slate-50 overflow-hidden border border-slate-200/80">
                <div className="divide-y divide-slate-200/80">
                  {Object.entries(
                    product.specifications || {}
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="px-5 py-3.5 flex justify-between items-center text-xs"
                    >
                      <span className="font-semibold text-slate-500">
                        {key}
                      </span>
                      <span className="font-medium text-slate-900">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 pt-12 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
                Verified Collector Reviews ({reviews.length})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authentic experiences from certified owners.
              </p>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => setIsReviewModalOpen(true)}
              leftIcon={
                <MessageSquare className="w-4 h-4 text-amber-600" />
              }
            >
              Write a Review
            </Button>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <RatingStars
                      rating={rev.rating}
                      size="sm"
                    />
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    {rev.title}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rev.comment}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {rev.userName}
                    </span>
                    {rev.isVerifiedPurchase && (
                      <span className="text-emerald-700 flex items-center gap-1 font-medium">
                        •
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified Collector
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                No reviews yet. Be the first to review this acquisition.
              </p>
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-12 border-t border-slate-100">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-8 font-display">
              Frequently Paired Pieces
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {isFullscreenOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-5xl aspect-[16/10]">
              <Image
                src={
                  product.images?.[selectedImage] ||
                  product.images?.[0] ||
                  '/placeholder-product.png'
                }
                alt={product.title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Submit Collector Review"
        description="Share your feedback with our global clientele."
      >
        <form
          onSubmit={handleAddReview}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Your Rating
            </label>
            <RatingStars
              rating={newReviewRating}
              interactive
              size="lg"
              onRatingChange={(r) => setNewReviewRating(r)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lord Sterling"
              value={newReviewName}
              onChange={(e) => setNewReviewName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Review Headline
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Absolute precision masterpiece"
              value={newReviewTitle}
              onChange={(e) => setNewReviewTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Detailed Comments
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail your experience with this piece..."
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="gold"
              size="md"
            >
              Publish Review
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}