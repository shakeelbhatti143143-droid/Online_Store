export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chatbot from '@/lib/models/Chatbot';
import { isOriginAuthorized } from '@/lib/security/domain-validation';

/**
 * GET /api/public/chatbots/[chatbotId]/config
 *
 * Returns ONLY safe public configuration for the embed widget.
 * Never returns: AI API keys, database credentials, internal prompts,
 * private admin information, or tenant details.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { chatbotId: string } }
) {
    try {
        const { chatbotId } = params;

        if (!chatbotId || !chatbotId.startsWith('cb_')) {
            return NextResponse.json(
                { error: 'Chatbot not found.' },
                { status: 404 }
            );
        }

        await connectDB();

        const chatbot = await Chatbot.findOne({
            publicId: chatbotId,
            isDeleted: false,
        })
            .select('publicId name status aiConfig.welcomeMessage appearance')
            .lean();

        if (!chatbot) {
            return NextResponse.json(
                { error: 'Chatbot not found.' },
                { status: 404 }
            );
        }

        if (chatbot.status !== 'active') {
            return NextResponse.json(
                { error: 'This chatbot is currently disabled.' },
                { status: 403 }
            );
        }

        const origin = request.headers.get('origin') || getRequestOrigin(request);
        const domainCheck = await isOriginAuthorized(chatbot._id, origin);
        if (!domainCheck.authorized) {
            return NextResponse.json({ error: 'This website is not authorized to use this chatbot.' }, { status: 403 });
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
        }, { headers: { 'Access-Control-Allow-Origin': origin || '' } });

    } catch (error) {
        console.error('[public/chatbots/config] error:', error);
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
