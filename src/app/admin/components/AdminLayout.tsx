import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const adminNav = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'Knowledge', href: '/admin/knowledge' },
  { name: 'Appearance', href: '/admin/appearance' },
  { name: 'Domains', href: '/admin/domains' },
  { name: 'Playground', href: '/admin/playground' },
  { name: 'Conversations', href: '/admin/conversations' },
  { name: 'Analytics', href: '/admin/analytics' },
  { name: 'Integrations', href: '/admin/integrations' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-100">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-200 border-r border-border-light p-4 hidden md:block">
        <nav className="space-y-2">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={cn('block rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-surface-300 hover:text-white')}>{item.name}</a>
            </Link>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
