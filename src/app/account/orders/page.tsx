'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Package,
  Truck,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/orders', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load orders');
      }

      const customerOrders = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setOrders(customerOrders);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
      setOrders([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your acquisitions.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') {
      return true;
    }
    return order.status === statusFilter;
  });

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'emerald';
      case 'shipped':
        return 'cyan';
      case 'processing':
        return 'gold';
      case 'cancelled':
        return 'rose';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#070b12] pt-24 sm:pt-28 pb-28 text-slate-900 dark:text-slate-100 selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-200 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">

        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Purchase Ledger</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white tracking-tight">
              Acquisitions & Order Tracking
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Insured courier dispatches, vault tracking, and acquisition receipts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadOrders}
              leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />}
              className="text-xs"
            >
              Refresh
            </Button>

            <Link href="/account">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Back to Suite
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs (Compact Pills) */}
        {!loading && !error && orders.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-white dark:bg-[#0d1322] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0',
                  statusFilter === tab
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                )}
              >
                {tab}
                {tab === 'all' && <span className="ml-1.5 opacity-80">({orders.length})</span>}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0d1322] p-10 border border-slate-200/80 dark:border-white/10 text-center shadow-xs">
            <RefreshCw className="w-7 h-7 text-amber-500 animate-spin mx-auto mb-3" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-serif">
              Accessing Purchase Ledger...
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Retrieving your acquisitions and shipment telemetry.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl p-6 border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-center">
            <Package className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Unable to Load Acquisitions
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{error}</p>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadOrders}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty Orders State */}
        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0d1322] p-10 border border-slate-200/80 dark:border-white/10 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-serif">
                No Acquisitions on Record
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Your purchase ledger is currently empty. Explore our fine collections to acquire your first piece.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/shop">
                <Button variant="gold" size="sm">
                  Explore Curated Pieces
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Filter Empty */}
        {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
          <div className="rounded-2xl bg-white dark:bg-[#0d1322] p-8 border border-slate-200/80 dark:border-white/10 text-center shadow-xs">
            <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              No {statusFilter} orders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You don&apos;t currently have any orders with this status filter.
            </p>
          </div>
        )}

        {/* Small-Size Order Cards List */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="space-y-3.5 sm:space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all duration-200 space-y-3.5"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Placed {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline sm:flex-col sm:items-end justify-between sm:justify-start">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 sm:text-right">
                      Valuation
                    </span>
                    <span className="text-sm sm:text-base font-bold font-serif text-amber-600 dark:text-amber-400">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items Mini List */}
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/5 border border-slate-100 dark:border-white/5"
                    >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200 dark:border-white/10">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productTitle || 'Piece'}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.productTitle}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {item.variantName || 'Standard Edition'} • Qty: {item.quantity}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-slate-900 dark:text-white shrink-0 font-serif">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer Actions */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                    <Truck className="w-3.5 h-3.5 text-sky-500" />
                    <span>
                      Tracking:{' '}
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {order.trackingNumber || 'Pending Dispatch Scan'}
                      </span>
                    </span>
                    {order.estimatedDelivery && (
                      <span className="text-slate-400 dark:text-slate-500">
                        • {order.estimatedDelivery}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/order-success?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                    >
                      <Button variant="secondary" size="sm" className="text-xs h-7 px-3">
                        View Receipt
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}