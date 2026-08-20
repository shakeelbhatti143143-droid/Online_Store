'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Settings,
    Globe,
    Palette,
    Shield,
    TestTube,
    MessageSquare,
    BarChart2,
    Code,
    Bot,
} from 'lucide-react';

interface ChatbotTabsProps {
    chatbotId: string;
    publicId?: string;
    chatbotName?: string;
    status?: 'active' | 'inactive';
}

export default function ChatbotTabs({
    chatbotId,
    publicId,
    chatbotName,
    status,
}: ChatbotTabsProps) {
    const pathname = usePathname();

    const tabs = [
        {
            name: 'General & AI Config',
            href: `/admin/chatbots/${chatbotId}`,
            icon: Settings,
            exact: true,
        },
        {
            name: 'Knowledge Base',
            href: `/admin/chatbots/${chatbotId}/knowledge`,
            icon: Globe,
        },
        {
            name: 'Appearance',
            href: `/admin/chatbots/${chatbotId}/appearance`,
            icon: Palette,
        },
        {
            name: 'Allowed Domains',
            href: `/admin/chatbots/${chatbotId}/domains`,
            icon: Shield,
        },
        {
            name: 'Test Studio',
            href: `/admin/chatbots/${chatbotId}/test`,
            icon: TestTube,
        },
        {
            name: 'Conversations',
            href: `/admin/chatbots/${chatbotId}/conversations`,
            icon: MessageSquare,
        },
        {
            name: 'Analytics',
            href: `/admin/chatbots/${chatbotId}/analytics`,
            icon: BarChart2,
        },
        {
            name: 'Integrate',
            href: `/admin/chatbots/${chatbotId}/integrate`,
            icon: Code,
        },
    ];

    return (
        <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-light">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-white">
                                {chatbotName || 'Chatbot Configuration'}
                            </h1>
                            {status && (
                                <span
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                        status === 'active'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                    }`}
                                >
                                    {status.toUpperCase()}
                                </span>
                            )}
                        </div>
                        {publicId && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                                Public ID: <span className="text-gold-400 font-semibold">{publicId}</span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/chatbots"
                        className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-surface-300 hover:bg-surface-100 border border-border-light rounded-lg transition-colors"
                    >
                        ← Back to Chatbots
                    </Link>
                    <Link
                        href={`/admin/chatbots/${chatbotId}/test`}
                        className="px-3 py-1.5 text-xs font-semibold text-black bg-gold-500 hover:bg-gold-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <TestTube className="w-3.5 h-3.5" />
                        Test Chatbot
                    </Link>
                </div>
            </div>

            {/* Sub-navigation tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pt-3 border-b border-border-subtle scrollbar-thin">
                {tabs.map((tab) => {
                    const isActive = tab.exact
                        ? pathname === tab.href
                        : pathname.startsWith(tab.href);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                                isActive
                                    ? 'border-gold-500 text-gold-400 bg-surface-300/60 font-semibold'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-surface-300/30'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
