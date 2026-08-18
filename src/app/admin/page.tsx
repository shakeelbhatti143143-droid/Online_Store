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
} from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { AnalyticsSummary, Order, Product } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

export default function AdminOverviewPage() {
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '1y'>('7d');

  useEffect(() => {
    storeDb.getAnalytics().then((a) => setAnalytics(a));
    storeDb.getOrders().then((o) => setRecentOrders(o.slice(0, 5)));
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    await storeDb.updateOrderStatus(orderId, newStatus);
    setRecentOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showToast({
      type: 'success',
      title: 'Status Synchronized',
      message: `Order status set to ${newStatus.toUpperCase()}`,
    });
  };

  if (!analytics) {
    return <div className="py-20 text-center text-xs text-gray-400">Loading metrics...</div>;
  }

  const kpis = [
    {
      title: 'Gross Revenue',
      value: formatPrice(analytics.totalRevenue),
      change: `+${analytics.revenueChangePct}%`,
      isPositive: true,
      icon: DollarSign,
      color: 'gold',
    },
    {
      title: 'Processed Orders',
      value: analytics.totalOrders.toString(),
      change: `+${analytics.ordersChangePct}%`,
      isPositive: true,
      icon: ShoppingBag,
      color: 'cyan',
    },
    {
      title: 'Verified Collectors',
      value: analytics.totalCustomers.toString(),
      change: `+${analytics.customersChangePct}%`,
      isPositive: true,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Pending Fulfillment',
      value: analytics.pendingOrders.toString(),
      change: 'Active pipeline',
      isPositive: true,
      icon: Clock,
      color: 'emerald',
    },
    {
      title: 'Low Stock Alerts',
      value: analytics.lowStockCount.toString(),
      change: analytics.lowStockCount > 0 ? 'Requires Restock' : 'Normal',
      isPositive: analytics.lowStockCount === 0,
      icon: AlertTriangle,
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Executive Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products?action=new">
            <Button variant="gold" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add New Piece
            </Button>
          </Link>
          <Link href="/admin/assistant">
            <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}>
              AI Operations
            </Button>
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
              className="p-5 rounded-2xl glass-card bg-surface-200/90 border border-border-light space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">{kpi.title}</span>
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center border',
                    kpi.color === 'gold' && 'bg-gold-500/10 border-gold-500/30 text-gold-400',
                    kpi.color === 'cyan' && 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
                    kpi.color === 'purple' && 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                    kpi.color === 'emerald' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                    kpi.color === 'rose' && 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <p className="text-2xl font-extrabold text-white tracking-tight font-display">
                  {kpi.value}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  <span className={kpi.isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {kpi.change}
                  </span>
                  <span className="text-gray-500">vs last cycle</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Graph & Category Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl glass-panel border border-border-light bg-surface-200/90 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Revenue Trajectory</h3>
              <p className="text-xs text-gray-400">Daily sales performance</p>
            </div>

            <div className="flex gap-1.5 p-1 rounded-xl bg-surface-100 border border-white/5 text-xs font-semibold">
              {(['7d', '30d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1 rounded-lg transition-colors uppercase text-[10px]',
                    timeRange === range ? 'bg-gold-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {analytics.salesData.map((item, i) => {
              const maxRev = 18000;
              const heightPct = Math.min(100, Math.max(15, (item.revenue / maxRev) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-gold-400 transition-opacity bg-surface-300 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                    {formatPrice(item.revenue)}
                  </div>
                  <div className="w-full bg-surface-100 rounded-xl overflow-hidden h-44 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full bg-gradient-to-t from-gold-600 via-gold-500 to-amber-300 rounded-t-xl group-hover:brightness-125 transition-all"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Revenue Breakdown (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl glass-panel border border-border-light bg-surface-200/90 space-y-6">
          <div className="pb-4 border-b border-border-subtle">
            <h3 className="text-base font-bold text-white tracking-tight">Category Distribution</h3>
            <p className="text-xs text-gray-400">Revenue split across vaults</p>
          </div>

          <div className="space-y-4">
            {analytics.categoryDistribution.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-300">{cat.category}</span>
                  <span className="text-gold-400 font-mono">{cat.percentage}% ({formatPrice(cat.revenue)})</span>
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className={cn(
                      'h-full rounded-full',
                      idx === 0 && 'bg-gradient-to-r from-gold-500 to-amber-400',
                      idx === 1 && 'bg-gradient-to-r from-cyan-500 to-blue-400',
                      idx === 2 && 'bg-gradient-to-r from-purple-500 to-pink-400',
                      idx === 3 && 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Table (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl glass-panel border border-border-light bg-surface-200/90 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Recent Dispatches</h3>
              <p className="text-xs text-gray-400">Live order pipeline</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-border-subtle font-semibold">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 font-mono text-white font-bold">{ord.orderNumber}</td>
                    <td className="py-3 text-gray-300">{ord.customerName}</td>
                    <td className="py-3 font-bold text-gold-400">{formatPrice(ord.totalAmount)}</td>
                    <td className="py-3">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value as any)}
                        className="bg-surface-100 text-white text-[11px] font-bold rounded-lg px-2 py-1 border border-border-light focus:outline-none focus:border-gold-500 cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/order-success?orderNumber=${ord.orderNumber}`}
                        className="text-gray-400 hover:text-white underline text-[11px]"
                      >
                        Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl glass-panel border border-border-light bg-surface-200/90 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Top Grossing Curations</h3>
              <p className="text-xs text-gray-400">Leaderboard this month</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {analytics.topSellingProducts.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-100/60 border border-white/5">
                <span className="w-5 font-mono text-xs font-bold text-gold-400 text-center">#{idx + 1}</span>
                <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-surface-200 shrink-0">
                  <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                  <p className="text-[11px] text-gray-400">{p.salesCount} sold • {formatPrice(p.price)}</p>
                </div>
                <span className="text-xs font-bold text-white shrink-0">{formatPrice(p.totalRevenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
