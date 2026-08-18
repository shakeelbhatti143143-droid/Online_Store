'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
    <section className="py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-gold-500/30 p-8 sm:p-12 bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Promo Text */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Limited Vault Privilege</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display leading-tight">
                Claim 10% Off Your Curated Order
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 max-w-lg leading-relaxed">
                Enter code <span className="text-gold-400 font-bold">LUXURY10</span> at checkout to unlock savings on automatic timepieces, planar monitors, and Tuscan weekender bags.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                {/* Promo Code Box */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-300 border border-gold-500/40">
                  <Tag className="w-4 h-4 text-gold-400" />
                  <span className="font-mono text-sm font-bold text-white tracking-widest">LUXURY10</span>
                  <button
                    onClick={() => handleCopy('LUXURY10')}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    aria-label="Copy coupon code"
                  >
                    {copiedCode === 'LUXURY10' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <Link
                  href="/shop?badge=SALE"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold transition-all shadow-lg shadow-gold-500/20"
                >
                  <span>Shop Featured Deals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* VIP Perks Checklist */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-200/80 border border-white/5">
                <ShieldCheck className="w-5 h-5 text-gold-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-white">Full Certificate of Origin</p>
                  <p className="text-gray-400 text-[11px]">Included with serial ledger</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-200/80 border border-white/5">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-white">Bespoke Concierge Handling</p>
                  <p className="text-gray-400 text-[11px]">White-glove courier packaging</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
