'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Bot,
    User,
    X,
    Paperclip,
    Image as ImageIcon,
    Mic,
    StopCircle,
    AlertCircle,
    RefreshCw,
    FileText,
    Clock,
    ArrowLeft,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: Array<{ document_id: string; file_name: string; score: number }>;
    isError?: boolean;
}

interface ChatbotConfig {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    welcome_message: string;
    appearance: {
        title: string;
        subtitle: string;
        logoUrl: string;
        avatarUrl: string;
        primary_color: string;
        secondary_color: string;
        text_color: string;
        background_color: string;
        user_message_color: string;
        bot_message_color: string;
        border_radius: number;
        font_size: number;
        position: 'bottom-right' | 'bottom-left';
        button_icon: string;
        button_size: number;
        placeholder_text: string;
        show_branding: boolean;
    };
}

interface Attachment {
    id: string;
    file: File;
    preview: string;
    type: 'image' | 'file';
    uploadProgress: number;
    error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const SUPPORTED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ChatbotPage({ params }: { params: { chatbotId: string } }) {
    const { chatbotId } = params;

    const [chatbot, setChatbot] = useState<ChatbotConfig | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [configError, setConfigError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [visitorId, setVisitorId] = useState<string>('');
    const [sessionId, setSessionId] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // ---------------------------------------------------------------------------
    // Visitor / Session ID management
    // ---------------------------------------------------------------------------

    useEffect(() => {
        const storedVisitor = localStorage.getItem('chatbot_visitor_id');
        const storedSession = localStorage.getItem('chatbot_session_id');

        const vId = storedVisitor || `v_${Math.random().toString(36).substring(2, 15)}`;
        const sId = storedSession || `s_${Math.random().toString(36).substring(2, 15)}`;

        if (!storedVisitor) localStorage.setItem('chatbot_visitor_id', vId);
        if (!storedSession) localStorage.setItem('chatbot_session_id', sId);

        setVisitorId(vId);
        setSessionId(sId);
    }, []);

    // ---------------------------------------------------------------------------
    // Fetch chatbot config
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (chatbotId) {
            fetchChatbotConfig();
        }
    }, [chatbotId]);

    async function fetchChatbotConfig() {
        try {
            setIsLoadingConfig(true);
            setConfigError(null);

            const res = await fetch(`/api/public/chatbots/${chatbotId}/config`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Chatbot not found.');
            }

            setChatbot(data);
        } catch (err) {
            setConfigError(err instanceof Error ? err.message : 'Failed to load chatbot.');
        } finally {
            setIsLoadingConfig(false);
        }
    }

    // ---------------------------------------------------------------------------
    // Initialize welcome message
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (chatbot && messages.length === 0) {
            const welcome = chatbot.welcome_message || 'Hello! How can I help you today?';
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: welcome,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [chatbot, messages.length]);

