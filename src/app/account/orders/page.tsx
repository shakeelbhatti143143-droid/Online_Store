'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { INITIAL_ORDERS } from '@/lib/data/initial-data';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
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
          </div>

          <Link href="/account">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Profile
            </Button>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
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
              {tab} {tab === 'all' ? `(${orders.length})` : ''}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-light bg-surface-200/80 space-y-6 hover:border-gold-500/30 transition-all"
            >
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-gold-400 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{order.orderNumber}</span>
                      <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-400">Total Valuation</p>
                  <p className="text-base font-extrabold text-gold-400 font-display">
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Items in this Order */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-surface-100/60 border border-white/5">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-200 shrink-0">
                      <Image src={item.productImage} alt={item.productTitle} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.productTitle}</h4>
                      <p className="text-[11px] text-gray-400">
                        {item.variantName || 'Standard Spec'} • Quantity: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tracking strip & actions */}
              <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span>
                    Tracking: <strong className="text-white font-mono">{order.trackingNumber || 'Awaiting Carrier Scan'}</strong>
                  </span>
                  {order.estimatedDelivery && (
                    <span className="text-gray-400">({order.estimatedDelivery})</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/order-success?orderNumber=${order.orderNumber}`}>
                    <Button variant="secondary" size="sm">
                      View Official Receipt
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
