'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ChatbotTabs from '../ChatbotTabs';
import {
    Shield,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Globe,
    Lock,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';

interface AllowedDomainItem {
    id: string;
    domain: string;
    isEnabled: boolean;
    verifiedAt?: string;
    createdAt: string;
}

interface ChatbotSummary {
    _id: string;
    publicId: string;
    name: string;
    status: 'active' | 'inactive';
}

export default function DomainsPage() {
    const { id } = useParams<{ id: string }>();

    const [chatbot, setChatbot] = useState<ChatbotSummary | null>(null);
    const [domains, setDomains] = useState<AllowedDomainItem[]>([]);
    const [newDomain, setNewDomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (id) fetchChatbotAndDomains();
    }, [id]);

    async function fetchChatbotAndDomains() {
        try {
            setLoading(true);
            setError('');
            const [botRes, domRes] = await Promise.all([
                fetch(`/api/admin/chatbots/${id}`),
                fetch(`/api/admin/chatbots/${id}/domains`),
            ]);

            const botData = await botRes.json();
            const domData = await domRes.json();

            if (!botRes.ok) throw new Error(botData.error || 'Failed to load chatbot.');
            if (!domRes.ok) throw new Error(domData.error || 'Failed to load domains.');

            setChatbot(botData.chatbot);
            setDomains(domData.domains || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load domains.');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddDomain(e: React.FormEvent) {
        e.preventDefault();
        const input = newDomain.trim();
        if (!input) return;

        try {
            setAdding(true);
            setError('');
            setSuccess('');

            const res = await fetch(`/api/admin/chatbots/${id}/domains`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: input }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add domain.');

            setSuccess(`Domain "${data.domain.domain}" added to authorized list.`);
            setNewDomain('');
            fetchChatbotAndDomains();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add domain.');
        } finally {
            setAdding(false);
        }
    }

    async function handleDeleteDomain(domainId: string, domainName: string) {
        if (!confirm(`Remove domain "${domainName}" from authorized list?\nExternal requests from this domain will be blocked immediately.`)) {
            return;
        }

        try {
            setError('');
            const res = await fetch(`/api/admin/chatbots/${id}/domains/${domainId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete domain.');

            setDomains((prev) => prev.filter((d) => d.id !== domainId));
            setSuccess(`Domain "${domainName}" removed.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete domain.');
        }
    }

    async function handleToggleEnabled(domainId: string, currentEnabled: boolean) {
        try {
            setError('');
            const res = await fetch(`/api/admin/chatbots/${id}/domains/${domainId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isEnabled: !currentEnabled }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update domain.');

            setDomains((prev) =>
                prev.map((d) => (d.id === domainId ? { ...d, isEnabled: data.domain.isEnabled } : d))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update domain status.');
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
        <div className="p-6 max-w-5xl">
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

            {/* Security Explanation Alert */}
            <div className="mb-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-blue-200 shadow-sm flex items-start gap-4">
                <Lock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs space-y-1">
                    <h4 className="font-bold text-sm text-white">Server-Side Origin Enforcement</h4>
                    <p className="leading-relaxed text-gray-300">
                        Only authorized domains are allowed to load configuration and send chat messages.
                        Wildcards (e.g. <code className="text-gold-400 bg-black/40 px-1 py-0.5 rounded font-mono">*.yourdomain.com</code>) and localhost ports (e.g. <code className="text-gold-400 bg-black/40 px-1 py-0.5 rounded font-mono">localhost:3000</code>) are supported.
                        Requests from unauthorized origins are rejected with a 403 Forbidden status.
                    </p>
                </div>
            </div>

            {/* Add Domain Form */}
            <div className="rounded-xl border border-border-light bg-surface-300 p-6 shadow-sm mb-6">
                <h2 className="text-base font-semibold text-white mb-3">Add Allowed Domain</h2>
                <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            required
                            placeholder="e.g., https://example.com or *.example.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={adding || !newDomain.trim()}
                        className="px-6 py-2.5 text-xs font-semibold text-black bg-gold-500 hover:bg-gold-400 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        {adding ? 'Adding...' : 'Authorize Domain'}
                    </button>
                </form>
            </div>

            {/* Allowed Domains Table */}
            <div className="rounded-xl border border-border-light bg-surface-300 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gold-400" />
                        <h2 className="text-base font-semibold text-white">Authorized Domains ({domains.length})</h2>
                    </div>
                    <button
                        onClick={fetchChatbotAndDomains}
                        className="px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-surface-100 rounded-lg flex items-center gap-1.5 border border-border-light"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                </div>

                {domains.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <ShieldAlert className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No allowed domains configured.</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            Add the external website URLs where you want this chatbot to be active.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-border-light bg-surface-100/50">
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Domain Rule</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Status</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Date Added</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {domains.map((dom) => (
                                    <tr key={dom.id} className="hover:bg-surface-100/40 transition-colors">
                                        <td className="py-3.5 px-4 font-mono text-sm text-gold-400 font-semibold">
                                            {dom.domain}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <button
                                                onClick={() => handleToggleEnabled(dom.id, dom.isEnabled)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                    dom.isEnabled
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${dom.isEnabled ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                                                {dom.isEnabled ? 'Enabled' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-400">
                                            {new Date(dom.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => handleDeleteDomain(dom.id, dom.domain)}
                                                title="Remove Domain"
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
