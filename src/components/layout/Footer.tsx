'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Crown, ArrowRight, ShieldCheck, Truck, RefreshCw, Lock, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSubscribed(true);
    showToast({
      type: 'success',
      title: 'Privilege Access Granted',
      message: 'You are subscribed to private collections and vault releases.',
    });
    setEmail('');
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Trust Badges Strip */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Global Express</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Complimentary over $500</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">100% Authentic</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Certificate with every piece</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">30-Day Returns</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Complimentary return concierge</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Vault Security</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">256-Bit SSL protection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand & Mission */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 p-0.5">
              <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-wider text-slate-900 uppercase font-display">
              LUXE<span className="text-amber-600 font-light ml-1">ATELIER</span>
            </span>
          </Link>
          <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
            Curators of extraordinary objects. From Swiss mechanical tourbillons and planar acoustic monitors to Tuscan vegetable-tanned leather essentials.
          </p>

          {/* Newsletter Box */}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Join the Private Circle
            </p>
            <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="Enter your VIP email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                {subscribed ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Collections
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li>
              <Link href="/shop?category=timepieces" className="hover:text-amber-700 transition-colors">
                Timepieces & Horology
              </Link>
            </li>
            <li>
              <Link href="/shop?category=audio-tech" className="hover:text-amber-700 transition-colors">
                Planar Audio Monitors
              </Link>
            </li>
            <li>
              <Link href="/shop?category=leather-goods" className="hover:text-amber-700 transition-colors">
                Artisan Tuscan Leather
              </Link>
            </li>
            <li>
              <Link href="/shop?category=footwear" className="hover:text-amber-700 transition-colors">
                Designer Footwear
              </Link>
            </li>
            <li>
              <Link href="/shop?category=smart-home" className="hover:text-amber-700 transition-colors">
                Architectural Smart Home
              </Link>
            </li>
          </ul>
        </div>

        {/* Concierge & Support */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Client Concierge
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li>
              <Link href="/account/orders" className="hover:text-amber-700 transition-colors">
                Track Global Shipment
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-amber-700 transition-colors">
                Personal Wishlist
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-amber-700 transition-colors">
                VIP Membership
              </Link>
            </li>
            <li>
              <span className="text-slate-400">Private Bespoke Orders</span>
            </li>
            <li>
              <span className="text-slate-400">Authenticity Certificate</span>
            </li>
          </ul>
        </div>

        {/* Management & Legal */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Management
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-600">
            <li>
              <Link href="/admin" className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" /> Admin Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/assistant" className="text-slate-700 hover:text-slate-900 font-semibold">
                AI Store Assistant
              </Link>
            </li>
            <li>
              <span className="text-slate-400">Privacy Policy</span>
            </li>
            <li>
              <span className="text-slate-400">Terms of Service</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Strip */}
      <div className="border-t border-slate-200/80 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Luxe Atelier International Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
            <span>Apple Pay</span>
            <span>•</span>
            <span>Visa Black</span>
            <span>•</span>
            <span>Mastercard World</span>
            <span>•</span>
            <span>American Express</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
