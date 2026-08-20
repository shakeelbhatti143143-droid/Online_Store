'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ChatbotTabs from '../ChatbotTabs';
import {
    Code,
    Copy,
    Check,
    CheckCircle2,
    AlertCircle,
    Globe,
    ShieldCheck,
    ExternalLink,
    Play,
    RefreshCw,
    HelpCircle,
} from 'lucide-react';

interface IntegrationData {
    chatbot: {
        id: string;
        publicId: string;
        name: string;
    };
    embedUrl: string;
    embedCode: string;
    allowedDomains: Array<{
        id: string;
        domain: string;
        isEnabled: boolean;
        verifiedAt?: string;
    }>;
}

interface VerificationResult {
    domain: string;
    checks: {
        scriptDetected: boolean;
        domainAuthorized: boolean;
        chatbotResponding: boolean;
    };
    installed: boolean;
    instructions: string;
}

export default function IntegrationPage() {
    const { id } = useParams<{ id: string }>();

    const [data, setData] = useState<IntegrationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [verifyDomain, setVerifyDomain] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchIntegrationData();
    }, [id]);

    async function fetchIntegrationData() {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/admin/chatbots/${id}/integrate`);
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Failed to load integration details.');

            setData(resData);
            if (resData.allowedDomains && resData.allowedDomains.length > 0) {
                setVerifyDomain(resData.allowedDomains[0].domain);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load integration.');
        } finally {
            setLoading(false);
        }
    }

    function handleCopyCode() {
        if (!data?.embedCode) return;
        navigator.clipboard.writeText(data.embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }

    async function handleVerifyInstallation(e: React.FormEvent) {
        e.preventDefault();
        const target = verifyDomain.trim();
        if (!target) return;

        try {
            setVerifying(true);
            setVerificationResult(null);
            setError('');

            const res = await fetch(`/api/admin/chatbots/${id}/integrate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: target }),
            });

            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error || 'Verification check failed.');

            setVerificationResult(resData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to test installation.');
        } finally {
            setVerifying(false);
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
                publicId={data?.chatbot.publicId}
                chatbotName={data?.chatbot.name}
            />

            {error && (
                <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Step-by-Step Integration Guide */}
            <div className="space-y-6">
                {/* Step 1: Authorized Domains */}
                <div className="rounded-2xl border border-border-light bg-surface-300 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-7 h-7 rounded-full bg-gold-500 text-black font-bold text-xs flex items-center justify-center">
                            1
                        </span>
                        <h2 className="text-base font-bold text-white">Ensure Your Website Domain Is Authorized</h2>
                    </div>
                    <p className="text-xs text-gray-400 ml-10 mb-4">
                        For security reasons, your chatbot widget will only load on domains that you authorize.
                    </p>

                    <div className="ml-10">
                        {data?.allowedDomains && data.allowedDomains.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.allowedDomains.map((dom) => (
                                    <span
                                        key={dom.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-100 border border-border-light rounded-lg text-xs font-mono text-gold-400"
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                        {dom.domain}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                                <span>No domain authorized yet. External websites will be blocked until authorized.</span>
                                <a
                                    href={`/admin/chatbots/${id}/domains`}
                                    className="px-3 py-1 bg-amber-500 text-black font-semibold rounded text-xs hover:bg-amber-400"
                                >
                                    Add Domain
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Copy Embed Code */}
                <div className="rounded-2xl border border-border-light bg-surface-300 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-gold-500 text-black font-bold text-xs flex items-center justify-center">
                                2
                            </span>
                            <h2 className="text-base font-bold text-white">Copy JavaScript Integration Code</h2>
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-black" />
                                    <span>Code Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Integration Code</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 ml-10 mb-4">
                        Place this lightweight tag on your external website before the closing <code className="text-gold-400 font-mono bg-black/40 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag.
                    </p>

                    <div className="ml-10 relative">
                        <pre className="p-4 bg-surface-100 border border-border-light rounded-xl font-mono text-xs text-gray-200 overflow-x-auto leading-relaxed">
                            {data?.embedCode}
                        </pre>
                    </div>
                </div>

                {/* Step 3: Installation Verification Tool */}
                <div className="rounded-2xl border border-border-light bg-surface-300 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-7 h-7 rounded-full bg-gold-500 text-black font-bold text-xs flex items-center justify-center">
                            3
                        </span>
                        <h2 className="text-base font-bold text-white">Verify Installation</h2>
                    </div>

                    <p className="text-xs text-gray-400 ml-10 mb-4">
                        Test and verify that your domain is properly authorized and ready to serve AI chatbot widget responses.
                    </p>

                    <form onSubmit={handleVerifyInstallation} className="ml-10 flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            required
                            placeholder="e.g., example.com"
                            value={verifyDomain}
                            onChange={(e) => setVerifyDomain(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-surface-100 border border-border-light rounded-xl text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                        />
                        <button
                            type="submit"
                            disabled={verifying || !verifyDomain.trim()}
                            className="px-6 py-2.5 bg-surface-100 hover:bg-surface-200 border border-border-light text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {verifying ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-gold-400" />
                            ) : (
                                <Play className="w-4 h-4 text-gold-400" />
                            )}
                            Verify Installation
                        </button>
                    </form>

                    {/* Verification Result Cards */}
                    {verificationResult && (
                        <div className="ml-10 mt-5 p-5 bg-surface-100/80 border border-border-light rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">
                                    Status for <span className="font-mono text-gold-400">{verificationResult.domain}</span>
                                </span>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        verificationResult.installed
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}
                                >
                                    {verificationResult.installed ? '✓ Ready For Traffic' : '✕ Action Required'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-surface-300 rounded-lg flex items-center gap-2">
                                    <CheckCircle2
                                        className={`w-4 h-4 ${
                                            verificationResult.checks.domainAuthorized ? 'text-emerald-400' : 'text-red-400'
                                        }`}
                                    />
                                    <span className="text-gray-200">Domain Authorized</span>
                                </div>

                                <div className="p-3 bg-surface-300 rounded-lg flex items-center gap-2">
                                    <CheckCircle2
                                        className={`w-4 h-4 ${
                                            verificationResult.checks.scriptDetected ? 'text-emerald-400' : 'text-red-400'
                                        }`}
                                    />
                                    <span className="text-gray-200">Script Configured</span>
                                </div>

                                <div className="p-3 bg-surface-300 rounded-lg flex items-center gap-2">
                                    <CheckCircle2
                                        className={`w-4 h-4 ${
                                            verificationResult.checks.chatbotResponding ? 'text-emerald-400' : 'text-red-400'
                                        }`}
                                    />
                                    <span className="text-gray-200">Chatbot Active</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-300 leading-relaxed">
                                {verificationResult.instructions}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
