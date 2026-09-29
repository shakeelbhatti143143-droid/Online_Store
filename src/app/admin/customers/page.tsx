'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Sparkles,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Clock,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Filter,
} from 'lucide-react';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { UserProfile } from '@/types';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';

export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await storeDb.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      showToast({
        type: 'error',
        title: 'Query Failed',
        message: 'Unable to retrieve user directory from MongoDB.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (user: UserProfile) => {
    const isPrimaryAdmin = user.email.toLowerCase() === 'gb8585438@gmail.com';
    if (isPrimaryAdmin) {
      showToast({
        type: 'info',
        title: 'Action Restricted',
        message: 'The primary administrator account cannot be deactivated.',
      });
      return;
    }

    const nextStatus = user.isActive === false ? true : false;
    setUpdatingId(user.id);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isActive: nextStatus }),
      });
      const result = await res.json();

      if (result.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === user.id ? { ...c, isActive: nextStatus } : c))
        );
        showToast({
          type: 'success',
          title: 'Account Status Updated',
          message: `${user.fullName}'s account has been ${nextStatus ? 'activated' : 'suspended'}.`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: result.error || 'Failed to change user status.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to communicate with server.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = customers.filter((c) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.fullName?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // Role filter
    if (roleFilter !== 'all' && c.role !== roleFilter) {
      return false;
    }

    // Verification filter
    if (verificationFilter === 'verified' && !c.emailVerified) {
      return false;
    }
    if (verificationFilter === 'unverified' && c.emailVerified) {
      return false;
    }

    return true;
  });

  // Calculate high-level summary KPIs
  const totalSpendSum = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const verifiedCount = customers.filter((c) => c.emailVerified).length;
  const activeCount = customers.filter((c) => c.isActive !== false).length;

  const getTier = (spend: number = 0) => {
    if (spend >= 3000) return { label: 'VIP Diamond', variant: 'gold' as const };
    if (spend >= 1500) return { label: 'VIP Gold', variant: 'gold' as const };
    if (spend > 0) return { label: 'Collector', variant: 'cyan' as const };
    return { label: 'Member', variant: 'default' as const };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Users & Collectors Management
          </h1>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-display tracking-tight">{customers.length}</p>
          <p className="text-[11px] text-slate-400">Registered in MongoDB</p>
        </div>

        <div className="admin-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Email Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 font-display tracking-tight">{verifiedCount}</p>
          <p className="text-[11px] text-slate-400">
            {customers.length > 0 ? `${Math.round((verifiedCount / customers.length) * 100)}% verification rate` : '0%'}
          </p>
        </div>

        <div className="admin-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Active Accounts</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white font-display tracking-tight">{activeCount}</p>
          <p className="text-[11px] text-slate-400">{customers.length - activeCount} suspended</p>
        </div>

        <div className="admin-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Cumulative Spend</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 font-display tracking-tight">{formatPrice(totalSpendSum)}</p>
          <p className="text-[11px] text-slate-400">Direct from order history</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-panel p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full admin-input pl-10 pr-4 py-2.5"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="admin-select px-3.5 py-2.5"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Customers Only</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="admin-select px-3.5 py-2.5"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="admin-panel overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-400 space-y-3">
              <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-semibold text-slate-300">Loading database directory...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-white text-base">No accounts found</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or filter parameters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="admin-table-head">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Email Status</th>
                  <th className="p-4">Tier Status</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Lifetime Spend</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cust) => {
                  const isPrimaryAdmin = cust.email.toLowerCase() === 'gb8585438@gmail.com';
                  const tier = getTier(cust.totalSpend);
                  const isActive = cust.isActive !== false;

                  return (
                    <tr key={cust.id} className="admin-table-row">
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0',
                              cust.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : 'bg-[#151D30] text-slate-300 border border-white/10'
                            )}
                          >
                            {(cust.fullName || 'U')[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                              <span>{cust.fullName || 'Unnamed'}</span>
                              {isPrimaryAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                                  PRIMARY ADMIN
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">{cust.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        {cust.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-300 tracking-wider">
                            <Shield className="w-3 h-3 text-amber-400" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 tracking-wider">
                            CUSTOMER
                          </span>
                        )}
                      </td>

                      {/* Email Verification Status */}
                      <td className="p-4">
                        {cust.emailVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                            <Clock className="w-4 h-4 text-amber-400" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Tier Status */}
                      <td className="p-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider border',
                          tier.label.includes('VIP')
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : tier.label === 'Collector'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-white/5 text-slate-300 border-white/10'
                        )}>
                          {tier.label}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="p-4 font-bold text-white">
                        {cust.ordersCount || 0} orders
                      </td>

                      {/* Lifetime Spend */}
                      <td className="p-4 font-extrabold text-amber-400 font-mono text-sm">
                        {formatPrice(cust.totalSpend || 0)}
                      </td>

                      {/* Account Status Toggle */}
                      <td className="p-4">
                        {isPrimaryAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20" title="Protected System Account">
                            <ShieldCheck className="w-4 h-4" />
                            Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(cust)}
                            disabled={updatingId === cust.id}
                            className={cn(
                              'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm',
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40'
                            )}
                            title={isActive ? 'Click to suspend user' : 'Click to activate user'}
                          >
                            <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-emerald-400' : 'bg-rose-400')} />
                            <span>{isActive ? 'Active' : 'Suspended'}</span>
                          </button>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="p-4 text-right text-slate-400 font-mono text-[11px]">
                        {formatDate(cust.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
