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

      /*
       * The API may return:
       * { orders: [...] }
       * or
       * { data: [...] }
       * or directly [...]
       */
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
          : 'Unable to load your orders.'
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
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border-light flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Purchase Ledger</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Order History & Tracking
            </h1>

            <p className="text-sm text-gray-400 mt-2">
              View your orders, purchased items, delivery status and tracking information.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadOrders}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>

            <Link href="/account">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl glass-panel p-12 border border-border-light bg-surface-200/80 text-center">
            <div className="flex justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
            </div>

            <h2 className="text-lg font-bold text-white">
              Loading your orders...
            </h2>

            <p className="text-sm text-gray-400 mt-2">
              Please wait while we retrieve your order history.
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-3xl glass-panel p-8 border border-rose-500/30 bg-rose-500/5 text-center">
            <Package className="w-10 h-10 text-rose-400 mx-auto mb-4" />

            <h2 className="text-lg font-bold text-white">
              Unable to load orders
            </h2>

            <p className="text-sm text-gray-400 mt-2">
              {error}
            </p>

            <div className="mt-5">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadOrders}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        {!loading && !error && orders.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              'all',
              'processing',
              'shipped',
              'delivered',
              'cancelled',
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  statusFilter === tab
                    ? 'bg-gold-500 text-black shadow-md shadow-gold-500/20'
                    : 'bg-surface-100 text-gray-400 hover:text-white border border-border-light'
                )}
              >
                {tab}

                {tab === 'all' && (
                  <span className="ml-1">
                    ({orders.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty Orders */}
        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="rounded-3xl glass-panel p-12 border border-border-light bg-surface-200/80 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
                <ShoppingBag className="w-8 h-8 text-gold-400" />
              </div>

              <h2 className="text-xl font-bold text-white">
                No orders found
              </h2>

              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                You have not placed any orders yet, or your orders are not
                available for the currently logged-in account.
              </p>

              <div className="mt-6">
                <Link href="/shop">
                  <Button variant="primary" size="sm">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </div>
          )}

        {/* Filter Empty */}
        {!loading &&
          !error &&
          orders.length > 0 &&
          filteredOrders.length === 0 && (
            <div className="rounded-3xl glass-panel p-10 border border-border-light bg-surface-200/80 text-center">
              <Package className="w-10 h-10 text-gray-500 mx-auto mb-4" />

              <h2 className="text-lg font-bold text-white">
                No {statusFilter} orders
              </h2>

              <p className="text-sm text-gray-400 mt-2">
                You don't currently have any orders with this status.
              </p>
            </div>
          )}

        {/* Orders List */}
        {!loading &&
          !error &&
          filteredOrders.length > 0 && (
            <div className="space-y-6">

              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-light bg-surface-200/80 space-y-6 hover:border-gold-500/30 transition-all"
                >

                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">

                    <div className="flex flex-wrap items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-gold-400 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">

                          <span className="text-sm font-bold text-white font-mono">
                            {order.orderNumber}
                          </span>

                          <Badge
                            variant={getStatusBadgeVariant(order.status)}
                            size="sm"
                          >
                            {order.status.toUpperCase()}
                          </Badge>

                        </div>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>

                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-400">
                        Total Valuation
                      </p>

                      <p className="text-base font-extrabold text-gold-400 font-display">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>

                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">

                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-surface-100/60 border border-white/5"
                      >

                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-200 shrink-0">

                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productTitle || 'Product'}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-500" />
                            </div>
                          )}

                        </div>

                        <div className="flex-1 min-w-0">

                          <h4 className="text-xs font-bold text-white truncate">
                            {item.productTitle}
                          </h4>

                          <p className="text-[11px] text-gray-400">
                            {item.variantName || 'Standard Spec'}
                            {' • '}
                            Quantity: {item.quantity}
                          </p>

                        </div>

                        <span className="text-xs font-bold text-white shrink-0">
                          {formatPrice(item.totalPrice)}
                        </span>

                      </div>
                    ))}

                  </div>

                  {/* Tracking */}
                  <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">

                    <div className="flex items-center gap-2 text-gray-300">

                      <Truck className="w-4 h-4 text-cyan-400" />

                      <span>
                        Tracking:{' '}

                        <strong className="text-white font-mono">
                          {order.trackingNumber ||
                            'Awaiting Carrier Scan'}
                        </strong>
                      </span>

                      {order.estimatedDelivery && (
                        <span className="text-gray-400">
                          ({order.estimatedDelivery})
                        </span>
                      )}

                    </div>

                    <div className="flex gap-2">

                      <Link
                        href={`/order-success?orderNumber=${encodeURIComponent(
                          order.orderNumber
                        )}`}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                        >
                          View Official Receipt
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