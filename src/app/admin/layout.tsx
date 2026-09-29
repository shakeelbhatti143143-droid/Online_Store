'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AIAdminWidget } from '@/components/admin/AIAdminWidget';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();

        if (data.authenticated) {
          setIsAuthorized(true);
        } else {
          router.replace('/login?redirect=/admin');
        }
      } catch {
        router.replace('/login?redirect=/admin');
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminSession();
  }, [router]);

  // Prevent background page scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#070B12] text-gray-100 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 p-0.5 animate-pulse shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-[#0D1322] rounded-[14px] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            </div>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold tracking-wider text-white uppercase font-display">Luxe Atelier</p>
          <p className="text-xs text-amber-400/80 font-mono">Verifying Server Authority...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="admin-shell min-h-screen flex flex-col antialiased overflow-x-hidden">
      {/* =========================================
          ADMIN SIDEBAR
          ========================================= */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* =========================================
          ADMIN HEADER
          ========================================= */}
      <AdminHeader
        isCollapsed={isCollapsed}
        onOpenAi={() => setIsAiOpen(true)}
      />

      {/* =========================================
          MOBILE MENU BUTTON
          ========================================= */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="
          fixed
          top-4
          left-4
          z-[60]

          lg:hidden

          w-11
          h-11

          flex
          items-center
          justify-center

          rounded-xl

          bg-[#0D1322]/95
          backdrop-blur-xl

          border
          border-white/10

          text-gray-200

          shadow-xl
          shadow-black/50

          hover:bg-[#131B30]
          hover:text-white

          active:scale-95

          transition-all
          duration-200
        "
        aria-label="Open admin navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main
        className={cn(
          'flex-1 min-w-0 pt-20 px-4 sm:px-6 lg:px-8 xl:px-10 pb-8 transition-all duration-300 ml-0',
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        <div
          className="
            w-full
            max-w-7xl
            mx-auto
            min-w-0
          "
        >
          {children}
        </div>
      </main>

      {/* =========================================
          FLOATING GLOBAL AI ASSISTANT
          ========================================= */}

    </div>
  );
}