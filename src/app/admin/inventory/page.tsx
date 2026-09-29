'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Boxes, AlertTriangle, Plus, Minus, Check, Sparkles, Search, RefreshCw } from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { Product } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';

export default function AdminInventoryPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    const prods = await storeDb.getProducts();
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async (product: Product, delta: number) => {
    const newQty = Math.max(0, product.stockQuantity + delta);
    await storeDb.updateProduct(product.id, { stockQuantity: newQty });
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stockQuantity: newQty } : p))
    );
    showToast({
      type: 'success',
      title: 'Stock Updated',
      message: `${product.title} inventory set to ${newQty} units.`,
    });
  };

  const filtered = products.filter((p) => {
    if (filterLowStock && p.stockQuantity > p.lowStockThreshold) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vault Logistics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Inventory & Stock Reordering ({products.length})
          </h1>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{lowStockCount} items near depletion</span>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="admin-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search piece or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full admin-input pl-10 pr-4 py-2.5"
          />
        </div>

        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all border w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-sm',
            filterLowStock
              ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-amber-500/20'
              : 'bg-[#111726] text-slate-300 border-white/10 hover:text-white hover:bg-[#162035]'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Show Low Stock Only ({lowStockCount})</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="admin-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="admin-table-head">
                <th className="p-4">Piece</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">Available Units</th>
                <th className="p-4">Low Stock Limit</th>
                <th className="p-4 text-right">Quick Restock / Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock = !isOutOfStock && product.stockQuantity <= product.lowStockThreshold;

                return (
                  <tr key={product.id} className="admin-table-row">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#131B30] shrink-0 border border-white/10">
                          <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <h4 className="text-xs font-extrabold text-white truncate">{product.title}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">{product.brandName}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-300 text-xs">{product.sku}</td>

                    <td className="p-4 font-extrabold text-amber-400 font-mono text-sm">{formatPrice(product.price)}</td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-bold text-sm font-mono',
                            isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-white'
                          )}
                        >
                          {product.stockQuantity}
                        </span>
                        {isOutOfStock && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider">
                            SOLD OUT
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                            REORDER
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-xs">{product.lowStockThreshold} units</td>

                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#0F172A] border border-white/10">
                        <button
                          onClick={() => handleAdjustStock(product, -1)}
                          disabled={product.stockQuantity <= 0}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Decrement stock by 1"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAdjustStock(product, 5)}
                          className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-extrabold border border-amber-500/30 cursor-pointer"
                          title="Restock 5 units"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleAdjustStock(product, 1)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Increment stock by 1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
