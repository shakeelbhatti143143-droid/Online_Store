'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
}) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'AI Assistant', href: '/admin/assistant', icon: Bot, isAi: true },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-40 bg-surface-300 border-r border-border-light flex flex-col justify-between transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand & Toggle */}
      <div>
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-amber-700 p-0.5 shrink-0 shadow-lg shadow-gold-500/20">
              <div className="w-full h-full bg-surface-300 rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-gold-400" />
              </div>
            </div>
            {!isCollapsed && (
              <span className="text-base font-bold tracking-wider text-white uppercase font-display whitespace-nowrap">
                LUXE<span className="text-gold-400 font-light ml-1">ADMIN</span>
              </span>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-100 transition-colors"
            aria-label="Toggle sidebar width"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? item.isAi
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg'
                      : 'bg-gold-500/15 text-gold-400 border border-gold-500/30 shadow-md shadow-gold-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-surface-100/80'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? (item.isAi ? 'text-cyan-400' : 'text-gold-400') : 'text-gray-400 group-hover:text-white'
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {!isCollapsed && item.isAi && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Storefront return link */}
      <div className="p-3 border-t border-border-subtle">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-surface-100 transition-colors'
          )}
        >
          <ExternalLink className="w-4 h-4 text-gold-400 shrink-0" />
          {!isCollapsed && <span className="truncate">View Live Storefront</span>}
        </Link>
      </div>
    </aside>
  );
};
