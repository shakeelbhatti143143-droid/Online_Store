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
import { formatPrice, cn } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    storeDb.getAnalytics()
      .then((a) => setAnalytics(a))
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="space-y-8 pb-12 animate-pulse">
        <div className="h-10 w-64 bg-[#0D1322] rounded-xl border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-[#0D1322] border border-white/10 h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-8 rounded-3xl bg-[#0B101E] border border-white/10 h-80" />
          <div className="lg:col-span-4 p-8 rounded-3xl bg-[#0B101E] border border-white/10 h-80" />
        </div>
      </div>
    );
  }

  const maxRev = Math.max(...analytics.salesData.map((d) => d.revenue), 500);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Financial Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Executive Analytics & Intelligence
          </h1>
        </div>

        <div className="flex gap-1.5 p-1 rounded-2xl bg-[#0B101E] border border-white/10">
          {(['today', '7d', '30d', '1y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card p-6 space-y-2">
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Average Order Value (AOV)</span>
          <p className="text-3xl font-extrabold text-white font-display tracking-tight">
            {formatPrice(analytics.totalRevenue / Math.max(1, analytics.totalOrders))}
          </p>
          <p className="text-[11px] text-emerald-400 font-bold">Based on {analytics.totalOrders} total orders</p>
        </div>

        <div className="admin-card p-6 space-y-2">
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Registered Collectors</span>
          <p className="text-3xl font-extrabold text-amber-400 font-display tracking-tight">
            {analytics.totalUsers ?? analytics.totalCustomers}
          </p>
          <p className="text-[11px] text-emerald-400 font-bold">
            {analytics.verifiedUsers ?? 0} verified accounts
          </p>
        </div>

        <div className="admin-card p-6 space-y-2">
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Gross Lifetime Revenue</span>
          <p className="text-3xl font-extrabold text-cyan-400 font-display tracking-tight">
            {formatPrice(analytics.totalRevenue)}
          </p>
          <p className="text-[11px] text-cyan-300 font-bold">MongoDB order transactions</p>
        </div>

        <div className="admin-card p-6 space-y-2">
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Pending Fulfillment</span>
          <p className="text-3xl font-extrabold text-purple-400 font-display tracking-tight">
            {analytics.pendingOrders}
          </p>
          <p className="text-[11px] text-purple-300 font-bold">Orders requiring processing</p>
        </div>
      </div>

      {/* Graphs & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl admin-panel space-y-6 overflow-hidden min-w-0 flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-white tracking-tight">Daily Gross Revenue Volume</h3>
          <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-3 pt-8 pb-2 px-1">
            {analytics.salesData.map((item, i) => {
              const hasRevenue = item.revenue > 0;
              const heightPct = hasRevenue ? Math.min(100, Math.max(10, (item.revenue / maxRev) * 100)) : 4;
              return (
                <div key={i} className="relative min-w-0 flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-amber-300 transition-all duration-150 bg-[#070B12] px-2.5 py-1 rounded-lg border border-amber-500/40 whitespace-nowrap shadow-2xl z-30">
                    {formatPrice(item.revenue)} ({item.orders} ord)
                  </span>
                  <div className="w-full max-w-[44px] bg-[#131B30] rounded-xl overflow-hidden h-44 flex items-end border border-white/5 mx-auto">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        hasRevenue
                          ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300 group-hover:brightness-125 shadow-sm'
                          : 'bg-amber-500/25 group-hover:bg-amber-500/50'
                      )}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300 font-mono truncate text-center w-full">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl admin-panel space-y-6 overflow-hidden min-w-0 flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-white tracking-tight">Category Contribution</h3>
          <div className="space-y-4">
            {analytics.categoryDistribution.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No category sales recorded yet.</p>
            ) : (
              analytics.categoryDistribution.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold gap-2">
                    <span className="text-slate-200 truncate">{cat.category}</span>
                    <span className="text-amber-400 font-mono shrink-0 font-extrabold">{cat.percentage}% ({formatPrice(cat.revenue)})</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#131B30] rounded-full overflow-hidden border border-white/5">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
