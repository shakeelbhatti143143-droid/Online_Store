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
    return products.filter((product) => {
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
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, searchQuery, selectedCategory, selectedBadge, selectedBrand, minPrice, maxPrice, minRating, inStockOnly, sortBy]);

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
      <div className="pt-28 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">Loading catalog...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-border-light flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vault Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              Curated Luxury Pieces
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
              Filter through Swiss horology, studio acoustic monitors, and Italian full-grain leather masterworks.
            </p>
          </div>

          {/* Controls Bar: Grid/List Toggle & Sort Dropdown */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2.5 rounded-xl bg-surface-100 border border-border-light text-xs font-semibold text-white flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4 text-gold-400" />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-surface-100 border border-border-light rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-surface-50 text-gold-400 shadow' : 'text-gray-400 hover:text-white'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-surface-50 text-gold-400 shadow' : 'text-gray-400 hover:text-white'
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
                className="appearance-none bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-gold-500 cursor-pointer"
              >
                <option value="featured">Featured Curations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Arrivals</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 mr-1 font-medium">Active Filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/30">
                <span>{categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBadge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <span>{selectedBadge}</span>
                <button onClick={() => setSelectedBadge('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <span>{selectedBrand}</span>
                <button onClick={() => setSelectedBrand('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-50 text-gray-200 border border-border-light">
                <span>&quot;{searchQuery}&quot;</span>
                <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-gray-400 hover:text-white underline ml-2 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 glass-panel p-6 rounded-2xl sticky top-28 bg-surface-200/50">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold-400" />
                <span>Filters</span>
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                Search Items
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-100 border border-border-light rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            {/* Department / Category */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                Department
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={cn(
                    'w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between',
                    selectedCategory === '' ? 'bg-gold-500/10 text-gold-400 font-bold' : 'text-gray-400 hover:text-white'
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
                      selectedCategory === cat.slug ? 'bg-gold-500/10 text-gold-400 font-bold' : 'text-gray-400 hover:text-white'
                    )}
                  >
                    <span>{cat.name}</span>
                    <span>{products.filter((p) => p.categoryId === cat.id).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3 pt-2 border-t border-border-subtle">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-300 uppercase tracking-wider">Price Range</label>
                <span className="text-gold-400 font-mono font-bold">
                  {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-gold-500 cursor-pointer"
              />
            </div>

            {/* Brand Filter */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
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
                        ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
                        : 'bg-surface-100 text-gray-400 border-border-light hover:text-white'
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                Minimum Rating
              </label>
              <div className="space-y-1">
                {[4.9, 4.8, 4.5].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors',
                      minRating === stars ? 'bg-gold-500/10 text-gold-400 font-bold' : 'text-gray-400 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                      <span>{stars} Stars & Above</span>
                    </div>
                    {minRating === stars && <Check className="w-3.5 h-3.5 text-gold-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Availability */}
            <div className="pt-2 border-t border-border-subtle">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded bg-surface-100 border-border-light text-gold-500 focus:ring-0"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="rounded-3xl glass-panel p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-100 border border-white/5 flex items-center justify-center text-gray-500 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">No Matching Pieces Found</h3>
                <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
                  We couldn&apos;t find any objects matching your exact criteria. Try adjusting your filters or price slider.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-gold-500 text-black text-xs font-bold hover:bg-gold-400 transition-colors shadow-lg"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl glass-card border border-border-light hover:border-gold-500/30 transition-all"
                  >
                    <div className="relative aspect-[4/3] sm:w-48 rounded-xl overflow-hidden bg-surface-100 shrink-0">
                      <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                      {product.badge && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="gold" size="sm">{product.badge}</Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">
                          {product.brandName} • {product.categoryName}
                        </span>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="text-base font-bold text-white hover:text-gold-400 transition-colors mt-0.5">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-white">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setQuickViewProduct(product)}
                            className="px-3.5 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-xs font-semibold text-gray-300 hover:text-white border border-border-light transition-colors"
                          >
                            Quick View
                          </button>
                          <Link
                            href={`/products/${product.slug}`}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-200 text-black text-xs font-bold transition-colors"
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
    <Suspense fallback={<div className="pt-32 text-center text-gray-400 text-xs">Loading vault catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