    // ---------------------------------------------------------------------------
    // Scroll to bottom
    // ---------------------------------------------------------------------------

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending]);

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    // ---------------------------------------------------------------------------
    // Speech recognition
    // ---------------------------------------------------------------------------

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setSpeechSupported(!!SpeechRecognition);

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setInput((prev) => prev + transcript);
            };

            recognition.onerror = (event: any) => {
                setSpeechError(event.error || 'Speech recognition error.');
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // ---------------------------------------------------------------------------
    // Send message
    // ---------------------------------------------------------------------------

    async function sendMessage(text: string) {
        if (!text || isSending || !chatbot) return;

        const userMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        try {
            const res = await fetch(`/api/public/chatbots/${chatbot.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    message: text,
                    visitor_id: visitorId,
                    session_id: sessionId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get chatbot response.');
            }

            if (data.conversation_id && !conversationId) {
                setConversationId(data.conversation_id);
            }

            const botMsg: ChatMessage = {
                id: `bot_${Date.now()}`,
                role: 'assistant',
                content: data.message || 'I received your message but no response was returned.',
                timestamp: new Date(),
                sources: data.sources || [],
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error getting AI response.';
            const errorBotMsg: ChatMessage = {
                id: `err_${Date.now()}`,
                role: 'assistant',
                content: errorMsg,
                timestamp: new Date(),
                isError: true,
            };
            setMessages((prev) => [...prev, errorBotMsg]);
        } finally {
            setIsSending(false);
        }
    }

    // ---------------------------------------------------------------------------
    // Handle form submit
    // ---------------------------------------------------------------------------

    function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        const text = input.trim();
        const validAttachments = attachments.filter((a) => !a.error);

        if (!text && validAttachments.length === 0) return;

        if (validAttachments.length > 0) {
            const attachmentNames = validAttachments.map((a) => a.file.name).join(', ');
            const fullMessage = text
                ? `${text}\n\n[Attachments: ${attachmentNames}]`
                : `[Attachments: ${attachmentNames}]`;

            sendMessage(fullMessage);

            validAttachments.forEach((a) => {
                if (a.preview) URL.revokeObjectURL(a.preview);
            });
            setAttachments([]);
        } else {
            sendMessage(text);
        }
    }

    // ---------------------------------------------------------------------------
    // File / Image upload
    // ---------------------------------------------------------------------------

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const newAttachments: Attachment[] = [];

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                newAttachments.push({
                    id: `att_${Date.now()}_${Math.random()}`,
                    file,
                    preview: '',
                    type: SUPPORTED_IMAGE_TYPES.includes(file.type) ? 'image' : 'file',
                    uploadProgress: 0,
                    error: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
                });
                continue;
            }

            const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
            const isSupportedFile = SUPPORTED_FILE_TYPES.includes(file.type);

            if (!isImage && !isSupportedFile) {
                newAttachments.push({
                    id: `att_${Date.now()}_${Math.random()}`,
                    file,
                    preview: '',
                    type: 'file',
                    uploadProgress: 0,
                    error: `Unsupported file type: ${file.type || file.name.split('.').pop()}. Supported: PDF, DOC/DOCX, TXT, CSV, images.`,
                });
                continue;
            }

            const preview = isImage ? URL.createObjectURL(file) : '';

            newAttachments.push({
                id: `att_${Date.now()}_${Math.random()}`,
                file,
                preview,
                type: isImage ? 'image' : 'file',
                uploadProgress: 100,
            });
        }

        setAttachments((prev) => [...prev, ...newAttachments]);
        e.target.value = '';
    }

    function removeAttachment(id: string) {
        const att = attachments.find((a) => a.id === id);
        if (att?.preview) URL.revokeObjectURL(att.preview);
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    }

    // ---------------------------------------------------------------------------
    // Voice input
    // ---------------------------------------------------------------------------

    function handleVoiceToggle() {
        if (!speechSupported) {
            setSpeechError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            setSpeechError(null);
            try {
                recognitionRef.current?.start();
                setIsRecording(true);
            } catch (err) {
                setSpeechError('Could not start speech recognition. Please check microphone permissions.');
            }
        }
    }

    // ---------------------------------------------------------------------------
    // Reset conversation
    // ---------------------------------------------------------------------------

    function handleReset() {
        if (!chatbot) return;
        const welcome = chatbot.welcome_message || 'Hello! How can I help you today?';
        setMessages([
            {
                id: 'welcome_' + Date.now(),
                role: 'assistant',
                content: welcome,
                timestamp: new Date(),
            },
        ]);
        setConversationId(null);
        setInput('');
        setAttachments([]);
    }

    // ---------------------------------------------------------------------------
    // Render helpers
    // ---------------------------------------------------------------------------

    const primaryColor = chatbot?.appearance?.primary_color || '#2563EB';
    const secondaryColor = chatbot?.appearance?.secondary_color || '#1E40AF';
    const borderRadius = chatbot?.appearance?.border_radius || 18;
    const placeholderText = chatbot?.appearance?.placeholder_text || 'Type your message...';
    const showBranding = chatbot?.appearance?.show_branding !== false;
    const avatarUrl = chatbot?.appearance?.avatarUrl || chatbot?.appearance?.logoUrl || '';
    const botName = chatbot?.appearance?.title || chatbot?.name || 'Chatbot';
    const subtitle = chatbot?.appearance?.subtitle || 'We typically reply in a few minutes';

    // ---------------------------------------------------------------------------
    // Loading state
    // ---------------------------------------------------------------------------

    if (isLoadingConfig) {
        return (
            <div className="min-h-screen bg-surface-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading chatbot...</p>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Error state
    // ---------------------------------------------------------------------------

    if (configError || !chatbot) {
        return (
            <div className="min-h-screen bg-surface-200 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-rose-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Chatbot Not Available</h2>
                    <p className="text-gray-400 text-sm mb-4">{configError || 'This chatbot could not be found.'}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-black rounded-xl font-semibold hover:bg-gold-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                backgroundColor: chatbot.appearance?.background_color || '#FFFFFF',
                color: chatbot.appearance?.text_color || '#1F2937',
                fontSize: `${chatbot.appearance?.font_size || 14}px`,
            }}
        >
            {/* Header */}
            <header
                className="px-4 py-3 text-white flex items-center justify-between flex-shrink-0"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Link href="/" className="flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 hover:opacity-80 transition-opacity" />
                    </Link>

                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={botName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
                        />
                    ) : (
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        >
                            <Bot className="w-5 h-5" />
                        </div>
                    )}

                    <div className="min-w-0">
                        <h1 className="font-semibold text-base leading-tight truncate">{botName}</h1>
                        <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{subtitle}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={handleReset}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Reset conversation"
                        title="Reset conversation"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <Link
                        href="/"
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Close chat"
                    >
                        <X className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                style={{
                    backgroundColor: chatbot.appearance?.background_color || '#FFFFFF',
                    color: chatbot.appearance?.text_color || '#1F2937',
                    fontSize: `${chatbot.appearance?.font_size || 14}px`,
                }}
            >
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        primaryColor={primaryColor}
                        userMessageColor={chatbot.appearance?.user_message_color || '#2563EB'}
                        botMessageColor={chatbot.appearance?.bot_message_color || '#F3F4F6'}
                        textColor={chatbot.appearance?.text_color || '#1F2937'}
                        borderRadius={borderRadius}
                        avatarUrl={avatarUrl}
                    />
                ))}

                {isSending && (
                    <TypingIndicator
                        botMessageColor={chatbot.appearance?.bot_message_color || '#F3F4F6'}
                        primaryColor={primaryColor}
                        borderRadius={borderRadius}
                    />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="px-4 py-2 border-t border-border-light bg-surface-50 flex flex-wrap gap-2">
                    {attachments.map((att) => (
                        <AttachmentPreview
                            key={att.id}
                            attachment={att}
                            onRemove={removeAttachment}
                            primaryColor={primaryColor}
                        />
                    ))}
                </div>
            )}

            {/* Speech error */}
            {speechError && (
                <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{speechError}</span>
                </div>
            )}

            {/* Input area */}
            <div
                className="p-4 border-t border-border-light flex-shrink-0"
                style={{
                    backgroundColor: chatbot.appearance?.background_color || '#FFFFFF',
                }}
            >
                <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
                    {/* Attachment button */}
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-xl hover:bg-surface-200 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Attach file"
                            title="Attach file (PDF, DOC, TXT, CSV)"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-2 rounded-xl hover:bg-surface-200 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Upload image"
                            title="Upload image"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Voice button */}
                    <button
                        type="button"
                        onClick={handleVoiceToggle}
                        className={cn(
                            'p-2 rounded-xl transition-colors',
                            isRecording
                                ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                                : 'hover:bg-surface-200 text-gray-400 hover:text-gray-600'
                        )}
                        aria-label={isRecording ? 'Stop recording' : 'Voice input'}
                        title={isRecording ? 'Stop recording' : 'Voice input'}
                    >
                        {isRecording ? (
                            <StopCircle className="w-4 h-4" />
                        ) : (
                            <Mic className="w-4 h-4" />
                        )}
                    </button>

                    {/* Text input */}
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholderText}
                        disabled={isSending}
                        rows={1}
                        className="flex-1 min-h-[44px] max-h-32 px-4 py-2 bg-surface-100 border border-border-light rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 resize-none"
                        style={{ fontSize: `${chatbot.appearance?.font_size || 14}px` }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleFormSubmit(e);
                            }
                        }}
                    />

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={isSending || (!input.trim() && attachments.filter((a) => !a.error).length === 0)}
                        className="p-2.5 rounded-xl text-white transition-all flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                            opacity: isSending || (!input.trim() && attachments.filter((a) => !a.error).length === 0) ? 0.5 : 1,
                            cursor: isSending || (!input.trim() && attachments.filter((a) => !a.error).length === 0) ? 'not-allowed' : 'pointer',
                        }}
                        aria-label="Send message"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>

                {/* Branding */}
                {showBranding && (
                    <div className="mt-2 text-center text-[9px] text-gray-400">
                        Powered by Chatbot Platform
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Message Bubble Component
// ---------------------------------------------------------------------------

function MessageBubble({
    message,
    primaryColor,
    userMessageColor,
    botMessageColor,
    textColor,
    borderRadius,
    avatarUrl,
}: {
    message: ChatMessage;
    primaryColor: string;
    userMessageColor: string;
    botMessageColor: string;
    textColor: string;
    borderRadius: number;
    avatarUrl: string;
}) {
    const isUser = message.role === 'user';
    const timeStr = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Bot" className="w-full h-full object-cover" />
                    ) : (
                        <div
                            className="w-full h-full rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Bot className="w-4 h-4" />
                        </div>
                    )}
                </div>
            )}

            <div className="max-w-[78%] space-y-1">
                <div
                    className={cn(
                        'px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        isUser
                            ? 'text-white rounded-2xl rounded-br-none'
                            : 'border border-border-light rounded-2xl rounded-bl-none'
                    )}
                    style={{
                        backgroundColor: isUser ? userMessageColor : botMessageColor,
                        color: isUser ? '#FFFFFF' : textColor,
                        borderRadius: `${borderRadius}px`,
                        ...(isUser ? { borderBottomRightRadius: '4px' } : { borderBottomLeftRadius: '4px' }),
                    }}
                >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>

                    {message.isError && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs opacity-80">
                            <AlertCircle className="w-3 h-3" />
                            <span>There was an error processing your request.</span>
                        </div>
                    )}

                    {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {message.sources.map((s, i) => (
                                <div
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-black/5"
                                >
                                    <FileText className="w-3 h-3" />
                                    <span>{s.file_name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 opacity-60">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-mono">{timeStr}</span>
                </div>
            </div>

            {isUser && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-surface-300 text-gray-400">
                    <User className="w-4 h-4" />
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Typing Indicator Component
// ---------------------------------------------------------------------------

function TypingIndicator({
    botMessageColor,
    primaryColor,
    borderRadius,
}: {
    botMessageColor: string;
    primaryColor: string;
    borderRadius: number;
}) {
    return (
        <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-surface-300">
                <Bot className="w-4 h-4 text-gray-400" />
            </div>
            <div
                className="px-4 py-3 border border-border-light shadow-sm"
                style={{
                    backgroundColor: botMessageColor,
                    borderRadius: `${borderRadius}px`,
                }}
            >
                <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: primaryColor }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce delay-75" style={{ backgroundColor: primaryColor }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce delay-150" style={{ backgroundColor: primaryColor }} />
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Attachment Preview Component
// ---------------------------------------------------------------------------

function AttachmentPreview({
    attachment,
    onRemove,
    primaryColor,
}: {
    attachment: Attachment;
    onRemove: (id: string) => void;
    primaryColor: string;
}) {
    return (
        <div className="relative group">
            {attachment.type === 'image' && attachment.preview ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border-light">
                    <img src={attachment.preview} alt="preview" className="w-full h-full object-cover" />
                    {attachment.uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-16 h-16 rounded-lg border border-border-light bg-surface-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                </div>
            )}

            <div className="absolute -bottom-4 left-0 right-0 text-[9px] text-gray-400 truncate text-center">
                {attachment.file.name}
            </div>

            {attachment.error ? (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-2.5 h-2.5 text-white" />
                </div>
            ) : (
                <button
                    onClick={() => onRemove(attachment.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-surface-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                >
                    <X className="w-2.5 h-2.5 text-white" />
                </button>
            )}
        </div>
    );
}
