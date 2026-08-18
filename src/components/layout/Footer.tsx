'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw, Lock, Check } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

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
    <footer className="border-t border-border-light bg-surface-300 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Trust Badges Strip */}
      <div className="border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Global Express</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Complimentary over $500</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Authentic</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Certificate with every piece</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">30-Day Returns</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Complimentary return concierge</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Vault Security</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">256-Bit SSL protection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand & Mission */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-amber-700 p-0.5 shadow-lg">
              <div className="w-full h-full bg-surface-300 rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-gold-400" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-wider text-white uppercase font-display">
              LUXE<span className="text-gold-400 font-light ml-1">ATELIER</span>
            </span>
          </Link>
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
            Curators of extraordinary objects. From Swiss mechanical tourbillons and planar acoustic monitors to Tuscan vegetable-tanned leather essentials.
          </p>

          {/* Newsletter Box */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Join the Private Circle
            </p>
            <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
              <input
                type="email"
                placeholder="Enter your VIP email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-surface-100 border border-border-light rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                {subscribed ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Collections
          </h4>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li>
              <Link href="/shop?category=timepieces" className="hover:text-gold-400 transition-colors">
                Timepieces & Horology
              </Link>
            </li>
            <li>
              <Link href="/shop?category=audio-tech" className="hover:text-gold-400 transition-colors">
                Planar Audio Monitors
              </Link>
            </li>
            <li>
              <Link href="/shop?category=leather-goods" className="hover:text-gold-400 transition-colors">
                Artisan Tuscan Leather
              </Link>
            </li>
            <li>
              <Link href="/shop?category=footwear" className="hover:text-gold-400 transition-colors">
                Designer Footwear
              </Link>
            </li>
            <li>
              <Link href="/shop?category=smart-home" className="hover:text-gold-400 transition-colors">
                Architectural Smart Home
              </Link>
            </li>
          </ul>
        </div>

        {/* Concierge & Support */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Client Concierge
          </h4>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li>
              <Link href="/account/orders" className="hover:text-gold-400 transition-colors">
                Track Global Shipment
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-gold-400 transition-colors">
                Personal Wishlist
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-gold-400 transition-colors">
                VIP Membership
              </Link>
            </li>
            <li>
              <span className="text-gray-500 cursor-not-allowed">Private Bespoke Orders</span>
            </li>
            <li>
              <span className="text-gray-500 cursor-not-allowed">Authenticity Certificate</span>
            </li>
          </ul>
        </div>

        {/* Administration & Legal */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            Management
          </h4>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li>
              <Link href="/admin" className="text-gold-400 hover:underline font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Admin Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/assistant" className="text-cyan-400 hover:underline font-semibold">
                AI Store Assistant
              </Link>
            </li>
            <li>
              <span className="text-gray-500">Privacy Policy</span>
            </li>
            <li>
              <span className="text-gray-500">Terms of Service</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Strip */}
      <div className="border-t border-border-subtle py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Luxe Atelier International Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
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
