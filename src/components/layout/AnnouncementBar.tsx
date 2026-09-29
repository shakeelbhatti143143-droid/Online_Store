'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import {
  Truck,
  ShieldCheck,
  Sparkles,
  Gift,
  Crown,
  Tag,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface Announcement {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  code?: string;
  href?: string;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'express-shipping',
    icon: Truck,
    text: 'Complimentary Global Express Delivery on orders over $500',
    href: '/shop',
  },
  {
    id: 'authenticity',
    icon: ShieldCheck,
    text: '100% Certified Authentic • Guaranteed Provenance & Origin',
    href: '/shop',
  },
  {
    id: 'first-order-discount',
    icon: Tag,
    text: 'Enjoy 10% Off Your First Order with code',
    code: 'LUXE10',
  },
  {
    id: 'concierge-returns',
    icon: Sparkles,
    text: 'Bespoke Concierge Care & 30-Day Effortless Returns',
    href: '/shop',
  },
  {
    id: 'signature-packaging',
    icon: Gift,
    text: 'Signature White-Glove Presentation & Luxury Gift Packaging',
  },
  {
    id: 'new-season',
    icon: Crown,
    text: 'Curated 2026 Horology, Audio & Leather Editions Now Live',
    href: '/shop',
  },
];

export const AnnouncementBar: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  // 4 identical sets ensure seamless 25% boundary loops on any screen size up to ultrawide/4K
  const loopItems = [
    ...ANNOUNCEMENTS,
    ...ANNOUNCEMENTS,
    ...ANNOUNCEMENTS,
    ...ANNOUNCEMENTS,
  ];

  return (
    <MotionConfig reducedMotion="never">
      <div
        data-allow-motion
        className="relative bg-slate-950 text-slate-200 text-[11px] font-medium tracking-[0.14em] uppercase border-b border-slate-800/90 overflow-hidden select-none z-30"
        role="region"
        aria-label="Store Announcements"
      >
        {/* Left Edge Gradient Fade Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-20" />

        {/* Right Edge Gradient Fade Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-20" />

        {/* Continuous Marquee Ticker Track: Moving from Left to Right continuously */}
        <div className="py-2.5 flex items-center overflow-hidden">
          <motion.div
            data-allow-motion
            className="flex items-center whitespace-nowrap will-change-transform"
            animate={{ x: ['-25%', '0%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 28,
                ease: 'linear',
              },
            }}
          >
            {loopItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="inline-flex items-center gap-2.5 px-6 group"
                >
                  {/* Announcement Icon */}
                  <span className="p-1 rounded-full bg-slate-800/80 border border-amber-500/20 text-amber-400 group-hover:border-amber-400/50 group-hover:scale-110 transition-all duration-200">
                    <Icon className="w-3 h-3 text-amber-400" />
                  </span>

                  {/* Announcement Text / Interactive Link */}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-pointer group-hover:underline decoration-amber-400/40 underline-offset-4"
                    >
                      <span>{item.text}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ) : item.code ? (
                    <div className="inline-flex items-center gap-1.5">
                      <span>{item.text}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(e, item.code!)}
                        className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold tracking-wider hover:border-amber-400 transition-all active:scale-95"
                        title="Click to copy coupon code"
                      >
                        <span>{item.code}</span>
                        {copiedCode === item.code ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400 animate-in zoom-in" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-200/90">{item.text}</span>
                  )}

                  {/* Star Separator */}
                  <span className="ml-6 text-amber-500/50 text-[10px] select-none">
                    ✦
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Floating Copied Toast Pill */}
        <AnimatePresence>
          {copiedCode && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>CODE &apos;{copiedCode}&apos; COPIED TO CLIPBOARD!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};
