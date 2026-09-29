'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Category } from '@/types';
import { INITIAL_CATEGORIES } from '@/lib/data/initial-data';

export interface CategoryShowcaseProps {
  categories?: Category[];
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({ categories }) => {
  const displayCategories = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curation Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-slate-700 hover:text-amber-700 uppercase tracking-wider flex items-center gap-1 transition-colors group"
          >
            <span>View All Departments</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Compact Modern Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
          {displayCategories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-300 p-2.5 sm:p-3 overflow-hidden text-center"
            >
              {/* Image Box */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                
                {category.productCount !== undefined && category.productCount > 0 && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/95 text-slate-800 shadow-xs border border-slate-200/60 backdrop-blur-xs">
                    {category.productCount} {category.productCount === 1 ? 'Piece' : 'Pieces'}
                  </span>
                )}
              </div>

              {/* Title & Arrow */}
              <div className="flex items-center justify-center gap-1">
                <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1 leading-snug">
                  {category.name}
                </h3>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
