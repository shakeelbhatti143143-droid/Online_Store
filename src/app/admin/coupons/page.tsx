'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Sparkles, Check, Copy } from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { Coupon } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minOrderAmount, setMinOrderAmount] = useState('100');

  const loadCoupons = async () => {
    const data = await storeDb.getCoupons();
    setCoupons(data);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await storeDb.createCoupon({
      code,
      description,
      discountType,
      discountValue: parseFloat(discountValue) || 10,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
    });
    showToast({ type: 'success', title: 'Coupon Created', message: `Code ${code.toUpperCase()} is now active.` });
    setIsModalOpen(false);
    setCode('');
    setDescription('');
    await loadCoupons();
  };

  const handleDeleteCoupon = async (id: string, couponCode: string) => {
    await storeDb.deleteCoupon(id);
    showToast({ type: 'info', title: 'Coupon Removed', message: `Code ${couponCode} was removed.` });
    await loadCoupons();
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Privilege Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Promo Codes & Promotions ({coupons.length})
          </h1>
        </div>

        <Button variant="gold" size="md" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Promo Code
        </Button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="p-6 rounded-3xl glass-card border border-border-light bg-surface-200/90 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                  <Tag className="w-4 h-4" />
                </div>
                <span className="font-mono text-base font-extrabold text-white tracking-wider">
                  {coupon.code}
                </span>
              </div>

              <button
                onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 transition-colors"
                aria-label="Delete coupon"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">{coupon.description}</p>

            <div className="pt-3 border-t border-border-subtle space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Discount Value:</span>
                <strong className="text-gold-400">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `${formatPrice(coupon.discountValue)} OFF`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Min Order Spend:</span>
                <span className="text-white">{coupon.minOrderAmount ? formatPrice(coupon.minOrderAmount) : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Redemptions:</span>
                <span className="text-white font-mono">{coupon.usedCount} used</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" title="Generate New Promo Code">
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <Input
            label="Promo Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. AUTUMN25"
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 25% discount for private collectors"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full bg-surface-100 border border-border-light text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-gold-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <Input
              label="Discount Value"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
            />
          </div>

          <Input
            label="Minimum Order Spend ($)"
            type="number"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="md">
              Activate Code
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
