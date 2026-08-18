'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { QuickViewModal } from './QuickViewModal';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FeaturedProductsProps {
  products: Product[];
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bestsellers' | 'new' | 'limited'>('all');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'bestsellers') return p.isBestSeller || p.badge === 'BEST SELLER';
    if (activeTab === 'new') return p.isNew || p.badge === 'NEW';
    if (activeTab === 'limited') return p.badge === 'LIMITED' || p.badge === 'SALE';
    return true;
  });

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Selection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Featured Highlights
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-surface-100/90 border border-border-light">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'all'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              All Pieces
            </button>
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'bestsellers'
                  ? 'bg-gold-500 text-black font-bold shadow-md shadow-gold-500/20'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Best Sellers
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'new'
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              New Arrivals
            </button>
            <button
              onClick={() => setActiveTab('limited')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'limited'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Limited Editions
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.slice(0, 8).map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-surface-100 hover:bg-surface-50 text-white font-semibold text-xs uppercase tracking-widest border border-border-light hover:border-gold-500/50 shadow-xl transition-all group"
          >
            <span>Explore Entire Luxury Catalog</span>
            <ArrowRight className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
};
