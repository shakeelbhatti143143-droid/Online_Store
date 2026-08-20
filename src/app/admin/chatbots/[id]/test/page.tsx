'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatbotTabs from '../ChatbotTabs';
import {
    TestTube,
    Send,
    Bot,
    User,
    Sparkles,
    FileText,
    Clock,
    RefreshCw,
    AlertCircle,
    Info,
} from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{ document_id: string; file_name: string; score: number }>;
    timestamp: Date;
    latencyMs?: number;
}

interface ChatbotData {
    _id: string;
    publicId: string;
    name: string;
    status: 'active' | 'inactive';
    aiConfig: {
        provider: string;
        model: string;
        systemPrompt: string;
        welcomeMessage: string;
    };
    appearance: {
        primaryColor?: string;
        title?: string;
        welcomeMessage?: string;
    };
}

export default function TestStudioPage() {
    const { id } = useParams<{ id: string }>();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [chatbot, setChatbot] = useState<ChatbotData | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchChatbot();
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, sending]);

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    async function fetchChatbot() {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/admin/chatbots/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load chatbot.');

            setChatbot(data.chatbot);
            const welcome =
                data.chatbot.appearance?.welcomeMessage ||
                data.chatbot.aiConfig?.welcomeMessage ||
                'Hello! How can I help you today?';

            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: welcome,
                    timestamp: new Date(),
                },
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize test studio.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSendMessage(e?: React.FormEvent) {
        if (e) e.preventDefault();
        const text = input.trim();
        if (!text || sending || !chatbot) return;

        const userMsg: ChatMessage = {
            id: 'msg_' + Date.now(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setSending(true);
        setError('');

        const startTime = Date.now();

        try {
            const res = await fetch(`/api/admin/chatbots/${id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();
            const latencyMs = Date.now() - startTime;

            if (!res.ok) {
                throw new Error(data.error || 'Chat response failed.');
            }

            const botMsg: ChatMessage = {
                id: 'bot_' + Date.now(),
                role: 'assistant',
                content: data.message,
                sources: data.sources || [],
                timestamp: new Date(),
                latencyMs,
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error getting AI response.');
            const errorMsg: ChatMessage = {
                id: 'err_' + Date.now(),
                role: 'assistant',
                content: `⚠️ Error: ${err instanceof Error ? err.message : 'Failed to generate response.'}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setSending(false);
        }
    }

    function handleReset() {
        if (!chatbot) return;
        const welcome =
            chatbot.appearance?.welcomeMessage ||
            chatbot.aiConfig?.welcomeMessage ||
            'Hello! How can I help you today?';

        setMessages([
            {
                id: 'welcome_' + Date.now(),
                role: 'assistant',
                content: welcome,
                timestamp: new Date(),
            },
        ]);
        setError('');
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

    const primaryColor = chatbot?.appearance?.primaryColor || '#2563EB';

    return (
        <div className="p-6 max-w-6xl">
            <ChatbotTabs
                chatbotId={id}
                publicId={chatbot?.publicId}
                chatbotName={chatbot?.name}
                status={chatbot?.status}
            />

            {/* Test Studio Banner */}
            <div className="mb-6 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 text-gold-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-gold-400 flex-shrink-0" />
                    <div className="text-xs">
                        <span className="font-bold text-white">Full Production Pipeline Simulation: </span>
                        Uses active system prompt, AI model ({chatbot?.aiConfig?.model || 'gemini-3.1-flash-lite'}), and vector knowledge search.
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs text-black bg-gold-400 hover:bg-gold-300 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Clear Chat
                </button>
            </div>

            {error && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Chat Studio Box */}
            <div className="rounded-2xl border border-border-light bg-surface-300 shadow-2xl overflow-hidden flex flex-col h-[600px]">
                {/* Header */}
                <div
                    className="p-4 text-white flex items-center justify-between border-b border-border-subtle"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm leading-tight">{chatbot?.name}</h3>
                            <p className="text-[11px] opacity-80 leading-tight">
                                {chatbot?.aiConfig?.provider} &bull; {chatbot?.aiConfig?.model}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs bg-black/30 px-2.5 py-1 rounded-full font-mono">
                        Test Mode
                    </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-surface-100/50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}

                            <div className={`max-w-[78%] space-y-1.5`}>
                                <div
                                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-surface-300 border border-border-light text-gray-100 rounded-tl-none'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {/* Sources / Latency info for assistant messages */}
                                {msg.role === 'assistant' && (
                                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 px-1">
                                        {msg.latencyMs && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {msg.latencyMs}ms
                                            </span>
                                        )}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-gold-400">
                                                <FileText className="w-3 h-3" />
                                                <span>
                                                    Sources: {msg.sources.map((s) => s.file_name).join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}

                    {sending && (
                        <div className="flex gap-3 justify-start items-center">
                            <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 animate-pulse" />
                            </div>
                            <div className="p-3.5 bg-surface-300 border border-border-light rounded-2xl rounded-tl-none text-xs text-gray-400 flex items-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold-400" />
                                Searching knowledge base & generating response...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-4 bg-surface-300 border-t border-border-light flex items-center gap-3"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a test message (e.g., How do I reset my password?)..."
                        disabled={sending}
                        className="flex-1 px-4 py-3 bg-surface-100 border border-border-light rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                    />
                    <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="px-5 py-3 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
