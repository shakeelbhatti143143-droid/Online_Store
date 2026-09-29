'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { AnalyticsSummary, Order, Product } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function AdminOverviewPage() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '1y'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [a, o] = await Promise.all([
        storeDb.getAnalytics(),
        storeDb.getOrders(),
      ]);
      setAnalytics(a);
      setRecentOrders(o.slice(0, 5));
    } catch (err) {
      console.error('Failed to load admin overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await storeDb.updateOrderStatus(orderId, newStatus);
      setRecentOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast({
        type: 'success',
        title: 'Status Synchronized',
        message: `Order status set to ${newStatus.toUpperCase()}`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Unable to update order status in database.',
      });
    }
  };

  if (isLoading || !analytics) {
    return (
      <div className="space-y-8 pb-12 animate-pulse">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-800 rounded-md" />
            <div className="h-8 w-64 bg-slate-800 rounded-xl" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-32 bg-slate-800 rounded-xl" />
            <div className="h-9 w-32 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#0D1322] border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-slate-800 rounded" />
                <div className="h-8 w-8 bg-slate-800 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-7 w-28 bg-slate-800 rounded" />
                <div className="h-3 w-20 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Chart & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0B101E] border border-white/10 h-80" />
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0B101E] border border-white/10 h-80" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Gross Revenue',
      value: formatPrice(analytics.totalRevenue),
      subtext: 'Completed transactions',
      isPositive: true,
      icon: DollarSign,
      color: 'gold',
    },
    {
      title: 'Processed Orders',
      value: analytics.totalOrders.toString(),
      subtext: `${analytics.pendingOrders} awaiting dispatch`,
      isPositive: true,
      icon: ShoppingBag,
      color: 'cyan',
    },
    {
      title: 'Registered Users',
      value: (analytics.totalUsers ?? analytics.totalCustomers).toString(),
      subtext: `${analytics.verifiedUsers ?? 0} Verified • ${analytics.unverifiedUsers ?? 0} Pending`,
      isPositive: true,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Pending Fulfillment',
      value: analytics.pendingOrders.toString(),
      subtext: analytics.pendingOrders > 0 ? 'Requires attention' : 'All dispatched',
      isPositive: analytics.pendingOrders === 0,
      icon: Clock,
      color: 'emerald',
    },
    {
      title: 'Low Stock Alerts',
      value: analytics.lowStockCount.toString(),
      subtext: analytics.lowStockCount > 0 ? 'Restock required' : 'Optimal levels',
      isPositive: analytics.lowStockCount === 0,
      icon: AlertTriangle,
      color: 'rose',
    },
  ];

  const maxSalesRev = Math.max(...analytics.salesData.map((d) => d.revenue), 500);

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Executive Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products?action=new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-extrabold text-xs tracking-wide shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Piece</span>
          </Link>
          <Link
            href="/admin/assistant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-bold text-xs tracking-wide shadow-md shadow-cyan-500/10 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Copilot</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="admin-card p-5 space-y-3 bg-[#0D1322] border border-white/10 shadow-xl shadow-black/40 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  {kpi.title}
                </span>
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm shrink-0',
                    kpi.color === 'gold' && 'bg-amber-500/20 border-amber-500/40 text-amber-300',
                    kpi.color === 'cyan' && 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
                    kpi.color === 'purple' && 'bg-purple-500/20 border-purple-500/40 text-purple-300',
                    kpi.color === 'emerald' && 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
                    kpi.color === 'rose' && 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <p className="text-3xl font-extrabold text-white tracking-tight font-display drop-shadow-sm">
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <span className={cn('font-bold', kpi.isPositive ? 'text-emerald-400' : 'text-rose-400')}>
                    {kpi.subtext}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Graph & Category Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Sales Chart (8 cols) */}
        <div className="admin-panel lg:col-span-8 p-6 sm:p-7 bg-[#0B101E] border border-white/10 shadow-2xl space-y-6 overflow-hidden min-w-0 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Revenue Trajectory</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">7-day performance from MongoDB order records</p>
            </div>

            <div className="flex gap-1.5 p-1 rounded-xl bg-[#080C16] border border-white/10 text-xs font-bold self-start sm:self-auto">
              {(['7d', '30d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1 rounded-lg transition-all uppercase text-[10px] font-extrabold cursor-pointer',
                    timeRange === range
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-3 pt-8 pb-2 px-1">
            {analytics.salesData.map((item, i) => {
              const hasRevenue = item.revenue > 0;
              const heightPct = hasRevenue ? Math.min(100, Math.max(10, (item.revenue / maxSalesRev) * 100)) : 4;
              return (
                <div key={i} className="relative min-w-0 flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Floating tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-mono font-bold text-amber-300 transition-all duration-150 bg-[#070B12] px-2.5 py-1 rounded-lg border border-amber-500/40 whitespace-nowrap shadow-2xl z-30">
                    {formatPrice(item.revenue)} ({item.orders} ord)
                  </div>

                  {/* Bar track and fill */}
                  <div className="w-full max-w-[44px] bg-slate-800/60 rounded-xl overflow-hidden h-44 flex items-end border border-white/5 mx-auto">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        hasRevenue
                          ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-300 group-hover:brightness-125 shadow-md shadow-amber-500/20'
                          : 'bg-amber-500/25 group-hover:bg-amber-500/50'
                      )}
                    />
                  </div>

                  {/* Day label */}
                  <span className="text-xs font-extrabold text-slate-300 truncate text-center w-full">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Revenue Breakdown (4 cols) */}
        <div className="admin-panel lg:col-span-4 p-6 sm:p-7 bg-[#0B101E] border border-white/10 shadow-2xl space-y-6 overflow-hidden min-w-0 flex flex-col justify-between">
          <div className="pb-4 border-b border-white/10">
            <h3 className="text-lg font-extrabold text-white tracking-tight">Category Distribution</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Revenue split across active collections</p>
          </div>

          <div className="space-y-4">
            {analytics.categoryDistribution.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <p className="font-semibold">No categorised order history recorded yet.</p>
                <p className="text-[11px] text-slate-500">Distribution will populate upon dispatch.</p>
              </div>
            ) : (
              analytics.categoryDistribution.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold gap-2">
                    <span className="text-slate-200 truncate">{cat.category}</span>
                    <span className="text-amber-400 font-mono font-extrabold shrink-0">{cat.percentage}% ({formatPrice(cat.revenue)})</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className={cn(
                        'h-full rounded-full',
                        idx % 4 === 0 && 'bg-gradient-to-r from-amber-500 to-yellow-400',
                        idx % 4 === 1 && 'bg-gradient-to-r from-cyan-500 to-blue-400',
                        idx % 4 === 2 && 'bg-gradient-to-r from-purple-500 to-pink-400',
                        idx % 4 === 3 && 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      )}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Recent Orders Table (7 cols) */}
        <div className="admin-panel lg:col-span-7 p-6 bg-[#0B101E] border border-white/10 shadow-2xl space-y-4 overflow-hidden min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Recent Dispatches</h3>
              <p className="text-xs text-slate-400 font-medium">Live order pipeline ({recentOrders.length} shown)</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-extrabold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No orders placed yet.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="admin-table-head">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="admin-table-row">
                      <td className="py-3.5 px-4 font-mono text-white font-extrabold">{ord.orderNumber}</td>
                      <td className="py-3.5 px-4 text-slate-200 font-bold">{ord.customerName}</td>
                      <td className="py-3.5 px-4 font-extrabold font-mono text-amber-400">{formatPrice(ord.totalAmount)}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value as any)}
                          className="admin-select text-[11px] font-bold px-2.5 py-1.5"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/order-success?orderNumber=${ord.orderNumber}`}
                          className="text-slate-300 hover:text-white underline text-[11px] font-bold"
                        >
                          Receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Selling Products (5 cols) */}
        <div className="admin-panel lg:col-span-5 p-6 bg-[#0B101E] border border-white/10 shadow-2xl space-y-4 overflow-hidden min-w-0 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Top Grossing Curations</h3>
              <p className="text-xs text-slate-400 font-medium">Leaderboard from customer acquisitions</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-extrabold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {analytics.topSellingProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 font-medium">No product sales aggregated yet.</p>
            ) : (
              analytics.topSellingProducts.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#131B30] border border-white/10 hover:border-amber-500/40 transition-colors">
                  <span className="w-5 font-mono text-xs font-extrabold text-amber-400 text-center">#{idx + 1}</span>
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#0B101E] shrink-0 border border-white/10">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#131B30] flex items-center justify-center text-[10px] text-slate-400">
                        Piece
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-extrabold text-white truncate">{p.title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{p.salesCount} sold • {formatPrice(p.price)}</p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400 font-mono shrink-0">{formatPrice(p.totalRevenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
