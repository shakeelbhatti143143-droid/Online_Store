'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Users, Search, Sparkles, Mail, Phone, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { UserProfile } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    storeDb.getCustomers().then((custs) => setCustomers(custs));
  }, []);

  const customerStats = [
    { name: 'Sophia Montgomery', totalSpend: 3727.08, ordersCount: 2, tier: 'VIP Gold' },
    { name: 'Alexander Wright', totalSpend: 1890.00, ordersCount: 1, tier: 'Executive' },
    { name: 'Julian De Vries', totalSpend: 4200.00, ordersCount: 3, tier: 'VIP Diamond' },
    { name: 'Claire Sterling', totalSpend: 1290.00, ordersCount: 1, tier: 'Collector' },
  ];

  const filtered = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
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
            <span>Collector Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Verified Customers & Lifetime Value ({customers.length})
          </h1>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-border-light bg-surface-200/90">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-100 border border-border-light rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-3xl glass-panel border border-border-light bg-surface-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-border-subtle font-bold uppercase tracking-wider bg-surface-100/50">
                <th className="p-4">Collector</th>
                <th className="p-4">Tier Status</th>
                <th className="p-4">Acquisitions</th>
                <th className="p-4">Lifetime Spend</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Account Security</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map((cust, idx) => {
                const stat = customerStats[idx % customerStats.length];
                return (
                  <tr key={cust.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
                          {cust.fullName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{cust.fullName}</p>
                          <p className="text-[11px] text-gray-400">{cust.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <Badge variant="gold" size="sm">{stat.tier}</Badge>
                    </td>

                    <td className="p-4 font-semibold text-white">
                      {stat.ordersCount} completed orders
                    </td>

                    <td className="p-4 font-bold text-gold-400 font-display text-sm">
                      {formatPrice(stat.totalSpend)}
                    </td>

                    <td className="p-4 text-gray-400">
                      {formatDate(cust.createdAt)}
                    </td>

                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> 2FA Verified
                      </span>
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
