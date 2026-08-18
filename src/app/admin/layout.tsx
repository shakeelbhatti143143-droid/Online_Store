'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AIAdminWidget } from '@/components/admin/AIAdminWidget';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background text-gray-100 flex items-center justify-center">
        <div className="text-xs text-gray-400">Verifying admin session...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col antialiased">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Fixed Admin Header */}
      <AdminHeader isCollapsed={isCollapsed} onOpenAi={() => setIsAiOpen(true)} />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 pt-20 p-6 sm:p-8 lg:p-10 ${isCollapsed ? 'ml-20' : 'ml-64'
          }`}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Floating Global AI Assistant */}
      <AIAdminWidget isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}