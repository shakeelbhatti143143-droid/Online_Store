'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Compass, Gem } from 'lucide-react';

export const AtelierStory: React.FC = () => {
  const pillars = [
    {
      icon: Compass,
      title: 'Swiss Calibration',
      description: 'Every mechanical calibre undergoes 300 hours of multi-positional testing to guarantee chronometer-grade precision.',
    },
    {
      icon: Gem,
      title: 'Tuscan Full-Grain',
      description: 'Hand-selected hides vegetable-tanned in Santa Croce, finished with beeswax edge coating and saddle stitching.',
    },
    {
      icon: Award,
      title: 'Audiophile Planar Tech',
      description: 'Ultra-thin nanomembrane diaphragms delivering lifelike soundstage resolution for the discerning listener.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-slate-50 dark:bg-[#070B12] border-y border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
            The Atelier Standard
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5 font-display">
            Crafted to Outlive Generations
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            We reject mass production in favor of uncompromising artistry. Each edition is limited, serialized, and curated with obsessive attention to detail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-[#0B101E] border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-amber-700 dark:text-amber-400 mb-5">
                  <Icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 font-display">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-400 uppercase tracking-wider transition-colors group"
          >
            <span>Read More About Our Craftsmanship</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};
