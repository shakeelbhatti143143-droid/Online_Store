'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ChatbotTabs from '../ChatbotTabs';
import {
    MessageSquare,
    User,
    Bot,
    Clock,
    RefreshCw,
    AlertCircle,
    Calendar,
    Coins,
    FileText,
    Hash,
} from 'lucide-react';

interface ConversationListItem {
    id: string;
    visitorId: string;
    sessionId: string;
    startedAt: string;
    lastMessageAt: string;
    messageCount: number;
    tokenUsage: number;
}

interface MessageItem {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
    tokenUsage?: number;
    sources?: Array<{ documentId: string; fileName: string; score: number }>;
}

interface ChatbotSummary {
    _id: string;
    publicId: string;
    name: string;
    status: 'active' | 'inactive';
}

export default function ConversationsPage() {
    const { id } = useParams<{ id: string }>();

    const [chatbot, setChatbot] = useState<ChatbotSummary | null>(null);
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
    const [selectedConvoMessages, setSelectedConvoMessages] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchChatbotAndConversations();
    }, [id]);

    async function fetchChatbotAndConversations() {
        try {
            setLoading(true);
            setError('');
            const [botRes, convRes] = await Promise.all([
                fetch(`/api/admin/chatbots/${id}`),
                fetch(`/api/admin/chatbots/${id}/conversations`),
            ]);

            const botData = await botRes.json();
            const convData = await convRes.json();

            if (!botRes.ok) throw new Error(botData.error || 'Failed to load chatbot.');
            if (!convRes.ok) throw new Error(convData.error || 'Failed to load conversations.');

            setChatbot(botData.chatbot);
            const list = convData.conversations || [];
            setConversations(list);

            if (list.length > 0 && !selectedConvoId) {
                loadConversationDetail(list[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load conversations.');
        } finally {
            setLoading(false);
        }
    }

    async function loadConversationDetail(convoId: string) {
        try {
            setSelectedConvoId(convoId);
            setLoadingMessages(true);
            const res = await fetch(`/api/admin/chatbots/${id}/conversations/${convoId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load conversation messages.');

            setSelectedConvoMessages(data.messages || []);
        } catch (err) {
            console.error('Failed to load conversation:', err);
        } finally {
            setLoadingMessages(false);
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-surface-300 rounded w-1/3"></div>
                    <div className="h-96 bg-surface-300 rounded"></div>
                </div>
            </div>
        );
    }

    const activeConversation = conversations.find((c) => c.id === selectedConvoId);

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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
                {/* Conversations List (Sidebar) */}
                <div className="lg:col-span-4 rounded-2xl border border-border-light bg-surface-300 overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b border-border-light flex items-center justify-between bg-surface-100/50">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-gold-400" />
                            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                                Conversations ({conversations.length})
                            </h2>
                        </div>
                        <button
                            onClick={fetchChatbotAndConversations}
                            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-surface-300 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-400">
                                No visitor conversations recorded yet.
                            </div>
                        ) : (
                            conversations.map((convo) => {
                                const isSelected = convo.id === selectedConvoId;
                                return (
                                    <div
                                        key={convo.id}
                                        onClick={() => loadConversationDetail(convo.id)}
                                        className={`p-4 cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-gold-500/10 border-l-4 border-gold-500'
                                                : 'hover:bg-surface-100/60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono text-xs font-semibold text-white truncate max-w-[150px]">
                                                Visitor: {convo.visitorId.slice(0, 10)}...
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(convo.lastMessageAt || convo.startedAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3 text-gold-400" />
                                                {convo.messageCount} msgs
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Coins className="w-3 h-3 text-blue-400" />
                                                {convo.tokenUsage || 0} tokens
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Conversation Transcript (Detail Panel) */}
                <div className="lg:col-span-8 rounded-2xl border border-border-light bg-surface-300 overflow-hidden flex flex-col shadow-sm">
                    {/* Header */}
                    <div className="p-4 border-b border-border-light bg-surface-100/50 flex items-center justify-between">
                        {activeConversation ? (
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-gold-400" />
                                    Conversation #{activeConversation.id.slice(-8)}
                                </h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Visitor ID: <span className="font-mono text-gold-400">{activeConversation.visitorId}</span> &bull; Session: <span className="font-mono">{activeConversation.sessionId}</span>
                                </p>
                            </div>
                        ) : (
                            <h3 className="text-sm font-bold text-gray-400">Select a conversation</h3>
                        )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-surface-100/30">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-gold-400" />
                                Loading message transcript...
                            </div>
                        ) : selectedConvoMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                Select a conversation from the sidebar to view its transcript.
                            </div>
                        ) : (
                            selectedConvoMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5" />
                                        </div>
                                    )}

                                    <div className="max-w-[80%] space-y-1">
                                        <div
                                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                                msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-surface-100 border border-border-light text-gray-100 rounded-tl-none'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-gray-500 px-1">
                                            <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                            {msg.tokenUsage ? (
                                                <span>{msg.tokenUsage} tokens</span>
                                            ) : null}
                                        </div>

                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="text-[10px] text-gold-400 flex items-center gap-1 bg-gold-500/5 px-2 py-1 rounded border border-gold-500/20">
                                                <FileText className="w-3 h-3" />
                                                <span>RAG Sources: {msg.sources.map((s) => s.fileName || 'Doc').join(', ')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
