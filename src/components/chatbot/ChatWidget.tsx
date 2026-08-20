'use client';

import { useState } from 'react';

interface ChatWidgetProps {
    chatbotId: string;
    chatbotName?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatWidget({
    chatbotId,
    chatbotName = 'AI Assistant',
}: ChatWidgetProps) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Hi! I'm ${chatbotName}. How can I help you?`,
        },
    ]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        const text = message.trim();

        if (!text || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: text,
        };

        setMessages((prev) => [...prev, userMessage]);
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatbotId,
                    message: text,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error || 'Failed to get chatbot response.'
                );
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.answer || 'Sorry, I could not generate an answer.',
                },
            ]);
        } catch (error) {
            console.error('Chat error:', error);

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        'Sorry, something went wrong. Please try again.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat Window */}
            {open && (
                <div
                    style={{
                        position: 'fixed',
                        right: '24px',
                        bottom: '90px',
                        width: '360px',
                        height: '520px',
                        background: '#ffffff',
                        borderRadius: '18px',
                        boxShadow:
                            '0 20px 60px rgba(0, 0, 0, 0.20)',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 999999,
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            background:
                                'linear-gradient(135deg, #111827, #1f2937)',
                            color: '#ffffff',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: '16px',
                                }}
                            >
                                {chatbotName}
                            </div>

                            <div
                                style={{
                                    fontSize: '12px',
                                    opacity: 0.7,
                                    marginTop: '3px',
                                }}
                            >
                                Online
                            </div>
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '24px',
                                cursor: 'pointer',
                            }}
                            aria-label="Close chat"
                        >
                            ×
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            background: '#f9fafb',
                        }}
                    >
                        {messages.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent:
                                        item.role === 'user'
                                            ? 'flex-end'
                                            : 'flex-start',
                                    marginBottom: '12px',
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '80%',
                                        padding: '10px 13px',
                                        borderRadius: '14px',
                                        background:
                                            item.role === 'user'
                                                ? '#111827'
                                                : '#ffffff',
                                        color:
                                            item.role === 'user'
                                                ? '#ffffff'
                                                : '#111827',
                                        border:
                                            item.role === 'assistant'
                                                ? '1px solid #e5e7eb'
                                                : 'none',
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {item.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div
                                style={{
                                    color: '#6b7280',
                                    fontSize: '13px',
                                }}
                            >
                                AI is typing...
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div
                        style={{
                            padding: '12px',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            gap: '8px',
                            background: '#ffffff',
                        }}
                    >
                        <input
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question..."
                            disabled={loading}
                            style={{
                                flex: 1,
                                height: '42px',
                                borderRadius: '10px',
                                border: '1px solid #d1d5db',
                                padding: '0 12px',
                                outline: 'none',
                                fontSize: '14px',
                            }}
                        />

                        <button
                            onClick={sendMessage}
                            disabled={loading || !message.trim()}
                            style={{
                                width: '45px',
                                border: 'none',
                                borderRadius: '10px',
                                background: '#111827',
                                color: '#ffffff',
                                cursor:
                                    loading || !message.trim()
                                        ? 'not-allowed'
                                        : 'pointer',
                                opacity:
                                    loading || !message.trim()
                                        ? 0.5
                                        : 1,
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setOpen((value) => !value)}
                aria-label="Open chatbot"
                style={{
                    position: 'fixed',
                    right: '24px',
                    bottom: '24px',
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    border: 'none',
                    background:
                        'linear-gradient(135deg, #111827, #374151)',
                    color: '#ffffff',
                    fontSize: '25px',
                    cursor: 'pointer',
                    boxShadow:
                        '0 10px 30px rgba(0, 0, 0, 0.25)',
                    zIndex: 1000000,
                }}
            >
                {open ? '×' : '🤖'}
            </button>
        </>
    );
}