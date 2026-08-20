'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';

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
          router.replace('/');
        }
      } catch {
        router.replace('/');
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
      <div className="min-h-screen bg-background text-gray-100 flex items-center justify-center">
        <div className="text-xs text-gray-400">
          Verifying admin session...
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div
      className="
        min-h-screen
        bg-background
        text-gray-100
        flex
        flex-col
        antialiased
        overflow-x-hidden
      "
    >
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

          bg-surface-300/95
          backdrop-blur-xl

          border
          border-white/10

          text-gray-200

          shadow-xl
          shadow-black/30

          hover:bg-surface-100
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
        className="
          flex-1
          min-w-0

          pt-20

          px-4
          sm:px-6
          lg:px-8
          xl:px-10

          pb-8

          transition-all
          duration-300

          ml-0
          lg:ml-64
        "
        style={{
          marginLeft: undefined,
        }}
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