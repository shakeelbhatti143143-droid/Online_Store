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
    <div className="min-h-screen bg-white pt-28 pb-24 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Purchase Ledger</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Order History & Tracking
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              View your acquisitions, purchased items, dispatch status and tracking details.
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
                variant="outline"
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
          <div className="rounded-3xl bg-slate-50 p-12 border border-slate-200 text-center">
            <div className="flex justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Loading your acquisitions...
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Please wait while we retrieve your order history from our ledger.
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-3xl p-8 border border-rose-200 bg-rose-50 text-center">
            <Package className="w-10 h-10 text-rose-500 mx-auto mb-4" />

            <h2 className="text-lg font-bold text-rose-900">
              Unable to load orders
            </h2>

            <p className="text-sm text-rose-700 mt-2">{error}</p>

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
            {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                    statusFilter === tab
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-white'
                  )}
                >
                  {tab}
                  {tab === 'all' && (
                    <span className="ml-1">({orders.length})</span>
                  )}
                </button>
              )
            )}
          </div>
        )}

        {/* Empty Orders */}
        {!loading && !error && orders.length === 0 && (
          <div className="rounded-3xl bg-slate-50 p-12 border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <ShoppingBag className="w-8 h-8 text-amber-700" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 font-display">
              No orders found
            </h2>

            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              You have not placed any orders yet, or your orders are not available
              for the currently active account.
            </p>

            <div className="mt-6">
              <Link href="/shop">
                <Button variant="gold" size="sm">
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
            <div className="rounded-3xl bg-slate-50 p-10 border border-slate-200 text-center">
              <Package className="w-10 h-10 text-slate-400 mx-auto mb-4" />

              <h2 className="text-lg font-bold text-slate-900">
                No {statusFilter} orders
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                You don't currently have any orders with this status.
              </p>
            </div>
          )}

        {/* Orders List */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6 hover:shadow-md transition-all"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {order.orderNumber}
                        </span>

                        <Badge
                          variant={getStatusBadgeVariant(order.status)}
                          size="sm"
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">
                      Total Valuation
                    </p>
                    <p className="text-base font-extrabold text-amber-800 font-display">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200">
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
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.productTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {item.variantName || 'Standard Spec'}
                          {' • '}
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-slate-900 shrink-0">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tracking */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Truck className="w-4 h-4 text-teal-600" />
                    <span>
                      Tracking:{' '}
                      <strong className="text-slate-900 font-mono">
                        {order.trackingNumber || 'Awaiting Carrier Scan'}
                      </strong>
                    </span>
                    {order.estimatedDelivery && (
                      <span className="text-slate-400">
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
                      <Button variant="secondary" size="sm">
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