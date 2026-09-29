'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  LayoutGrid,
  List,
  Search,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Star,
  Check,
} from 'lucide-react';
import { Product, Category } from '@/types';
import { useCatalog } from '@/context/CatalogContext';
import { ProductCard } from '@/components/storefront/ProductCard';
import { QuickViewModal } from '@/components/storefront/QuickViewModal';
import { formatPrice, cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { RatingStars } from '@/components/ui/RatingStars';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

function ShopContent() {
  const searchParams = useSearchParams();
  const { products, categories, isLoading } = useCatalog();

  // Initial params
  const initialCategory = searchParams.get('category') || '';
  const initialBadge = searchParams.get('badge') || '';
  const initialQuery = searchParams.get('q') || '';

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBadge, setSelectedBadge] = useState<string>(initialBadge);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(4000);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Sync URL search params
  useEffect(() => {
    if (searchParams.get('category')) setSelectedCategory(searchParams.get('category') || '');
    if (searchParams.get('badge')) setSelectedBadge(searchParams.get('badge') || '');
    if (searchParams.get('q')) setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Unique Brands
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.brandName) brands.add(p.brandName);
    });
    return Array.from(brands);
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = product.title.toLowerCase().includes(q);
          const matchBrand = product.brandName?.toLowerCase().includes(q);
          const matchCategory = product.categoryName?.toLowerCase().includes(q);
          const matchSku = product.sku.toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchCategory && !matchSku) return false;
        }

        // Category
        if (selectedCategory) {
          const cat = categories.find((c) => c.slug === selectedCategory);
          if (cat && product.categoryId !== cat.id) return false;
        }

        // Badge
        if (selectedBadge && product.badge !== selectedBadge) {
          if (selectedBadge === 'NEW' && !product.isNewArrival) return false;
          if (selectedBadge === 'BEST SELLER' && !product.isBestSeller) return false;
        }

        // Brand
        if (selectedBrand && product.brandName !== selectedBrand) return false;

        // Price Range
        if (product.price < minPrice || product.price > maxPrice) return false;

        // Rating
        if (minRating > 0 && product.rating < minRating) return false;

        // Stock
        if (inStockOnly && product.stockQuantity <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedBadge,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    sortBy,
    categories,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBadge('');
    setSelectedBrand('');
    setMinPrice(0);
    setMaxPrice(4000);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedCategory) ||
    Boolean(selectedBadge) ||
    Boolean(selectedBrand) ||
    minPrice > 0 ||
    maxPrice < 4000 ||
    minRating > 0 ||
    inStockOnly;

  if (isLoading) {
    return (
      <div className="pt-24 pb-24 min-h-screen bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-500 py-16 text-sm">Loading master catalog...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 min-h-screen bg-white text-slate-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vault Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Curated Luxury Pieces
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Filter through Swiss horology, studio acoustic monitors, and Italian full-grain leather masterworks.
            </p>
          </div>

          {/* Controls Bar: View Toggle & Sort */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2 shadow-2xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2 pr-8 focus:outline-none focus:border-slate-900 shadow-2xs cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 mr-1 font-medium">Active Filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span>{categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                <span>{selectedBadge}</span>
                <button onClick={() => setSelectedBadge('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                <span>{selectedBrand}</span>
                <button onClick={() => setSelectedBrand('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <span>&quot;{searchQuery}&quot;</span>
                <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-900 underline ml-2 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 bg-white border border-slate-200/80 p-5 rounded-2xl sticky top-24 shadow-2xs text-slate-900">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>Filters</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Search Catalog
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by title, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Department / Category */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Department
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between',
                    selectedCategory === '' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <span>All Departments</span>
                  <span>{products.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between',
                      selectedCategory === cat.slug ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <span>{cat.name}</span>
                    <span>{products.filter((p) => p.categoryId === cat.id).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700 uppercase tracking-wider">Price Ceiling</label>
                <span className="text-slate-900 font-bold font-mono">
                  {formatPrice(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Brand Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Atelier Brand
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(selectedBrand === brand ? '' : brand)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs transition-colors border',
                      selectedBrand === brand
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Minimum Rating
              </label>
              <div className="space-y-1">
                {[4.9, 4.8, 4.5].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors',
                      minRating === stars ? 'bg-amber-50 text-amber-800 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>{stars} Stars & Above</span>
                    </div>
                    {minRating === stars && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Availability */}
            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center flex flex-col items-center justify-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Matching Pieces Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  We couldn&apos;t find any objects matching your criteria. Try adjusting your filters or price ceiling.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Compact Grid: 4 columns on desktop, 3 on tablet, 2 on mobile */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            ) : (
              /* List View Mode */
              <div className="space-y-3.5">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row gap-5 p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="relative aspect-[4/3] sm:w-44 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                      {product.badge && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="gold" size="sm">{product.badge}</Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                          {product.brandName} • {product.categoryName}
                        </span>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="text-sm font-bold text-slate-900 hover:text-amber-700 transition-colors mt-0.5">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-slate-900">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setQuickViewProduct(product)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
                          >
                            Quick View
                          </button>
                          <Link
                            href={`/products/${product.slug}`}
                            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
                          >
                            View Piece
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center text-slate-400 text-xs bg-white min-h-screen">Loading master catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
