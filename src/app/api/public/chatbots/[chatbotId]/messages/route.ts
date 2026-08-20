export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
    sendChatMessage,
    ChatError,
    MAX_MESSAGE_LENGTH,
} from '@/lib/chat/engine';

/**
 * POST /api/public/chatbots/[chatbotId]/messages
 *
 * Body:
 * {
 *   "conversation_id": "conversation_123",
 *   "message": "How can I reset my password?"
 * }
 *
 * Supports requests from localhost, Vercel, custom domains,
 * and other origins. Actual chatbot/domain authorization is
 * handled by the chat engine/domain validation layer.
 */
export async function POST(
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

        // Parse request body
        let body: Record<string, unknown>;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid request body.' },
                { status: 400 }
            );
        }

        const message =
            typeof body.message === 'string' ? body.message : '';

        const conversationId =
            typeof body.conversation_id === 'string'
                ? body.conversation_id
                : undefined;

        const visitorId =
            typeof body.visitor_id === 'string'
                ? body.visitor_id
                : crypto.randomUUID();

        const sessionId =
            typeof body.session_id === 'string'
                ? body.session_id
                : crypto.randomUUID();

        // Validate message
        if (!message.trim()) {
            return NextResponse.json(
                { error: 'Message cannot be empty.' },
                { status: 400 }
            );
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json(
                { error: 'Your message is too long.' },
                { status: 400 }
            );
        }

        // Get requesting origin
        const origin =
            request.headers.get('origin') ||
            getRequestOrigin(request);

        const result = await sendChatMessage({
            publicChatbotId: chatbotId,
            conversationId,
            visitorId,
            sessionId,
            message,
            origin,
            request: {
                headers: {
                    get: (name) => request.headers.get(name),
                },
            },
        });

        return NextResponse.json(
            {
                conversation_id: result.conversationId,
                message: result.message,
                sources: result.sources.map((s) => ({
                    document_id: s.documentId,
                    file_name: s.fileName,
                    score: s.score,
                })),
            },
            {
                headers: createCorsHeaders(origin),
            }
        );
    } catch (error) {
        if (error instanceof ChatError) {
            return NextResponse.json(
                { error: error.message },
                {
                    status: error.status,
                    headers: createCorsHeaders(
                        null
                    ),
                }
            );
        }

        console.error(
            '[public/chatbots/messages] error:',
            error
        );

        return NextResponse.json(
            {
                error:
                    'Unable to process your request. Please try again.',
            },
            {
                status: 500,
                headers: createCorsHeaders(null),
            }
        );
    }
}

/**
 * OPTIONS /api/public/chatbots/[chatbotId]/messages
 *
 * Handles browser CORS preflight requests.
 */
export async function OPTIONS(request: NextRequest) {
    const origin =
        request.headers.get('origin') ||
        getRequestOrigin(request);

    return new NextResponse(null, {
        status: 204,
        headers: {
            ...createCorsHeaders(origin),
            'Access-Control-Max-Age': '86400',
        },
    });
}

/**
 * CORS headers.
 *
 * The actual authorization decision is NOT made here.
 * This only allows the browser to communicate with the API.
 */
function createCorsHeaders(origin: string | null) {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
            'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        Vary: 'Origin',
    };
}

function getRequestOrigin(
    request: NextRequest
): string | null {
    const host =
        request.headers.get('x-forwarded-host') ||
        request.headers.get('host');

    if (!host) {
        return null;
    }

    const protocol =
        request.headers.get('x-forwarded-proto') || 'https';

    return `${protocol}://${host}`;
}