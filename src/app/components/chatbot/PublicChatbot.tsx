'use client';

import { useEffect, useState } from 'react';
import ChatWidget from '@/app/admin/components/chatbot/ChatWidget';

interface ChatbotAppearance {
    title?: string;
    subtitle?: string;
    logoUrl?: string;
    avatarUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    userMessageColor?: string;
    botMessageColor?: string;
    borderRadius?: number;
    fontSize?: number;
    position?: 'bottom-right' | 'bottom-left';
    buttonIcon?: string;
    buttonSize?: number;
    welcomeMessage?: string;
    placeholderText?: string;
    showBranding?: boolean;
    customCss?: string;
}

interface PublicChatbotData {
    id: string;
    _id: string;
    publicId: string;
    name: string;
    description?: string;
    status: 'active' | 'inactive';
    appearance?: ChatbotAppearance;
}

interface PublicChatbotResponse {
    success: boolean;
    chatbot: PublicChatbotData | null;
}

export default function PublicChatbot() {
    const [chatbot, setChatbot] =
        useState<PublicChatbotData | null>(null);

    const [loading, setLoading] =
        useState(true);

    const loadChatbot = async () => {
        try {
            const response = await fetch(
                '/api/public/chatbot',
                {
                    method: 'GET',
                    cache: 'no-store',
                }
            );

            if (!response.ok) {
                console.error(
                    'Public chatbot API error:',
                    response.status
                );

                return;
            }

            const data: PublicChatbotResponse =
                await response.json();

            console.log(
                '[PublicChatbot] API response:',
                data
            );

            if (
                data.success &&
                data.chatbot &&
                data.chatbot.status === 'active'
            ) {
                setChatbot(data.chatbot);
            } else {
                setChatbot(null);
            }
        } catch (error) {
            console.error(
                '[PublicChatbot] Failed to load chatbot:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChatbot();

        /*
         * Check every 3 seconds so a newly-created
         * chatbot can appear without refreshing.
         */
        const interval = window.setInterval(() => {
            loadChatbot();
        }, 3000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    if (loading) {
        return null;
    }

    if (!chatbot) {
        return null;
    }

    return (
        <ChatWidget
            chatbotId={chatbot.id}
            chatbotName={chatbot.name}
        />
    );
}