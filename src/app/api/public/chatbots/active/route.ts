export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chatbot from '@/lib/models/Chatbot';
import AllowedDomain from '@/lib/models/AllowedDomain';
import { normalizeHostname, isDomainMatch } from '@/lib/security/domain-validation';

/**
 * GET /api/public/chatbots/active
 *
 * Returns the active chatbot that is authorized for the requesting origin.
 * This allows the website to automatically discover which chatbot to display
 * without hardcoding a chatbot ID.
 *
 * Security:
 * - Only returns chatbots whose allowed domains match the request origin.
 * - Never returns API keys, system prompts, or tenant details.
 * - Returns only the publicId and minimal display info.
 */
export async function GET(request: NextRequest) {
    try {
        const origin = request.headers.get('origin') || getRequestOrigin(request);

        if (!origin) {
            return NextResponse.json(
                { error: 'Origin header is required.' },
                { status: 400 }
            );
        }

        const originHostname = normalizeHostname(origin);
        if (!originHostname) {
            return NextResponse.json(
                { error: 'Invalid origin.' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find all enabled domains that match this origin
        const matchingDomains = await AllowedDomain.find({
            isEnabled: true,
        }).select('chatbotId domain').lean();

        const authorizedChatbotIds = matchingDomains
            .filter((d) => {
                // Normalize the stored domain before comparison, since it may
                // be stored as a full URL (e.g. "http://localhost:3000") or
                // a bare hostname (e.g. "localhost" or "*.example.com").
                const normalizedDomain = normalizeHostname(d.domain);
                return isDomainMatch(originHostname, normalizedDomain);
            })
            .map((d) => d.chatbotId);

        if (authorizedChatbotIds.length === 0) {
            return NextResponse.json(
                { error: 'No chatbot is configured for this domain.' },
                { status: 404 }
            );
        }

        // Find the most recently created active chatbot for this domain
        const chatbot = await Chatbot.findOne({
            _id: { $in: authorizedChatbotIds },
            status: 'active',
            isDeleted: false,
        })
            .sort({ createdAt: -1 })
            .select('publicId name status appearance.title appearance.avatarUrl appearance.primaryColor appearance.welcomeMessage aiConfig.welcomeMessage')
            .lean();

        if (!chatbot) {
            return NextResponse.json(
                { error: 'No active chatbot found for this domain.' },
                { status: 404 }
            );
        }

        const appearance = (chatbot.appearance || {}) as unknown as Record<string, unknown>;

        return NextResponse.json({
            id: chatbot.publicId,
            name: chatbot.name,
            status: chatbot.status,
            welcome_message: chatbot.appearance?.welcomeMessage || chatbot.aiConfig?.welcomeMessage || 'Hello! How can I help you today?',
            appearance: {
                title: appearance.title || chatbot.name,
                subtitle: appearance.subtitle || '',
                logoUrl: appearance.logoUrl || '',
                avatarUrl: appearance.avatarUrl || '',
                primary_color: appearance.primaryColor || '#2563EB',
                secondary_color: appearance.secondaryColor || '#1E40AF',
                text_color: appearance.textColor || '#1F2937',
                background_color: appearance.backgroundColor || '#FFFFFF',
                user_message_color: appearance.userMessageColor || '#2563EB',
                bot_message_color: appearance.botMessageColor || '#F3F4F6',
                border_radius: appearance.borderRadius || 12,
                font_size: appearance.fontSize || 14,
                position: appearance.position || 'bottom-right',
                button_icon: appearance.buttonIcon || 'chat',
                button_size: appearance.buttonSize || 58,
                placeholder_text: appearance.placeholderText || 'Type your message...',
                show_branding: appearance.showBranding !== false,
            },
        });
    } catch (error) {
        console.error('[public/chatbots/active] error:', error);
        return NextResponse.json(
            { error: 'Unable to load chatbot configuration.' },
            { status: 500 }
        );
    }
}

function getRequestOrigin(request: NextRequest): string | null {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    if (!host) return null;
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host}`;
}
