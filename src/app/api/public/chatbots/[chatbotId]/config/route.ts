export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chatbot from '@/lib/models/Chatbot';
import { isOriginAuthorized } from '@/lib/security/domain-validation';

/**
 * GET /api/public/chatbots/[chatbotId]/config
 *
 * Returns safe public chatbot configuration.
 *
 * The chatbot can be loaded from:
 * - localhost
 * - Vercel
 * - custom domains
 * - other domains
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
                {
                    status: 404,
                    headers: createCorsHeaders(
                        request
                            .headers
                            .get('origin')
                    ),
                }
            );
        }

        await connectDB();

        const chatbot = await Chatbot.findOne({
            publicId: chatbotId,
            isDeleted: false,
        })
            .select(
                'publicId name status aiConfig.welcomeMessage appearance'
            )
            .lean();

        if (!chatbot) {
            return NextResponse.json(
                { error: 'Chatbot not found.' },
                {
                    status: 404,
                    headers: createCorsHeaders(
                        request
                            .headers
                            .get('origin')
                    ),
                }
            );
        }

        if (chatbot.status !== 'active') {
            return NextResponse.json(
                {
                    error:
                        'This chatbot is currently disabled.',
                },
                {
                    status: 403,
                    headers: createCorsHeaders(
                        request
                            .headers
                            .get('origin')
                    ),
                }
            );
        }

        /**
         * Get requesting website origin.
         */
        const origin =
            request.headers.get('origin') ||
            getRequestOrigin(request);

        /**
         * Domain authorization.
         *
         * The updated domain-validation.ts allows
         * localhost, Vercel, custom domains and other
         * origins.
         */
        const domainCheck = await isOriginAuthorized(
            chatbot._id,
            origin
        );

        if (!domainCheck.authorized) {
            return NextResponse.json(
                {
                    error:
                        'This website is not authorized to use this chatbot.',
                },
                {
                    status: 403,
                    headers: createCorsHeaders(origin),
                }
            );
        }

        /**
         * Keep the original Mongoose type.
         *
         * Do NOT cast to Record<string, unknown>.
         * This fixes TypeScript error TS2352.
         */
        const appearance =
            chatbot.appearance || {};

        return NextResponse.json(
            {
                id: chatbot.publicId,

                name: chatbot.name,

                status: chatbot.status,

                welcome_message:
                    chatbot.appearance?.welcomeMessage ||
                    chatbot.aiConfig?.welcomeMessage ||
                    'Hello! How can I help you today?',

                appearance: {
                    title:
                        appearance.title ||
                        chatbot.name,

                    subtitle:
                        appearance.subtitle ||
                        '',

                    logoUrl:
                        appearance.logoUrl ||
                        '',

                    avatarUrl:
                        appearance.avatarUrl ||
                        '',

                    primary_color:
                        appearance.primaryColor ||
                        '#2563EB',

                    secondary_color:
                        appearance.secondaryColor ||
                        '#1E40AF',

                    text_color:
                        appearance.textColor ||
                        '#1F2937',

                    background_color:
                        appearance.backgroundColor ||
                        '#FFFFFF',

                    user_message_color:
                        appearance.userMessageColor ||
                        '#2563EB',

                    bot_message_color:
                        appearance.botMessageColor ||
                        '#F3F4F6',

                    border_radius:
                        appearance.borderRadius ||
                        12,

                    font_size:
                        appearance.fontSize ||
                        14,

                    position:
                        appearance.position ||
                        'bottom-right',

                    button_icon:
                        appearance.buttonIcon ||
                        'chat',

                    button_size:
                        appearance.buttonSize ||
                        58,

                    placeholder_text:
                        appearance.placeholderText ||
                        'Type your message...',

                    show_branding:
                        appearance.showBranding !== false,
                },
            },
            {
                status: 200,
                headers: createCorsHeaders(origin),
            }
        );
    } catch (error) {
        console.error(
            '[public/chatbots/config] error:',
            error
        );

        const origin =
            request.headers.get('origin') ||
            getRequestOrigin(request);

        return NextResponse.json(
            {
                error:
                    'Unable to load chatbot configuration.',
            },
            {
                status: 500,
                headers: createCorsHeaders(origin),
            }
        );
    }
}

/**
 * OPTIONS /api/public/chatbots/[chatbotId]/config
 *
 * Handles browser CORS preflight requests.
 */
export async function OPTIONS(
    request: NextRequest
) {
    const origin =
        request.headers.get('origin') ||
        getRequestOrigin(request);

    return new NextResponse(null, {
        status: 204,

        headers: {
            ...createCorsHeaders(origin),

            'Access-Control-Max-Age':
                '86400',
        },
    });
}

/**
 * CORS configuration.
 *
 * Allows requests from:
 * - localhost
 * - Vercel
 * - custom domains
 * - other domains
 *
 * NOTE:
 * Because credentials are enabled, we return the
 * requesting origin instead of using '*'.
 */
function createCorsHeaders(
    origin: string | null
) {
    return {
        'Access-Control-Allow-Origin':
            origin || '*',

        'Access-Control-Allow-Methods':
            'GET, OPTIONS',

        'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With',

        'Access-Control-Allow-Credentials':
            'true',

        Vary: 'Origin',
    };
}

/**
 * Get origin from forwarded proxy headers or host.
 */
function getRequestOrigin(
    request: NextRequest
): string | null {
    const host =
        request.headers.get(
            'x-forwarded-host'
        ) ||
        request.headers.get('host');

    if (!host) {
        return null;
    }

    const protocol =
        request.headers.get(
            'x-forwarded-proto'
        ) || 'https';

    return `${protocol}://${host}`;
}