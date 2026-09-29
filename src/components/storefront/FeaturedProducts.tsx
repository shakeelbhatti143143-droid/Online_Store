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
    if (activeTab === 'new') return p.isNewArrival || p.badge === 'NEW';
    if (activeTab === 'limited') return p.badge === 'LIMITED' || p.badge === 'SALE';
    return true;
  });

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Featured Highlights
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All Pieces
            </button>
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'bestsellers'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Best Sellers
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'new'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              New Arrivals
            </button>
            <button
              onClick={() => setActiveTab('limited')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all',
                activeTab === 'limited'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Vault Deals
            </button>
          </div>
        </div>

        {/* Compact Product Grid: 4-5 cards on desktop, 3-4 on tablet, 2 on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {filteredProducts.slice(0, 10).map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 5}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider border border-slate-200 shadow-sm hover:shadow transition-all group"
          >
            <span>Explore Entire Master Catalog</span>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
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
