'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { INITIAL_PRODUCTS } from '@/lib/data/initial-data';

export const HeroSection: React.FC = () => {
  const heroProduct = INITIAL_PRODUCTS[0]; // Aethelgard Chrono 01

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-gold-500/10 via-purple-600/5 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* VIP Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel bg-gold-500/10 border-gold-500/30 text-gold-300 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Autumn Vault 2026 Collection Live</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              Uncompromising <br />
              <span className="gold-gradient-text">Precision & Craft</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Explore an extraordinary curation of Swiss mechanical horology, studio planar acoustics, and handcrafted Italian leather goods engineered to outlive generations.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/shop" className="w-full sm:w-auto">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full sm:w-auto text-sm font-bold shadow-xl shadow-gold-500/20"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Collection
                </Button>
              </Link>

              <Link href="/shop?badge=BEST+SELLER" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm"
                >
                  View Best Sellers
                </Button>
              </Link>
            </div>

            {/* Customer Trust Metrics */}
            <div className="pt-8 border-t border-border-subtle grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">50k+</p>
                <p className="text-xs text-gray-400 mt-0.5">VIP Collectors</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-gold-400">99.8%</p>
                <p className="text-xs text-gray-400 mt-0.5">5-Star Satisfaction</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">2-Year</p>
                <p className="text-xs text-gray-400 mt-0.5">Global Warranty</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Hero Visual & Floating Luxury Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-3xl overflow-hidden glass-card p-3 border border-border-highlight shadow-2xl group">
              {/* Product Background Image */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-surface-200">
                <Image
                  src={heroProduct.images[0]}
                  alt={heroProduct.title}
                  fill
                  priority
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Top Pill Badges */}
              <div className="absolute top-6 left-6 flex gap-2">
                <Badge variant="gold" size="sm">FLAGSHIP PIECE</Badge>
                <Badge variant="cyan" size="sm">SWISS CALIBRE</Badge>
              </div>

              {/* Bottom Floating Glass Details Box */}
              <div className="absolute inset-x-6 bottom-6 p-5 rounded-2xl glass-panel bg-surface-300/85 border border-white/10 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gold-400 uppercase tracking-wider">
                    {heroProduct.brandName}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-white">
                    <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                    <span className="font-bold">{heroProduct.rating}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white leading-snug">
                  {heroProduct.title}
                </h3>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-white">
                      {formatPrice(heroProduct.price)}
                    </span>
                    {heroProduct.originalPrice && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(heroProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/products/${heroProduct.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors"
                  >
                    <span>View Piece</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Ambient Floating Mini Badge */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-4 sm:-left-6 p-3.5 rounded-2xl glass-panel bg-surface-200/90 border border-gold-500/30 shadow-2xl hidden sm:flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Authenticity Guaranteed</p>
                <p className="text-[10px] text-gray-400">Individually Serialized & Inspected</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
