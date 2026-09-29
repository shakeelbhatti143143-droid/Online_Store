'use client';

import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const features = [
    {
      icon: Truck,
      title: 'Free Worldwide Express',
      description: 'Complimentary shipping over $500',
    },
    {
      icon: ShieldCheck,
      title: '100% Certified Authentic',
      description: 'Serialized certificate of origin',
    },
    {
      icon: RefreshCw,
      title: '30-Day Concierge Returns',
      description: 'Hassle-free complimentary pickup',
    },
    {
      icon: Headphones,
      title: '24/7 Client Advisory',
      description: 'Bespoke horology & audio advisors',
    },
  ];

  return (
    <section className="py-4">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0B101E] border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0 shadow-xs">
                  <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug truncate">
                    {feature.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
