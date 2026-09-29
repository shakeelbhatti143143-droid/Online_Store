'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/data/initial-data';

export interface HeroSectionProps {
  product?: Product;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ product }) => {
  const heroProduct = product || INITIAL_PRODUCTS[0];

  return (
    <section className="relative pt-6 pb-12 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Banner Box */}
        <div className="relative rounded-3xl lg:rounded-[36px] bg-gradient-to-br from-slate-50 via-amber-50/25 to-slate-100/80 dark:from-[#0B101E] dark:via-slate-900/80 dark:to-[#070B12] border border-slate-200/80 dark:border-slate-800/90 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-sm dark:shadow-2xl">
          {/* Subtle Ambient Background Accents */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-200/40 dark:bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headline & Value Proposition */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              {/* VIP Collection Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-700/50 text-amber-900 dark:text-amber-300 text-xs font-semibold tracking-wider uppercase shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>New 2026 Curated Vault Pieces</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] font-display">
                Uncompromising <br className="hidden sm:inline" />
                <span className="text-amber-600 dark:text-amber-400">Precision & Craft</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Explore an extraordinary curation of Swiss mechanical horology, studio planar acoustics, and handcrafted Italian leather goods engineered to outlive generations.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link href="/shop" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto text-xs sm:text-sm font-bold shadow-md hover:shadow-lg dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Explore Master Collection
                  </Button>
                </Link>

                <Link href="/shop?badge=BEST+SELLER" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View Best Sellers
                  </Button>
                </Link>
              </div>

              {/* Customer Trust Metrics */}
              <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">50k+</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">VIP Collectors</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">99.8%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">5-Star Rating</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">2-Year</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Global Warranty</p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Visual & Dynamic Showcase Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 shadow-xl group">
                {/* Product Background Image */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={heroProduct.images[0]}
                    alt={heroProduct.title}
                    fill
                    priority
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Top Pill Badges */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge variant="gold" size="sm">FEATURED MASTERPIECE</Badge>
                </div>

                {/* Bottom Floating Card Details */}
                <div className="absolute inset-x-6 bottom-6 p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#0B101E]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-1.5 text-slate-900 dark:text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      {heroProduct.brandName || 'Luxe Atelier'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-800 dark:text-slate-200">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span className="font-bold">{heroProduct.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                    {heroProduct.title}
                  </h3>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatPrice(heroProduct.price)}
                      </span>
                      {heroProduct.originalPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatPrice(heroProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/products/${heroProduct.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    >
                      <span>View Piece</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Ambient Floating Mini Badge */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -bottom-3 -left-3 sm:-left-4 p-3 rounded-2xl bg-white dark:bg-[#0B101E] border border-slate-200 dark:border-slate-800 shadow-xl hidden sm:flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Authenticity Guaranteed</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Individually Serialized & Inspected</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

