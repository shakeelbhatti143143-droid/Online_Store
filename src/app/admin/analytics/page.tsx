'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Sparkles,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { AnalyticsSummary } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '1y'>('30d');

  useEffect(() => {
    storeDb.getAnalytics().then((a) => setAnalytics(a));
  }, []);

  if (!analytics) return <div className="py-20 text-center text-xs text-gray-400">Loading analytics...</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Financial Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Executive Analytics & Intelligence
          </h1>
        </div>

        <div className="flex gap-1.5 p-1 rounded-2xl bg-surface-100 border border-border-light">
          {(['today', '7d', '30d', '1y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                timeframe === tf
                  ? 'bg-gold-500 text-black shadow-md shadow-gold-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl glass-panel bg-surface-200/90 border border-border-light space-y-2">
          <span className="text-xs text-gray-400 font-semibold">Average Order Value (AOV)</span>
          <p className="text-3xl font-extrabold text-white font-display">
            {formatPrice(analytics.totalRevenue / Math.max(1, analytics.totalOrders))}
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold">+8.4% above luxury sector benchmark</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel bg-surface-200/90 border border-border-light space-y-2">
          <span className="text-xs text-gray-400 font-semibold">Conversion Rate</span>
          <p className="text-3xl font-extrabold text-gold-400 font-display">3.82%</p>
          <p className="text-[11px] text-emerald-400 font-semibold">+1.2% higher with Express Checkout</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel bg-surface-200/90 border border-border-light space-y-2">
          <span className="text-xs text-gray-400 font-semibold">Customer Retention</span>
          <p className="text-3xl font-extrabold text-cyan-400 font-display">64.5%</p>
          <p className="text-[11px] text-cyan-300 font-semibold">Repeat collector purchases</p>
        </div>

        <div className="p-6 rounded-3xl glass-panel bg-surface-200/90 border border-border-light space-y-2">
          <span className="text-xs text-gray-400 font-semibold">Net Profit Margin</span>
          <p className="text-3xl font-extrabold text-purple-400 font-display">42.1%</p>
          <p className="text-[11px] text-purple-300 font-semibold">Direct atelier sourcing model</p>
        </div>
      </div>

      {/* Graphs & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl glass-panel border border-border-light bg-surface-200/90 space-y-6">
          <h3 className="text-base font-bold text-white tracking-tight">Daily Gross Revenue Volume</h3>
          <div className="h-64 flex items-end justify-between gap-3 pt-6 pb-2">
            {analytics.salesData.map((item, i) => {
              const maxRev = 18000;
              const heightPct = Math.min(100, Math.max(15, (item.revenue / maxRev) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-gold-400 transition-opacity bg-surface-300 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                    {formatPrice(item.revenue)}
                  </span>
                  <div className="w-full bg-surface-100 rounded-xl overflow-hidden h-48 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full bg-gradient-to-t from-gold-600 to-amber-300 rounded-t-xl group-hover:brightness-125 transition-all"
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl glass-panel border border-border-light bg-surface-200/90 space-y-6">
          <h3 className="text-base font-bold text-white tracking-tight">Category Contribution</h3>
          <div className="space-y-4">
            {analytics.categoryDistribution.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-300">{cat.category}</span>
                  <span className="text-gold-400 font-mono">{cat.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-gradient-to-r from-gold-500 to-amber-300 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
