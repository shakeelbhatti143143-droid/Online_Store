'use client';

import React, { useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;

  // Mobile drawer controls
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Products',
      href: '/admin/products',
      icon: Package,
    },
    {
      label: 'Categories',
      href: '/admin/categories',
      icon: FolderTree,
    },
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
    },
    {
      label: 'Customers',
      href: '/admin/customers',
      icon: Users,
    },
    {
      label: 'Inventory',
      href: '/admin/inventory',
      icon: Boxes,
    },
    {
      label: 'Coupons',
      href: '/admin/coupons',
      icon: Tag,
    },
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      label: 'AI Assistant',
      href: '/admin/assistant',
      icon: Bot,
      isAi: true,
    },
    {
      label: 'Chatbots',
      href: '/admin/chatbots',
      icon: Bot,
    },
  ];

  // Close mobile drawer whenever user navigates
  useEffect(() => {
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  }, [pathname, setIsMobileOpen]);

  return (
    <>
      {/* =========================================
          MOBILE OVERLAY
          ========================================= */}
      <div
        className={cn(
          'fixed inset-0 z-[45] bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsMobileOpen?.(false)}
        aria-hidden="true"
      />

      {/* =========================================
          SIDEBAR
          ========================================= */}
      <aside
        className={cn(
          // Base
          'fixed top-0 left-0 bottom-0 z-[50]',
          'bg-surface-300 border-r border-border-light',
          'flex flex-col justify-between',
          'shadow-2xl',

          // Desktop
          'lg:translate-x-0',
          'transition-all duration-300 ease-in-out',

          // Desktop width
          isCollapsed ? 'lg:w-20' : 'lg:w-64',

          // Mobile drawer
          'w-[min(86vw,320px)]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',

          // Prevent mobile horizontal overflow
          'overflow-hidden'
        )}
      >
        {/* =========================================
            TOP SECTION
            ========================================= */}
        <div className="min-h-0 flex flex-col">
          {/* =========================================
              BRAND
              ========================================= */}
          <div
            className={cn(
              'h-20 sm:h-24',
              'px-4 sm:px-5',
              'border-b border-border-subtle',
              'flex items-center',
              'shrink-0',
              isCollapsed
                ? 'lg:justify-center'
                : 'justify-between'
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
              <div
                className="
                  w-10 h-10
                  sm:w-11 sm:h-11
                  rounded-xl
                  bg-gradient-to-br from-gold-400 to-amber-700
                  p-0.5
                  shrink-0
                  shadow-lg shadow-gold-500/20
                "
              >
                <div
                  className="
                    w-full h-full
                    bg-surface-300
                    rounded-[9px]
                    flex items-center justify-center
                  "
                >
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
              </div>

              {/* Brand text */}
              <span
                className={cn(
                  'text-lg sm:text-xl',
                  'font-bold tracking-wider',
                  'text-white uppercase font-display',
                  'whitespace-nowrap',
                  'transition-opacity duration-200',

                  // Hide when collapsed on desktop
                  isCollapsed && 'lg:hidden'
                )}
              >
                LUXE
                <span className="text-gold-400 font-light ml-1">
                  ADMIN
                </span>
              </span>
            </Link>

            {/* Desktop collapse button */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="
                hidden lg:flex
                p-2
                rounded-lg
                text-gray-400
                hover:text-white
                hover:bg-surface-100
                transition-colors
              "
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
              className="
                flex lg:hidden
                p-2.5
                rounded-xl
                text-gray-400
                hover:text-white
                hover:bg-white/10
                transition-colors
              "
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* =========================================
              NAVIGATION
              ========================================= */}
          <nav
            className="
              flex-1
              overflow-y-auto
              overflow-x-hidden
              p-3
              sm:p-4
              space-y-1.5
              scrollbar-thin
            "
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' &&
                  pathname.startsWith(`${item.href}/`));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen?.(false)}
                  className={cn(
                    // Base
                    'flex items-center',
                    'gap-3',
                    'px-3.5 py-3',
                    'min-h-[48px]',
                    'rounded-xl',
                    'text-sm',
                    'font-semibold',
                    'transition-all duration-200',
                    'group',

                    // Desktop collapsed
                    isCollapsed &&
                    'lg:justify-center lg:px-2',

                    // Active
                    isActive
                      ? item.isAi
                        ? `
                          bg-gradient-to-r
                          from-cyan-500/20
                          to-purple-500/20
                          text-cyan-300
                          border
                          border-cyan-500/40
                          shadow-lg
                        `
                        : `
                          bg-gold-500/15
                          text-gold-400
                          border
                          border-gold-500/30
                          shadow-md
                          shadow-gold-500/10
                        `
                      : `
                        text-gray-400
                        border border-transparent
                        hover:text-white
                        hover:bg-surface-100/80
                      `
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0',
                      'transition-transform duration-200',
                      'group-hover:scale-110',
                      isActive
                        ? item.isAi
                          ? 'text-cyan-400'
                          : 'text-gold-400'
                        : 'text-gray-400 group-hover:text-white'
                    )}
                  />

                  <span
                    className={cn(
                      'truncate',
                      isCollapsed && 'lg:hidden'
                    )}
                  >
                    {item.label}
                  </span>

                  {/* AI badge */}
                  {item.isAi && (
                    <span
                      className={cn(
                        'ml-auto',
                        'px-2 py-1',
                        'rounded-md',
                        'text-[9px]',
                        'font-bold',
                        'bg-cyan-500/20',
                        'text-cyan-300',
                        'border border-cyan-500/30',
                        'animate-pulse',
                        isCollapsed && 'lg:hidden'
                      )}
                    >
                      AI
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* =========================================
            STOREFRONT LINK
            ========================================= */}
        <div
          className="
            p-3
            sm:p-4
            border-t
            border-border-subtle
            shrink-0
          "
        >
          <Link
            href="/"
            onClick={() => setIsMobileOpen?.(false)}
            className={cn(
              'flex items-center',
              'gap-3',
              'px-3.5 py-3',
              'min-h-[48px]',
              'rounded-xl',
              'text-sm',
              'font-semibold',
              'text-gray-400',
              'border border-transparent',
              'hover:text-white',
              'hover:bg-surface-100',
              'transition-colors',

              isCollapsed &&
              'lg:justify-center lg:px-2'
            )}
          >
            <ExternalLink className="w-5 h-5 text-gold-400 shrink-0" />

            <span
              className={cn(
                'truncate',
                isCollapsed && 'lg:hidden'
              )}
            >
              View Live Storefront
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
};