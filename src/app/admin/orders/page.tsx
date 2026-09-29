'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  Sparkles,
  X,
  ExternalLink,
  Package,
} from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    const data = await storeDb.getOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await storeDb.updateOrderStatus(orderId, status);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status });
    }
    showToast({
      type: 'success',
      title: 'Status Updated',
      message: `Order status changed to ${status.toUpperCase()}`,
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="emerald" size="sm">DELIVERED</Badge>;
      case 'shipped':
        return <Badge variant="cyan" size="sm">SHIPPED</Badge>;
      case 'processing':
        return <Badge variant="gold" size="sm">PROCESSING</Badge>;
      case 'cancelled':
        return <Badge variant="rose" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="default" size="sm">PENDING</Badge>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fulfillment Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Order Fulfillment & Tracking ({orders.length})
          </h1>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order # or Collector Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full admin-input pl-10 pr-4 py-2.5"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer',
                statusFilter === st
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-extrabold'
                  : 'bg-[#111726] text-slate-300 hover:text-white hover:bg-[#162035] border border-white/10'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="admin-table-head">
                <th className="p-4">Reference</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Valuation</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="admin-table-row">
                  {/* Reference */}
                  <td className="p-4">
                    <span className="font-mono text-white font-bold text-xs">{order.orderNumber}</span>
                    <p className="text-[11px] text-slate-400 font-mono">{formatDate(order.createdAt)}</p>
                  </td>

                  {/* Customer */}
                  <td className="p-4">
                    <p className="text-white font-bold text-xs">{order.customerName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{order.customerEmail}</p>
                  </td>

                  {/* Items Count */}
                  <td className="p-4">
                    <span className="text-slate-300 font-semibold">
                      {order.items.length} {order.items.length === 1 ? 'piece' : 'pieces'}
                    </span>
                  </td>

                  {/* Valuation */}
                  <td className="p-4 font-extrabold text-amber-400 font-mono text-sm">
                    {formatPrice(order.totalAmount)}
                  </td>

                  {/* Fulfillment Status Select */}
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="admin-select px-3 py-1.5 font-bold"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>

                  {/* Payment Status */}
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider">
                      PAID
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Order Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        maxWidth="2xl"
        title={`Order Details • ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Customer</p>
                <p className="text-sm font-extrabold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-xs text-slate-600 font-mono">{selectedOrder.customerEmail} • {selectedOrder.customerPhone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Valuation</p>
                <p className="text-xl font-extrabold text-amber-600 font-mono">{formatPrice(selectedOrder.totalAmount)}</p>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Acquired Items</h4>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <Image src={item.productImage} alt={item.productTitle} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.productTitle}</h5>
                    <p className="text-[11px] text-slate-600">{item.variantName || 'Standard Spec'} • Qty: {item.quantity}</p>
                    <p className="text-[10px] font-mono text-slate-500">SKU: {item.sku}</p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 shrink-0 font-mono">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            {/* Address & Status update controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Shipping Destination</p>
                <p className="text-slate-700">{selectedOrder.shippingAddress.addressLine1} {selectedOrder.shippingAddress.addressLine2 || ''}</p>
                <p className="text-slate-700">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                <p className="text-slate-700">{selectedOrder.shippingAddress.country}</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Update Fulfillment Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold capitalize border transition-all cursor-pointer',
                        selectedOrder.status === st
                          ? 'bg-amber-500 text-black border-amber-600 font-extrabold shadow-sm'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="md" onClick={() => setSelectedOrder(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
