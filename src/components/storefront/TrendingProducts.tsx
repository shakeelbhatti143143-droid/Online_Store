'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { QuickViewModal } from './QuickViewModal';
import { ArrowRight, Flame } from 'lucide-react';

export interface TrendingProductsProps {
  products: Product[];
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({ products }) => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Take trending or new arrival pieces
  const trending = products
    .filter((p) => p.isNewArrival || p.isBestSeller || p.badge === 'NEW' || p.badge === 'BEST SELLER')
    .slice(0, 5);

  const displayList = trending.length >= 3 ? trending : products.slice(0, 5);

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-widest mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Trending Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Popular & Most Coveted
            </h2>
          </div>
          <Link
            href="/shop?badge=NEW"
            className="text-xs font-bold text-slate-700 hover:text-amber-700 uppercase tracking-wider flex items-center gap-1 transition-colors group"
          >
            <span>View All New Arrivals</span>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Compact Product Grid: 4-5 cards on desktop, 3-4 on tablet, 2 on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {displayList.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
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
