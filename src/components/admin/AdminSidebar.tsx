'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Boxes,
  Tag,
  BarChart3,
  Bot,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;

  // Mobile drawer controls
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isAi?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupTitle: 'Core',
    items: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    groupTitle: 'Catalog & Sales',
    items: [
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
      { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    ],
  },
  {
    groupTitle: 'Intelligence',
    items: [
      { label: 'AI Assistant', href: '/admin/assistant', icon: Bot, isAi: true },
      { label: 'Chatbots', href: '/admin/chatbots', icon: Bot },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const pathname = usePathname();
  const [adminInfo, setAdminInfo] = useState<{ email?: string; fullName?: string; role?: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.admin) {
          setAdminInfo(data.admin);
        }
      })
      .catch(() => {});
  }, []);

  // Close mobile drawer whenever user navigates
  useEffect(() => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [pathname, setIsMobileOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    window.location.href = '/login';
  };

  const adminEmail = adminInfo?.email || 'gb8585438@gmail.com';
  const adminName = adminInfo?.fullName || 'Store Director';

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[45] bg-black/80 backdrop-blur-md transition-opacity duration-300 lg:hidden',
          isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsMobileOpen?.(false)}
        aria-hidden="true"
      />

      {/* Sidebar Aside */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-[50]',
          'bg-[#090D17] text-slate-100 border-r border-white/10',
          'flex flex-col justify-between shadow-2xl',
          'lg:translate-x-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-[min(86vw,320px)]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'overflow-hidden'
        )}
      >
        {/* Top Header & Navigation */}
        <div className="min-h-0 flex flex-col flex-1">
          {/* Brand Header */}
          <div
            className={cn(
              'h-20 sm:h-24 px-4 sm:px-5 border-b border-white/10 flex items-center shrink-0 bg-[#0B101E]',
              isCollapsed ? 'lg:justify-center' : 'justify-between'
            )}
          >
            <Link
              href="/admin"
              onClick={() => setIsMobileOpen?.(false)}
              className={cn(
                'flex items-center gap-3 overflow-hidden',
                isCollapsed && 'lg:justify-center'
              )}
            >
              {/* Logo */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shrink-0 shadow-lg shadow-amber-500/25">
                <div className="w-full h-full bg-[#090D17] rounded-[9px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              {/* Brand text */}
              <span
                className={cn(
                  'text-lg sm:text-xl font-extrabold tracking-wider text-white uppercase font-display whitespace-nowrap transition-opacity duration-200',
                  isCollapsed && 'lg:hidden'
                )}
              >
                LUXE
                <span className="text-amber-400 font-light ml-1.5">ADMIN</span>
              </span>
            </Link>

            {/* Desktop collapse button */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle sidebar width"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen?.(false)}
              className="flex lg:hidden p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-4 scrollbar-thin">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1.5">
                <p
                  className={cn(
                    'text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1',
                    isCollapsed && 'lg:hidden'
                  )}
                >
                  {group.groupTitle}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen?.(false)}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative',
                          isCollapsed && 'lg:justify-center lg:px-2',
                          isActive
                            ? item.isAi
                              ? 'bg-gradient-to-r from-cyan-500/25 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                              : 'bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-transparent text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/15'
                            : 'text-slate-300 border border-transparent hover:text-white hover:bg-white/[0.06]'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                            isActive
                              ? item.isAi
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                              : 'text-slate-400 group-hover:text-white'
                          )}
                        />

                        <span className={cn('truncate', isCollapsed && 'lg:hidden')}>
                          {item.label}
                        </span>

                        {item.isAi && (
                          <span
                            className={cn(
                              'ml-auto px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse',
                              isCollapsed && 'lg:hidden'
                            )}
                          >
                            AI
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: Storefront Link & Admin Profile */}
        <div className="p-3 sm:p-4 border-t border-white/10 shrink-0 space-y-2 bg-[#080C15]">
          {/* Storefront Link */}
          <Link
            href="/"
            onClick={() => setIsMobileOpen?.(false)}
            title={isCollapsed ? 'View Live Storefront' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-transparent hover:text-white hover:bg-white/5 transition-colors',
              isCollapsed && 'lg:justify-center lg:px-2'
            )}
          >
            <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
            <span className={cn('truncate', isCollapsed && 'lg:hidden')}>
              Live Storefront
            </span>
          </Link>

          {/* Administrator Identity Card */}
          <div
            className={cn(
              'p-2.5 rounded-2xl bg-[#0D1424] border border-white/10 shadow-lg',
              isCollapsed ? 'lg:p-2 lg:flex lg:flex-col lg:items-center' : 'flex items-center justify-between'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-2.5 overflow-hidden',
                isCollapsed && 'lg:justify-center'
              )}
            >
              <div
                className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs shrink-0 shadow-sm"
                title={adminEmail}
              >
                {adminName[0] || 'A'}
              </div>

              <div className={cn('min-w-0 flex-1', isCollapsed && 'lg:hidden')}>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-extrabold text-white truncate leading-none">
                    {adminName}
                  </p>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 truncate leading-none mt-1 font-mono" title={adminEmail}>
                  {adminEmail}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={cn(
                'p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0',
                isCollapsed && 'lg:mt-2'
              )}
              title="Log out of admin session"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};