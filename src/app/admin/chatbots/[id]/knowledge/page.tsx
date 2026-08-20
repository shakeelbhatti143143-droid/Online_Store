'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatbotTabs from '../ChatbotTabs';
import {
    Upload,
    Globe,
    FileText,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Database,
    Link2,
    Plus,
    FileCode,
} from 'lucide-react';

interface KnowledgeDoc {
    id: string;
    sourceType: 'file' | 'url' | 'text';
    fileName: string;
    fileType?: string;
    fileSize?: number;
    sourceUrl?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    chunkCount: number;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatbotSummary {
    _id: string;
    publicId: string;
    name: string;
    status: 'active' | 'inactive';
}

export default function KnowledgeBasePage() {
    const { id } = useParams<{ id: string }>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [chatbot, setChatbot] = useState<ChatbotSummary | null>(null);
    const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal / form states
    const [activeModal, setActiveModal] = useState<'none' | 'file' | 'url' | 'text'>('none');
    const [urlInput, setUrlInput] = useState('');
    const [textTitle, setTextTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [reindexingId, setReindexingId] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchChatbotAndDocs();
        }
    }, [id]);

    async function fetchChatbotAndDocs() {
        try {
            setLoading(true);
            setError('');
            const [botRes, docsRes] = await Promise.all([
                fetch(`/api/admin/chatbots/${id}`),
                fetch(`/api/admin/chatbots/${id}/knowledge`),
            ]);

            const botData = await botRes.json();
            const docsData = await docsRes.json();

            if (!botRes.ok) throw new Error(botData.error || 'Failed to load chatbot.');
            if (!docsRes.ok) throw new Error(docsData.error || 'Failed to load knowledge documents.');

            setChatbot(botData.chatbot);
            setDocuments(docsData.documents || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load knowledge.');
        } finally {
            setLoading(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/admin/chatbots/${id}/knowledge`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'File upload failed.');

            setSuccess(`"${file.name}" uploaded successfully! Background indexing started.`);
            setActiveModal('none');
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchChatbotAndDocs();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'File upload failed.');
        } finally {
            setUploading(false);
        }
    }

    async function handleAddUrl(e: React.FormEvent) {
        e.preventDefault();
        if (!urlInput.trim()) return;

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const res = await fetch(`/api/admin/chatbots/${id}/knowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceType: 'url',
                    url: urlInput.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add URL.');

            setSuccess('URL added and crawling scheduled!');
            setUrlInput('');
            setActiveModal('none');
            fetchChatbotAndDocs();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add URL.');
        } finally {
            setUploading(false);
        }
    }

    async function handleAddText(e: React.FormEvent) {
        e.preventDefault();
        if (!textContent.trim()) return;

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const res = await fetch(`/api/admin/chatbots/${id}/knowledge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceType: 'text',
                    fileName: textTitle.trim() || 'Plain Text Note',
                    text: textContent.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save text.');

            setSuccess('Plain text knowledge added and embedded!');
            setTextTitle('');
            setTextContent('');
            setActiveModal('none');
            fetchChatbotAndDocs();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save text.');
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(docId: string, name: string) {
        if (!confirm(`Delete knowledge document "${name}"?\nThis removes its vector embeddings from this chatbot's knowledge base.`)) {
            return;
        }

        try {
            setError('');
            const res = await fetch(`/api/admin/chatbots/${id}/knowledge/${docId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete document.');

            setDocuments((prev) => prev.filter((d) => d.id !== docId));
            setSuccess(`"${name}" was deleted from the knowledge base.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete document.');
        }
    }

    async function handleReindex(docId: string) {
        try {
            setReindexingId(docId);
            setError('');
            const res = await fetch(`/api/admin/chatbots/${id}/knowledge/${docId}`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to re-index document.');

            setSuccess('Document re-indexing triggered in background.');
            fetchChatbotAndDocs();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to re-index document.');
        } finally {
            setReindexingId(null);
        }
    }

    function renderStatusBadge(status: KnowledgeDoc['status']) {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> Failed
                    </span>
                );
        }
    }

    function renderSourceIcon(sourceType: KnowledgeDoc['sourceType']) {
        switch (sourceType) {
            case 'file':
                return <FileText className="w-4 h-4 text-gold-400" />;
            case 'url':
                return <Globe className="w-4 h-4 text-blue-400" />;
            case 'text':
                return <FileCode className="w-4 h-4 text-emerald-400" />;
        }
    }

    function formatFileSize(bytes?: number) {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        <div className="p-6 max-w-6xl">
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

            {/* Knowledge Sources Header & Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                    onClick={() => setActiveModal('file')}
                    className="p-5 rounded-xl border border-border-light bg-surface-300 hover:border-gold-500/50 hover:bg-surface-300/80 cursor-pointer transition-all flex flex-col items-center text-center group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Upload Document</h3>
                    <p className="text-xs text-gray-400">PDF, TXT, DOC, DOCX, CSV up to 25MB</p>
                </div>

                <div
                    onClick={() => setActiveModal('url')}
                    className="p-5 rounded-xl border border-border-light bg-surface-300 hover:border-blue-500/50 hover:bg-surface-300/80 cursor-pointer transition-all flex flex-col items-center text-center group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                        <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Website URL</h3>
                    <p className="text-xs text-gray-400">Crawl web pages and documentation</p>
                </div>

                <div
                    onClick={() => setActiveModal('text')}
                    className="p-5 rounded-xl border border-border-light bg-surface-300 hover:border-emerald-500/50 hover:bg-surface-300/80 cursor-pointer transition-all flex flex-col items-center text-center group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                        <FileCode className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Plain Text / FAQ</h3>
                    <p className="text-xs text-gray-400">Paste custom knowledge or FAQs</p>
                </div>
            </div>

            {/* Modal Dialogs */}
            {activeModal === 'file' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-300 border border-border-light rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">Upload Knowledge Document</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Supported formats: <strong className="text-gold-400">PDF, TXT, DOCX, DOC, CSV</strong>. Text will be extracted, chunked, and embedded into vector search.
                        </p>
                        <div className="border-2 border-dashed border-border-light hover:border-gold-500/50 rounded-xl p-8 text-center bg-surface-100/50 mb-4">
                            <Upload className="w-10 h-10 text-gold-400 mx-auto mb-3" />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt,.doc,.docx,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload-input"
                            />
                            <label
                                htmlFor="file-upload-input"
                                className="px-4 py-2 bg-gold-500 text-black font-semibold text-xs rounded-lg cursor-pointer hover:bg-gold-400 transition-colors inline-block"
                            >
                                {uploading ? 'Uploading & Processing...' : 'Select File'}
                            </label>
                            <p className="text-[11px] text-gray-500 mt-2">Max file size: 25MB</p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setActiveModal('none')}
                                disabled={uploading}
                                className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'url' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleAddUrl} className="bg-surface-300 border border-border-light rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">Add Website URL</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            The system will fetch the web page, remove HTML tags, extract semantic text chunks, and index them.
                        </p>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">URL</label>
                            <input
                                type="url"
                                required
                                placeholder="https://example.com/help-center"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveModal('none')}
                                className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {uploading ? 'Adding...' : 'Crawl & Index URL'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeModal === 'text' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleAddText} className="bg-surface-300 border border-border-light rounded-2xl max-w-xl w-full p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">Add Plain Text / FAQ</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Directly input knowledge, policies, product specs, or support articles.
                        </p>
                        <div className="mb-3">
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Title / Note</label>
                            <input
                                type="text"
                                placeholder="e.g., Return & Refund Policy 2026"
                                value={textTitle}
                                onChange={(e) => setTextTitle(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Content *</label>
                            <textarea
                                required
                                rows={8}
                                placeholder="Paste or type knowledge here..."
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-surface-100 border border-border-light rounded-lg text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveModal('none')}
                                className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-5 py-2 text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {uploading ? 'Processing...' : 'Save Knowledge'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Knowledge Documents Table */}
            <div className="rounded-xl border border-border-light bg-surface-300 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border-light flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-gold-400" />
                        <h2 className="text-base font-semibold text-white">Indexed Documents ({documents.length})</h2>
                    </div>
                    <button
                        onClick={fetchChatbotAndDocs}
                        className="px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-surface-100 rounded-lg flex items-center gap-1.5 border border-border-light"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <Database className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">No knowledge documents uploaded yet.</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                            Upload your documents or website URLs above so the AI chatbot can answer user inquiries accurately.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-border-light bg-surface-100/50">
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Document</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Type</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Status</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Chunks</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Size</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px]">Date Added</th>
                                    <th className="py-3 px-4 font-semibold text-gray-400 uppercase text-[11px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-surface-100/40 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded bg-surface-100 border border-border-light flex items-center justify-center flex-shrink-0">
                                                    {renderSourceIcon(doc.sourceType)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white truncate max-w-xs">{doc.fileName}</p>
                                                    {doc.errorMessage && (
                                                        <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-xs" title={doc.errorMessage}>
                                                            Error: {doc.errorMessage}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 uppercase text-gray-400 font-mono text-[10px]">
                                            {doc.fileType || doc.sourceType}
                                        </td>
                                        <td className="py-3.5 px-4">{renderStatusBadge(doc.status)}</td>
                                        <td className="py-3.5 px-4 text-gray-300 font-semibold">{doc.chunkCount}</td>
                                        <td className="py-3.5 px-4 text-gray-400">{formatFileSize(doc.fileSize)}</td>
                                        <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleReindex(doc.id)}
                                                    disabled={reindexingId === doc.id || doc.status === 'processing'}
                                                    title="Re-index document"
                                                    className="p-1.5 text-gray-400 hover:text-gold-400 hover:bg-surface-100 rounded transition-colors"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 ${reindexingId === doc.id ? 'animate-spin text-gold-400' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id, doc.fileName)}
                                                    title="Delete document"
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
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
