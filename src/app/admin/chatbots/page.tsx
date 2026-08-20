'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Bot,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Copy,
    Trash2,
    BarChart3,
    MessageCircle,
    Settings,
    Globe,
    TestTube,
    Eye,
} from 'lucide-react';

function timeAgo(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return diffMins + 'm ago';
    if (diffHours < 24) return diffHours + 'h ago';
    if (diffDays < 7) return diffDays + 'd ago';

    return d.toLocaleDateString();
}

interface Chatbot {
    _id: string;
    publicId: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    aiProvider: string;
    aiModel: string;
    conversationCount: number;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
}

export default function ChatbotsPage() {
    const router = useRouter();

    const [chatbots, setChatbots] = useState<Chatbot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Dropdown state
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

    const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
    }>({
        top: 0,
        left: 0,
    });

    useEffect(() => {
        fetchChatbots();
    }, []);

    // Close dropdown when clicking anywhere outside
    useEffect(() => {
        const handleClickOutside = () => {
            setDropdownOpen(null);
        };

        if (dropdownOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [dropdownOpen]);

    const fetchChatbots = async () => {
        try {
            setError('');

            const res = await fetch('/api/admin/chatbots');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load chatbots.');
            }

            setChatbots(data.chatbots || []);
        } catch (error) {
            console.error('Failed to fetch chatbots:', error);

            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load chatbots.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDropdownToggle = (
        event: React.MouseEvent<HTMLButtonElement>,
        chatbotId: string
    ) => {
        event.stopPropagation();

        if (dropdownOpen === chatbotId) {
            setDropdownOpen(null);
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const menuWidth = 224;
        const menuHeight = 430;
        const spacing = 8;
        const viewportPadding = 8;

        let left = rect.right - menuWidth;
        let top = rect.bottom + spacing;

        // Prevent dropdown from going outside right edge
        if (left < viewportPadding) {
            left = viewportPadding;
        }

        if (left + menuWidth > window.innerWidth - viewportPadding) {
            left = window.innerWidth - menuWidth - viewportPadding;
        }

        // Open upward if there is not enough space below
        if (top + menuHeight > window.innerHeight - viewportPadding) {
            top = rect.top - menuHeight - spacing;
        }

        // Prevent dropdown from going above viewport
        if (top < viewportPadding) {
            top = viewportPadding;
        }

        setDropdownPosition({
            top,
            left,
        });

        setDropdownOpen(chatbotId);
    };

    const handleDelete = async (id: string, name: string) => {
        if (
            !confirm(
                `Delete "${name}"?\n\nThis will permanently delete:\n- chatbot configuration\n- conversations\n- analytics\n- knowledge associations`
            )
        ) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/chatbots/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setChatbots((currentChatbots) =>
                    currentChatbots.filter((c) => c._id !== id)
                );
            }
        } catch (error) {
            console.error('Failed to delete chatbot:', error);
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            setError('');

            const res = await fetch(`/api/admin/chatbots/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'duplicate',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error || 'Failed to duplicate chatbot.'
                );
            }

            router.push(`/admin/chatbots/${data.chatbot.id}`);
        } catch (error) {
            console.error('Failed to duplicate chatbot:', error);

            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to duplicate chatbot.'
            );
        }
    };

    const handleToggleStatus = async (
        id: string,
        currentStatus: string
    ) => {
        try {
            const res = await fetch(`/api/admin/chatbots/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status:
                        currentStatus === 'active'
                            ? 'inactive'
                            : 'active',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error || 'Failed to update chatbot status.'
                );
            }

            setChatbots((currentChatbots) =>
                currentChatbots.map((c) =>
                    c._id === id
                        ? {
                            ...c,
                            status: data.chatbot.status,
                        }
                        : c
                )
            );
        } catch (error) {
            console.error('Failed to update status:', error);

            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to update chatbot status.'
            );
        }
    };

    const filteredChatbots = chatbots.filter(
        (c) =>
            c.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            c.publicId
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-surface-300 rounded w-1/4"></div>

                    <div className="h-12 bg-surface-300 rounded"></div>

                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="h-16 bg-surface-300 rounded"
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Chatbots
                    </h1>

                    <p className="text-sm text-gray-400 mt-1">
                        Create and manage your AI chatbots
                    </p>
                </div>

                <Link
                    href="/admin/chatbots/create"
                    className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Chatbot
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                    type="text"
                    placeholder="Search chatbots..."
                    value={searchTerm}
                    onChange={(e) =>
                        setSearchTerm(e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 bg-surface-300 border border-border-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
            </div>

            {/* Error */}
            {error && (
                <div
                    role="alert"
                    className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
                >
                    {error}
                </div>
            )}

            {/* Empty State */}
            {filteredChatbots.length === 0 ? (
                <div className="text-center py-12 bg-surface-300 rounded-lg">
                    <Bot className="w-12 h-12 text-gray-500 mx-auto mb-3" />

                    <p className="text-gray-400">
                        No chatbots found.
                    </p>

                    <Link
                        href="/admin/chatbots/create"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create your first chatbot
                    </Link>
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-light">
                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        Chatbot
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        ID
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        Status
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        AI Model
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        Conversations
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        Messages
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        Created
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">
                                        Updated
                                    </th>

                                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredChatbots.map((chatbot) => (
                                    <tr
                                        key={chatbot._id}
                                        className="border-b border-border-subtle hover:bg-surface-300/50 transition-colors"
                                    >
                                        {/* Chatbot */}
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-surface-300 flex items-center justify-center">
                                                    <Bot className="w-4 h-4 text-gold-400" />
                                                </div>

                                                <div>
                                                    <div className="font-medium text-white">
                                                        {chatbot.name}
                                                    </div>

                                                    {chatbot.description && (
                                                        <div className="text-xs text-gray-500 truncate max-w-xs">
                                                            {
                                                                chatbot.description
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* ID */}
                                        <td className="py-3 text-sm text-gray-400 font-mono">
                                            {chatbot.publicId}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs rounded-full ${chatbot.status ===
                                                    'active'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                                    }`}
                                            >
                                                {chatbot.status}
                                            </span>
                                        </td>

                                        {/* AI Model */}
                                        <td className="py-3 text-sm text-gray-400">
                                            {chatbot.aiProvider} /{' '}
                                            {chatbot.aiModel}
                                        </td>

                                        {/* Conversations */}
                                        <td className="py-3 text-sm text-gray-400">
                                            {
                                                chatbot.conversationCount
                                            }
                                        </td>

                                        {/* Messages */}
                                        <td className="py-3 text-sm text-gray-400">
                                            {chatbot.messageCount}
                                        </td>

                                        {/* Created */}
                                        <td className="py-3 text-sm text-gray-400">
                                            {timeAgo(
                                                chatbot.createdAt
                                            )}
                                        </td>

                                        {/* Updated */}
                                        <td className="py-3 text-sm text-gray-400">
                                            {timeAgo(
                                                chatbot.updatedAt
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    handleDropdownToggle(
                                                        event,
                                                        chatbot._id
                                                    )
                                                }
                                                className="p-1 text-gray-400 hover:text-white hover:bg-surface-300 rounded"
                                                aria-label={`Actions for ${chatbot.name}`}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Fixed Dropdown Overlay */}
                    {dropdownOpen && (
                        <div
                            className="fixed z-[9999] w-56 bg-surface-300 border border-border-light rounded-lg shadow-2xl overflow-hidden"
                            style={{
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`,
                            }}
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >
                            {(() => {
                                const chatbot = chatbots.find(
                                    (c) => c._id === dropdownOpen
                                );

                                if (!chatbot) return null;

                                return (
                                    <>
                                        {/* Edit */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </Link>

                                        {/* Duplicate */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDropdownOpen(null);
                                                handleDuplicate(
                                                    chatbot._id
                                                );
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100 text-left"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Duplicate
                                        </button>

                                        {/* Activate / Deactivate */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDropdownOpen(null);
                                                handleToggleStatus(
                                                    chatbot._id,
                                                    chatbot.status
                                                );
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100 text-left"
                                        >
                                            <Eye className="w-4 h-4" />

                                            {chatbot.status ===
                                                'active'
                                                ? 'Deactivate'
                                                : 'Activate'}
                                        </button>

                                        {/* Test */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}/test`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <TestTube className="w-4 h-4" />
                                            Test
                                        </Link>

                                        {/* Knowledge Base */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}/knowledge`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Knowledge Base
                                        </Link>

                                        {/* Appearance */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}/appearance`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Appearance
                                        </Link>

                                        {/* Domains */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}/domains`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Domains
                                        </Link>

                                        {/* Conversations */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}/conversations`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Conversations
                                        </Link>

                                        {/* Analytics */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}/analytics`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                            Analytics
                                        </Link>

                                        {/* Integration */}
                                        <Link
                                            href={`/admin/chatbots/${chatbot._id}/integrate`}
                                            onClick={() =>
                                                setDropdownOpen(null)
                                            }
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-100"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Integration
                                        </Link>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDropdownOpen(null);
                                                handleDelete(
                                                    chatbot._id,
                                                    chatbot.name
                                                );
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 text-left"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}