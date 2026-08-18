'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { INITIAL_CATEGORIES } from '@/lib/data/initial-data';

export const CategoryShowcase: React.FC = () => {
  return (
    <section className="py-20 bg-surface-300/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
              Curation Catalog
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 font-display">
              Explore by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-gray-300 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors group"
          >
            <span>View All Departments</span>
            <ArrowUpRight className="w-4 h-4 text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_CATEGORIES.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Link
                href={`/shop?category=${category.slug}`}
                className="group relative block aspect-[16/10] sm:aspect-[4/3] rounded-3xl overflow-hidden glass-card border border-border-light hover:border-gold-500/40 transition-all duration-500"
              >
                {/* Background Image */}
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out brightness-75 group-hover:brightness-90"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/10">
                      {category.productCount || 4}+ Pieces
                    </span>
                    <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-gold-500 text-white group-hover:text-black flex items-center justify-center backdrop-blur-md transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-gold-300 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed opacity-90">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
