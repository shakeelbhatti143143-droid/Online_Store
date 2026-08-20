'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  RefreshCw,
  Database,
  Zap,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  User,
  X,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { StoreNotification } from '@/types';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { redisCache } from '@/lib/cache/redis';
import { formatDate } from '@/lib/utils';

export interface AdminHeaderProps {
  isCollapsed: boolean;
  onOpenAi?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ isCollapsed, onOpenAi }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ fullName?: string; email?: string } | null>(null);

  useEffect(() => {
    storeDb.getNotifications().then((n) => setNotifications(n));
    // Load real admin info from the authenticated session
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.admin) {
          setAdminInfo(data.admin);
        }
      })
      .catch(() => { });
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
        message: 'All product, category, and analytics caches invalidated.',
      });
    }, 600);
  };

  const handleMarkAsRead = (id: string) => {
    storeDb.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-surface-300/80 backdrop-blur-xl border-b border-border-light flex items-center justify-between px-6 transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'
        }`}
    >
      {/* Left: Health & Status Pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Redis Caching: Active</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-bold text-cyan-400">
          <Database className="w-3 h-3" />
          <span>MongoDB Atlas: Connected</span>
        </div>
      </div>

      {/* Right: Actions, AI Trigger, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Purge Cache Button */}
        <button
          onClick={handlePurgeCache}
          disabled={isPurging}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border-light text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          title="Invalidate all Redis and in-memory caches"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin text-gold-400' : ''}`} />
          <span>Purge Cache</span>
        </button>

        {/* AI Assistant Quick Trigger */}


        {/* Notifications Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-surface-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gold-500 text-black text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass-panel bg-surface-200 border border-border-light shadow-2xl p-4 z-50 space-y-3"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gold-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Store Activity Alerts
                    </h4>
                  </div>
                  <span className="text-[10px] text-gray-400">{unreadCount} unread</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">No recent activity.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${notif.isRead
                          ? 'bg-surface-100/40 border-white/5 opacity-70'
                          : 'bg-surface-100 border-gold-500/30'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-white text-xs">{notif.title}</h5>
                          <span className="text-[10px] text-gray-500">{formatDate(notif.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-gray-300 mt-1">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold text-xs">
            {(adminInfo?.fullName || user?.fullName || 'A')[0]}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-white leading-none">{adminInfo?.fullName || user?.fullName || 'Administrator'}</p>
            <p className="text-[10px] text-gold-400 leading-none mt-1">Store Director</p>
          </div>
        </div>
      </div>
    </header>
  );
};
