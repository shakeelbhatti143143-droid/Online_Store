'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  RefreshCw,
  Database,
  ExternalLink,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { StoreNotification } from '@/types';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { redisCache } from '@/lib/cache/redis';
import { formatDate, cn } from '@/lib/utils';

export interface AdminHeaderProps {
  isCollapsed: boolean;
  onOpenAi?: () => void;
}

const sectionTitles: Record<string, { group: string; title: string }> = {
  '/admin': { group: 'Executive', title: 'Command Center' },
  '/admin/analytics': { group: 'Executive', title: 'Performance Analytics' },
  '/admin/products': { group: 'Catalog', title: 'Product Inventory' },
  '/admin/categories': { group: 'Catalog', title: 'Collection Taxonomy' },
  '/admin/orders': { group: 'Sales', title: 'Dispatch & Orders' },
  '/admin/customers': { group: 'Management', title: 'Collector Directory' },
  '/admin/inventory': { group: 'Stock', title: 'Inventory Levels' },
  '/admin/coupons': { group: 'Marketing', title: 'Promotions & Vouchers' },
  '/admin/assistant': { group: 'Intelligence', title: 'AI Copilot' },
  '/admin/chatbots': { group: 'Intelligence', title: 'Storefront Bots' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({ isCollapsed }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ fullName?: string; email?: string; role?: string } | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storeDb.getNotifications().then((n) => setNotifications(n)).catch(() => {});
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.admin) {
          setAdminInfo(data.admin);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handlePurgeCache = async () => {
    setIsPurging(true);
    await redisCache.invalidateAll();
    setTimeout(() => {
      setIsPurging(false);
      showToast({
        type: 'success',
        title: 'Redis Cache Purged',
        message: 'All catalog, product, and analytics caches invalidated.',
      });
    }, 600);
  };

  const handleMarkAsRead = (id: string) => {
    storeDb.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    window.location.href = '/login';
  };

  const currentSection = sectionTitles[pathname] || {
    group: 'Admin',
    title: pathname.replace('/admin/', '').replace(/^\w/, (c) => c.toUpperCase()) || 'Overview',
  };

  const adminEmail = adminInfo?.email || 'gb8585438@gmail.com';
  const adminName = adminInfo?.fullName || user?.fullName || 'Store Director';

  return (
    <header
      className={cn(
        'admin-glass-header fixed top-0 right-0 z-30 h-16 bg-[#090D17]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 sm:px-6 transition-all duration-300',
        isCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-64'
      )}
    >
      {/* Left: Dynamic Breadcrumb & Status */}
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
            {currentSection.group}
          </span>
          <span className="text-slate-600 font-bold">/</span>
          <span className="text-white font-extrabold tracking-tight text-sm">
            {currentSection.title}
          </span>
        </div>

        <div className="hidden xl:flex items-center gap-2 pl-3 ml-2 border-l border-white/10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Atlas: Live</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-extrabold text-cyan-300">
            <Database className="w-3 h-3" />
            <span>Cache: Sync</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Purge Cache Button */}
        <button
          onClick={handlePurgeCache}
          disabled={isPurging}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors"
          title="Invalidate all Redis and in-memory caches"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isPurging && 'animate-spin text-amber-400')} />
          <span>Purge Cache</span>
        </button>

        {/* Notifications Drawer */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="admin-panel absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0B101E] border border-white/15 shadow-2xl p-4 z-50 space-y-3"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Store Activity Alerts
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">{unreadCount} unread</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6 font-medium">No recent alerts.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={cn(
                          'p-3 rounded-xl border text-xs cursor-pointer transition-colors',
                          notif.isRead
                            ? 'bg-slate-900/60 border-white/5 opacity-70'
                            : 'bg-slate-800/90 border-amber-500/40 shadow-sm'
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-bold text-white text-xs">{notif.title}</h5>
                          <span className="text-[10px] text-slate-400 shrink-0">{formatDate(notif.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 font-medium">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative pl-2 border-l border-white/10" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Admin account menu"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs shadow-sm">
              {adminName[0] || 'A'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-extrabold text-white leading-none">{adminName}</p>
              <p className="text-[10px] text-amber-400 font-semibold leading-none mt-1">Super Admin</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="admin-panel absolute right-0 mt-3 w-64 rounded-2xl bg-[#0B101E] border border-white/15 shadow-2xl p-4 z-50 space-y-3 text-xs"
              >
                {/* Account Details Header */}
                <div className="pb-3 border-b border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-sm truncate">{adminName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[9px] font-extrabold text-amber-300">
                      SUPER ADMIN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate" title={adminEmail}>
                    {adminEmail}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Email Verified & Authenticated</span>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-1">
                  <Link
                    href="/"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-semibold"
                  >
                    <span>View Storefront</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </Link>
                  <Link
                    href="/admin/analytics"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-semibold"
                  >
                    <span>Store Metrics</span>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </Link>
                </div>

                {/* Sign Out Action */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-bold"
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
