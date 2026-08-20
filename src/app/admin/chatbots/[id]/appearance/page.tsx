'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ChatbotTabs from '../ChatbotTabs';
import {
    Palette,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Eye,
    MessageSquare,
    Sparkles,
    Send,
    Bot,
} from 'lucide-react';

interface AppearanceSettings {
    title: string;
    subtitle: string;
    logoUrl: string;
    avatarUrl: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    userMessageColor: string;
    botMessageColor: string;
    borderRadius: number;
    fontSize: number;
    position: 'bottom-right' | 'bottom-left';
    buttonIcon: string;
    buttonSize: number;
    welcomeMessage: string;
    placeholderText: string;
    showBranding: boolean;
    customCss?: string;
}

interface ChatbotData {
    _id: string;
    publicId: string;
    name: string;
    status: 'active' | 'inactive';
    appearance: Partial<AppearanceSettings>;
}

const defaultAppearance: AppearanceSettings = {
    title: 'Customer Support',
    subtitle: 'We typically reply in a few seconds',
    logoUrl: '',
    avatarUrl: '',
    primaryColor: '#2563EB',
    secondaryColor: '#1E40AF',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    userMessageColor: '#2563EB',
    botMessageColor: '#F3F4F6',
    borderRadius: 14,
    fontSize: 14,
    position: 'bottom-right',
    buttonIcon: 'chat',
    buttonSize: 56,
    welcomeMessage: 'Hello! How can I help you today?',
    placeholderText: 'Type your message...',
    showBranding: true,
    customCss: '',
};

