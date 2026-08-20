'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatbotTabs from './ChatbotTabs';
import {
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';

interface ChatbotData {
    _id: string;
    publicId: string;
    name: string;
    description: string;
    internalIdentifier: string;
    status: 'active' | 'inactive';
    aiConfig: {
        provider: string;
        model: string;
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
        welcomeMessage: string;
        fallbackMessage: string;
    };
    appearance: {
        title?: string;
        primaryColor?: string;
        position?: string;
    };
}

export default function ChatbotGeneralPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [chatbot, setChatbot] = useState<ChatbotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (id) fetchChatbot();
    }, [id]);

    async function fetchChatbot() {
        try {
            setLoading(true);
            setError('');

            const res = await fetch(
                `/api/admin/chatbots/${id}`
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    'Failed to load chatbot.'
                );
            }

            setChatbot(data.chatbot);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load chatbot.'
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(
        e: React.FormEvent
    ) {
        e.preventDefault();

        if (!chatbot) return;

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const res = await fetch(
                `/api/admin/chatbots/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json',
                    },
                    body: JSON.stringify({
                        name: chatbot.name,
                        description:
                            chatbot.description,
                        internalIdentifier:
                            chatbot.internalIdentifier,
                        status: chatbot.status,
                        aiConfig:
                            chatbot.aiConfig,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    'Failed to save chatbot settings.'
                );
            }

            setChatbot((prev) =>
                prev
                    ? {
                        ...prev,
                        ...data.chatbot,
                    }
                    : prev
            );

            setSuccess(
                'Chatbot settings saved successfully!'
            );

            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to save chatbot settings.'
            );
        } finally {
            setSaving(false);
        }
    }

    // The customer chatbot only supports Google Gemini.
    // This keeps the UI locked to Gemini and prevents accidental
    // OpenAI provider/model configuration for customer chatbots.
    function handleProviderChange(
        provider: string
    ) {
        if (!chatbot) return;

        setChatbot({
            ...chatbot,
            aiConfig: {
                ...chatbot.aiConfig,
                provider: 'gemini',
                model: 'gemini-3.1-flash-lite',
            },
        });
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-surface-300 rounded w-1/3"></div>

                    <div className="h-64 bg-surface-300 rounded"></div>
                </div>
            </div>
        );
    }

    if (!chatbot) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-300">
                    <AlertCircle className="w-6 h-6 mb-2" />

                    <p className="font-semibold">
                        {error ||
                            'Chatbot not found.'}
                    </p>
                </div>
            </div>
        );
    }

    const currentProvider =
        chatbot.aiConfig?.provider || 'gemini';

    const currentModel =
        chatbot.aiConfig?.model ||
        'gemini-3.1-flash-lite';

    return (
        <div className="p-6 max-w-6xl">
            <ChatbotTabs
                chatbotId={id}
                publicId={chatbot.publicId}
                chatbotName={chatbot.name}
                status={chatbot.status}
            />

            {error && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />

                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />

                    <span>{success}</span>
                </div>
            )}

            <form
                onSubmit={handleSave}
                className="space-y-6"
            >
                {/* Basic Information */}
                <div className="rounded-xl border border-border-light bg-surface-300 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-gold-400" />

                        <h2 className="text-lg font-semibold text-white">
                            Basic Information
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Chatbot Name *
                            </label>

                            <input
                                type="text"
                                required
                                value={chatbot.name}
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                                placeholder="e.g., Customer Support Bot"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Internal Identifier / Slug
                            </label>

                            <input
                                type="text"
                                value={
                                    chatbot.internalIdentifier ||
                                    ''
                                }
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        internalIdentifier:
                                            e.target.value,
                                    })
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                                placeholder="e.g., customer-support-main"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Description
                            </label>

                            <textarea
                                rows={2}
                                value={
                                    chatbot.description ||
                                    ''
                                }
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        description:
                                            e.target.value,
                                    })
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                                placeholder="Internal notes or description for this chatbot..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Status
                            </label>

                            <select
                                value={chatbot.status}
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        status:
                                            e.target.value as
                                            | 'active'
                                            | 'inactive',
                                    })
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                            >
                                <option value="active">
                                    Active (Available for embed & responses)
                                </option>

                                <option value="inactive">
                                    Inactive (Disabled)
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* AI Configuration */}
                <div className="rounded-xl border border-border-light bg-surface-300 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-5 h-5 text-gold-400" />

                        <h2 className="text-lg font-semibold text-white">
                            AI Engine Configuration
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                        {/* Provider */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                AI Provider
                            </label>

                            <select
                                value={currentProvider}
                                onChange={(e) =>
                                    handleProviderChange(
                                        e.target.value
                                    )
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                            >
                                <option value="gemini">
                                    Google Gemini
                                </option>
                            </select>
                        </div>

                        {/* Model */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                AI Model
                            </label>

                            <select
                                value={currentModel}
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        aiConfig: {
                                            ...chatbot.aiConfig,
                                            model: e.target.value,
                                        },
                                    })
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                            >
                                <option value="gemini-3.1-flash-lite">
                                    Gemini 3.1 Flash-Lite
                                </option>
                            </select>
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Temperature (
                                {chatbot.aiConfig?.temperature ??
                                    0.7}
                                )
                            </label>

                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={
                                    chatbot.aiConfig
                                        ?.temperature ?? 0.7
                                }
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        aiConfig: {
                                            ...chatbot.aiConfig,
                                            temperature:
                                                parseFloat(
                                                    e.target.value
                                                ),
                                        },
                                    })
                                }
                                className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-gold-500 mt-2"
                            />

                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>
                                    0 (Precise)
                                </span>

                                <span>
                                    1 (Creative)
                                </span>
                            </div>
                        </div>

                        {/* Max Tokens */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                Max Tokens
                            </label>

                            <input
                                type="number"
                                min="50"
                                max="4000"
                                step="50"
                                value={
                                    chatbot.aiConfig
                                        ?.maxTokens ?? 500
                                }
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        aiConfig: {
                                            ...chatbot.aiConfig,
                                            maxTokens:
                                                parseInt(
                                                    e.target.value
                                                ) || 500,
                                        },
                                    })
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                            />
                        </div>
                    </div>

                    {/* Gemini Information */}
                    {currentProvider ===
                        'gemini' && (
                            <div className="mb-5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />

                                    <div>
                                        <p className="text-sm font-semibold text-blue-300">
                                            Google Gemini
                                        </p>

                                        <p className="text-xs text-blue-200/70 mt-1">
                                            This chatbot will use
                                            Gemini 3.1 Flash-Lite
                                            through your server-side
                                            Gemini API key.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    <div className="space-y-5">
                        {/* System Prompt */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-gray-300">
                                    System Prompt / Instructions *
                                </label>

                                <span className="text-[11px] text-gray-500">
                                    Defines AI behavior, persona, and knowledge bounds.
                                </span>
                            </div>

                            <textarea
                                required
                                rows={7}
                                value={
                                    chatbot.aiConfig
                                        ?.systemPrompt ||
                                    ''
                                }
                                onChange={(e) =>
                                    setChatbot({
                                        ...chatbot,
                                        aiConfig: {
                                            ...chatbot.aiConfig,
                                            systemPrompt:
                                                e.target.value,
                                        },
                                    })
                                }
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50 leading-relaxed"
                                placeholder="You are a helpful customer support assistant for {{company_name}}..."
                            />
                        </div>

                        {/* Welcome + Fallback */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Welcome Message
                                </label>

                                <textarea
                                    rows={3}
                                    value={
                                        chatbot.aiConfig
                                            ?.welcomeMessage ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        setChatbot({
                                            ...chatbot,
                                            aiConfig: {
                                                ...chatbot.aiConfig,
                                                welcomeMessage:
                                                    e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                                    placeholder="Hello! How can I help you today?"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                                    Fallback Message (when information is missing)
                                </label>

                                <textarea
                                    rows={3}
                                    value={
                                        chatbot.aiConfig
                                            ?.fallbackMessage ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        setChatbot({
                                            ...chatbot,
                                            aiConfig: {
                                                ...chatbot.aiConfig,
                                                fallbackMessage:
                                                    e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                                    placeholder="I'm sorry, I don't have enough information to answer that question. Please contact our support team."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={fetchChatbot}
                        className="px-4 py-2.5 text-xs font-medium text-gray-300 hover:text-white bg-surface-300 hover:bg-surface-100 border border-border-light rounded-lg transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />

                        Reset Changes
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 text-xs font-semibold text-black bg-gold-500 hover:bg-gold-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
                    >
                        <Save className="w-3.5 h-3.5" />

                        {saving
                            ? 'Saving...'
                            : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
