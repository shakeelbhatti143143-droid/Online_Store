'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  ArrowRight,
  Printer,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { INITIAL_ORDERS } from '@/lib/data/initial-data';
import { Order } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'ORD-984210';

  const [order, setOrder] = useState<Order>(
    INITIAL_ORDERS[0] || {
      id: 'ord-mock',
      orderNumber: orderNumber,
      customerEmail: 'alexandra.vance@luxury.com',
      customerName: 'Alexandra Vance',
      status: 'processing',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      deliveryMethod: 'express',
      subtotal: 1890,
      discountAmount: 189,
      shippingAmount: 0,
      taxAmount: 136.08,
      totalAmount: 1837.08,
      shippingAddress: {
        fullName: 'Alexandra Vance',
        email: 'alexandra.vance@luxury.com',
        phone: '+1 (555) 234-5678',
        addressLine1: '740 Park Avenue',
        city: 'New York',
        state: 'NY',
        postalCode: '10021',
        country: 'United States',
      },
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productTitle: 'Aethelgard Chrono 01 Automatic',
          productImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
          variantName: 'Obsidian Black / 41mm',
          sku: 'WTC-ATH-001',
          unitPrice: 1890,
          quantity: 1,
          totalPrice: 1890,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  useEffect(() => {
    // Trigger celebratory luxury gold & purple confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#D97706', '#8B5CF6', '#FFFFFF', '#06B6D4'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Celebration Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="w-20 h-20 rounded-3xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center mx-auto shadow-2xl shadow-gold-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 border border-border-light text-xs font-mono text-gold-400">
            <Sparkles className="w-3 h-3" />
            <span>Order Reference: {order.orderNumber}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
            Order Confirmed & Sealed
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
            Thank you, <strong className="text-white">{order.customerName}</strong>. Your acquisition has been recorded on our ledger and dispatched to our white-glove packaging concierge.
          </p>
        </div>

        {/* Fulfillment Stepper Tracker */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-light bg-surface-200/90 mb-8">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-400" />
            <span>Fulfillment Pipeline</span>
          </h2>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
            {[
              { step: 'Order Placed', time: 'Completed', active: true, done: true },
              { step: 'Vault Inspection', time: 'In Progress', active: true, done: false },
              { step: 'Courier Transit', time: 'Pending', active: false, done: false },
              { step: 'Handover Signature', time: 'Pending', active: false, done: false },
            ].map((s, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={cn(
                    'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border',
                    s.done
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : s.active
                      ? 'bg-gold-500 text-black border-gold-400 animate-pulse'
                      : 'bg-surface-100 text-gray-500 border-white/5'
                  )}
                >
                  {s.done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-white">{s.step}</p>
                <p className="text-[10px] text-gray-400 font-mono">{s.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details & Summary Card */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border-light bg-surface-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
            <div>
              <h3 className="text-base font-bold text-white">Acquisition Receipt</h3>
              <p className="text-xs text-gray-400 mt-0.5">Date: {formatDate(order.createdAt)}</p>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-xs font-semibold text-gray-200 border border-border-light transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Invoice</span>
            </button>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-surface-100/60 border border-white/5">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-200 shrink-0">
                  <Image src={item.productImage} alt={item.productTitle} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.productTitle}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {item.variantName || 'Standard Specification'} • Qty: {item.quantity}
                  </p>
                  <p className="text-[10px] font-mono text-gray-500">SKU: {item.sku}</p>
                </div>
                <span className="text-sm font-bold text-white shrink-0">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Shipping & Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border-subtle text-xs">
            <div className="space-y-1 text-gray-300">
              <p className="font-bold text-white uppercase tracking-wider text-[11px]">Shipping Destination</p>
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2 || ''}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>

            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Privilege Savings</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Insured Courier</span>
                <span className="text-white font-medium">{order.shippingAmount === 0 ? 'FREE' : formatPrice(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax & Customs (7.5%)</span>
                <span className="text-white font-medium">{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-border-light">
                <span>Total Paid</span>
                <span className="text-base text-gold-400 font-display">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row gap-3">
            <Link href="/account/orders" className="flex-1">
              <Button variant="secondary" size="md" className="w-full" leftIcon={<Package className="w-4 h-4" />}>
                Track in Account Dashboard
              </Button>
            </Link>
            <Link href="/shop" className="flex-1">
              <Button variant="gold" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue Exploring
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-gray-400 text-xs">Loading receipt...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
