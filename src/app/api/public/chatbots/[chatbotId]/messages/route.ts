export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendChatMessage, ChatError, MAX_MESSAGE_LENGTH } from '@/lib/chat/engine';

/**
 * POST /api/public/chatbots/[chatbotId]/messages
 *
 * Body: { "conversation_id": "conversation_123", "message": "How can I reset my password?" }
 *
 * Full backend flow runs server-side:
 *   validate chatbot -> check status -> check origin/domain -> find/create conversation
 *   -> save user message -> RAG -> AI provider -> save assistant message -> return
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { chatbotId: string } }
) {
    try {
        const { chatbotId } = params;
        if (!chatbotId || !chatbotId.startsWith('cb_')) {
            return NextResponse.json({ error: 'Chatbot not found.' }, { status: 404 });
        }

        // Parse body
        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
        }

        const message = typeof body.message === 'string' ? body.message : '';
        const conversationId = typeof body.conversation_id === 'string' ? body.conversation_id : undefined;
        const visitorId = typeof body.visitor_id === 'string' ? body.visitor_id : crypto.randomUUID();
        const sessionId = typeof body.session_id === 'string' ? body.session_id : crypto.randomUUID();

        // Validate message length server-side
        if (!message.trim()) {
            return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json({ error: 'Your message is too long.' }, { status: 400 });
        }

        // Extract Origin header for domain authorization
        const origin = request.headers.get('origin') || getRequestOrigin(request);

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

        // Set CORS headers for authorized origins
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
            { headers: { 'Access-Control-Allow-Origin': origin || '*' } }
        );

    } catch (error) {
        if (error instanceof ChatError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }
        console.error('[public/chatbots/messages] error:', error);
        return NextResponse.json(
            { error: 'Unable to process your request. Please try again.' },
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
