'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, Copy, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export const DealsBanner: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast({
      type: 'success',
      title: 'Code Copied to Clipboard',
      message: `Use code ${code} at checkout to claim your discount.`,
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <section className="py-8 sm:py-12 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-amber-300/60 dark:border-amber-500/30 p-8 sm:p-12 bg-gradient-to-r from-amber-50 via-slate-50 to-amber-100/60 dark:from-[#0B101E] dark:via-slate-900 dark:to-amber-950/30 shadow-sm dark:shadow-2xl">
          {/* Subtle Ambient Background Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Promo Text */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300/80 dark:border-amber-700/50 text-amber-900 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Limited Vault Privilege</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display leading-tight">
                Claim 10% Off Your Curated Order
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                Enter code <span className="text-amber-700 dark:text-amber-400 font-bold">LUXURY10</span> at checkout to unlock savings on automatic timepieces, planar monitors, and Tuscan weekender bags.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                {/* Promo Code Box */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 shadow-xs">
                  <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tracking-widest">LUXURY10</span>
                  <button
                    onClick={() => handleCopy('LUXURY10')}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-1"
                    aria-label="Copy coupon code"
                  >
                    {copiedCode === 'LUXURY10' ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <Link
                  href="/shop?badge=SALE"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-sm"
                >
                  <span>Shop Vault Deals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* VIP Perks Checklist */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/90 dark:bg-[#0B101E]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">Full Certificate of Origin</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Included with serial ledger</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/90 dark:bg-[#0B101E]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">Bespoke Concierge Handling</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">White-glove courier packaging</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