export default function AppearancePage() {
    const { id } = useParams<{ id: string }>();

    const [chatbot, setChatbot] = useState<ChatbotData | null>(null);
    const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
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
            const res = await fetch(`/api/admin/chatbots/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load chatbot.');

            setChatbot(data.chatbot);
            if (data.chatbot.appearance) {
                setAppearance({
                    ...defaultAppearance,
                    title: data.chatbot.appearance.title || data.chatbot.name || defaultAppearance.title,
                    ...data.chatbot.appearance,
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load chatbot appearance.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const res = await fetch(`/api/admin/chatbots/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appearance,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save appearance.');

            setSuccess('Appearance settings saved and published to live widgets!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save appearance.');
        } finally {
            setSaving(false);
        }
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

    return (
        <div className="p-6 max-w-7xl">
            <ChatbotTabs
                chatbotId={id}
                publicId={chatbot?.publicId}
                chatbotName={chatbot?.name}
                status={chatbot?.status}
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Customizer Settings Form */}
                <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
                    {/* Header & Typography */}
                    <div className="rounded-xl border border-border-light bg-surface-300 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Palette className="w-5 h-5 text-gold-400" />
                            <h2 className="text-base font-semibold text-white">Header & Content</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                                        Chatbot Title
                                    </label>
                                    <input
                                        type="text"
                                        value={appearance.title}
                                        onChange={(e) => setAppearance({ ...appearance, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-surface-100 border border-border-light rounded-lg text-white text-xs"
                                        placeholder="Customer Support"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                                        Subtitle / Status
                                    </label>
                                    <input
                                        type="text"
                                        value={appearance.subtitle}
                                        onChange={(e) => setAppearance({ ...appearance, subtitle: e.target.value })}
                                        className="w-full px-3 py-2 bg-surface-100 border border-border-light rounded-lg text-white text-xs"
                                        placeholder="Online - Replies instantly"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                                        Logo URL (Header)
                                    </label>
                                    <input
                                        type="url"
                                        value={appearance.logoUrl}
                                        onChange={(e) => setAppearance({ ...appearance, logoUrl: e.target.value })}
                                        className="w-full px-3 py-2 bg-surface-100 border border-border-light rounded-lg text-white text-xs"
                                        placeholder="https://example.com/logo.png"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                                        Avatar URL (Bot Message)
                                    </label>
                                    <input
                                        type="url"
                                        value={appearance.avatarUrl}
                                        onChange={(e) => setAppearance({ ...appearance, avatarUrl: e.target.value })}
                                        className="w-full px-3 py-2 bg-surface-100 border border-border-light rounded-lg text-white text-xs"
                                        placeholder="https://example.com/bot-avatar.png"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    Welcome Message
                                </label>
                                <textarea
                                    rows={2}
                                    value={appearance.welcomeMessage}
                                    onChange={(e) => setAppearance({ ...appearance, welcomeMessage: e.target.value })}
                                    className="w-full px-3 py-2 bg-surface-100 border border-border-light rounded-lg text-white text-xs"
                                    placeholder="Hello! How can I help you today?"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    Input Placeholder Text
                                </label>
                                <input
                                    type="text"
                                    value={appearance.placeholderText}
                                    onChange={(e) => setAppearance({ ...appearance, placeholderText: e.target.value })}
                                    className="w-full px-3 py-2 bg-surface-100 border border-border-light rounded-lg text-white text-xs"
                                    placeholder="Type your message..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="rounded-xl border border-border-light bg-surface-300 p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-white mb-4">Color Palette & Theme</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                                    Primary Color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={appearance.primaryColor}
                                        onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                                        className="w-8 h-8 rounded border border-border-light cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={appearance.primaryColor}
                                        onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                                        className="w-24 px-2 py-1.5 bg-surface-100 border border-border-light rounded text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                                    User Message Bubble
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={appearance.userMessageColor}
                                        onChange={(e) => setAppearance({ ...appearance, userMessageColor: e.target.value })}
                                        className="w-8 h-8 rounded border border-border-light cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={appearance.userMessageColor}
                                        onChange={(e) => setAppearance({ ...appearance, userMessageColor: e.target.value })}
                                        className="w-24 px-2 py-1.5 bg-surface-100 border border-border-light rounded text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                                    Bot Message Bubble
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={appearance.botMessageColor}
                                        onChange={(e) => setAppearance({ ...appearance, botMessageColor: e.target.value })}
                                        className="w-8 h-8 rounded border border-border-light cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={appearance.botMessageColor}
                                        onChange={(e) => setAppearance({ ...appearance, botMessageColor: e.target.value })}
                                        className="w-24 px-2 py-1.5 bg-surface-100 border border-border-light rounded text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                                    Background Color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={appearance.backgroundColor}
                                        onChange={(e) => setAppearance({ ...appearance, backgroundColor: e.target.value })}
                                        className="w-8 h-8 rounded border border-border-light cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={appearance.backgroundColor}
                                        onChange={(e) => setAppearance({ ...appearance, backgroundColor: e.target.value })}
                                        className="w-24 px-2 py-1.5 bg-surface-100 border border-border-light rounded text-xs text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">
                                    Text Color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={appearance.textColor}
                                        onChange={(e) => setAppearance({ ...appearance, textColor: e.target.value })}
                                        className="w-8 h-8 rounded border border-border-light cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={appearance.textColor}
                                        onChange={(e) => setAppearance({ ...appearance, textColor: e.target.value })}
                                        className="w-24 px-2 py-1.5 bg-surface-100 border border-border-light rounded text-xs text-white font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Widget Layout & Behavior */}
                    <div className="rounded-xl border border-border-light bg-surface-300 p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-white mb-4">Layout & Sizing</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    Widget Position
                                </label>
                                <select
                                    value={appearance.position}
                                    onChange={(e) =>
                                        setAppearance({
                                            ...appearance,
                                            position: e.target.value as 'bottom-right' | 'bottom-left',
                                        })
                                    }
                                    className="w-full px-3 py-2 bg-surface-100 border border-border-light rounded-lg text-white text-xs"
                                >
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    Border Radius ({appearance.borderRadius}px)
                                </label>
                                <input
                                    type="range"
                                    min="4"
                                    max="24"
                                    value={appearance.borderRadius}
                                    onChange={(e) =>
                                        setAppearance({ ...appearance, borderRadius: parseInt(e.target.value) })
                                    }
                                    className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-gold-500 mt-2"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    Launcher Size ({appearance.buttonSize}px)
                                </label>
                                <input
                                    type="range"
                                    min="40"
                                    max="72"
                                    value={appearance.buttonSize}
                                    onChange={(e) =>
                                        setAppearance({ ...appearance, buttonSize: parseInt(e.target.value) })
                                    }
                                    className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-gold-500 mt-2"
                                />
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border-subtle flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-white">Platform Branding</p>
                                <p className="text-[11px] text-gray-400">Display "Powered by Chatbot Platform" footer</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={appearance.showBranding}
                                    onChange={(e) =>
                                        setAppearance({ ...appearance, showBranding: e.target.checked })
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-surface-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={fetchChatbot}
                            className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-surface-300 border border-border-light rounded-lg"
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 text-xs font-semibold text-black bg-gold-500 hover:bg-gold-400 rounded-lg shadow-md flex items-center gap-2"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {saving ? 'Saving...' : 'Save Appearance'}
                        </button>
                    </div>
                </form>

                {/* Live Preview Panel */}
                <div className="lg:col-span-5">
                    <div className="sticky top-6 rounded-2xl border border-border-light bg-surface-300 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-gold-400" />
                                <h3 className="text-sm font-bold text-white">Live Widget Preview</h3>
                            </div>
                            <span className="text-[10px] text-gray-400 bg-surface-100 px-2 py-0.5 rounded border border-border-light">
                                Real-time CSS
                            </span>
                        </div>

                        {/* Interactive Widget Box Preview */}
                        <div
                            className="w-full overflow-hidden shadow-2xl border border-gray-200 transition-all flex flex-col"
                            style={{
                                borderRadius: `${appearance.borderRadius}px`,
                                backgroundColor: appearance.backgroundColor,
                                color: appearance.textColor,
                                fontSize: `${appearance.fontSize}px`,
                                minHeight: '450px',
                            }}
                        >
                            {/* Widget Header */}
                            <div
                                className="px-4 py-3 text-white flex items-center justify-between"
                                style={{ backgroundColor: appearance.primaryColor }}
                            >
                                <div className="flex items-center gap-2.5">
                                    {appearance.logoUrl ? (
                                        <img
                                            src={appearance.logoUrl}
                                            alt="logo"
                                            className="w-7 h-7 rounded-full object-cover border border-white/30"
                                        />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-xs leading-tight">{appearance.title}</h4>
                                        {appearance.subtitle && (
                                            <p className="text-[10px] opacity-80 leading-tight">{appearance.subtitle}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm opacity-80 cursor-pointer font-bold">&times;</span>
                            </div>

                            {/* Chat Messages Body */}
                            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-72">
                                {/* Bot Welcome */}
                                <div className="flex items-start gap-2">
                                    <div
                                        className="p-3 max-w-[85%] text-xs leading-relaxed"
                                        style={{
                                            backgroundColor: appearance.botMessageColor,
                                            color: appearance.textColor,
                                            borderRadius: `${appearance.borderRadius}px`,
                                            borderBottomLeftRadius: '3px',
                                        }}
                                    >
                                        {appearance.welcomeMessage}
                                    </div>
                                </div>

                                {/* User Dummy Query */}
                                <div className="flex justify-end">
                                    <div
                                        className="p-3 max-w-[85%] text-xs text-white leading-relaxed"
                                        style={{
                                            backgroundColor: appearance.userMessageColor,
                                            borderRadius: `${appearance.borderRadius}px`,
                                            borderBottomRightRadius: '3px',
                                        }}
                                    >
                                        How can I track my order?
                                    </div>
                                </div>

                                {/* Bot Dummy Reply */}
                                <div className="flex items-start gap-2">
                                    <div
                                        className="p-3 max-w-[85%] text-xs leading-relaxed"
                                        style={{
                                            backgroundColor: appearance.botMessageColor,
                                            color: appearance.textColor,
                                            borderRadius: `${appearance.borderRadius}px`,
                                            borderBottomLeftRadius: '3px',
                                        }}
                                    >
                                        You can track your order by visiting the orders page in your account dashboard.
                                        <div className="text-[10px] opacity-60 mt-1">Sources: FAQ.pdf</div>
                                    </div>
                                </div>
                            </div>

                            {/* Input Box */}
                            <div className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    placeholder={appearance.placeholderText}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-xs outline-none bg-gray-50 text-gray-700"
                                />
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer shadow"
                                    style={{ backgroundColor: appearance.primaryColor }}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            {/* Branding */}
                            {appearance.showBranding && (
                                <div className="text-center py-1.5 text-[9px] text-gray-400 bg-gray-50 border-t border-gray-100">
                                    Powered by Chatbot Platform
                                </div>
                            )}
                        </div>

                        {/* Floating Button Preview */}
                        <div className="mt-6 flex items-center justify-between p-3 bg-surface-100/60 rounded-xl border border-border-light">
                            <span className="text-xs text-gray-400 font-medium">Launcher Button Preview:</span>
                            <div
                                className="rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer"
                                style={{
                                    width: `${appearance.buttonSize}px`,
                                    height: `${appearance.buttonSize}px`,
                                    backgroundColor: appearance.primaryColor,
                                }}
                            >
                                <MessageSquare className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
