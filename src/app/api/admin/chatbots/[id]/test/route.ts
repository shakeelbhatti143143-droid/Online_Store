export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseJsonBody } from '@/lib/api/admin-auth';
import { getChatbotById } from '@/lib/chatbot/service';
import { sendTestMessage, ChatError } from '@/lib/chat/engine';

/**
 * POST /api/admin/chatbots/[id]/test
 * Body: { "message": "How can I reset my password?" }
 *
 * Sends a test message through the EXACT same backend flow
 * the external website will use (RAG + AI provider).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        // Verify the chatbot belongs to this tenant
        const chatbot = await getChatbotById(auth.context.tenantId, params.id);

        const body = await parseJsonBody(request);
        if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

        const message = typeof body.message === 'string' ? body.message.trim() : '';
        if (!message) {
            return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
        }

        const result = await sendTestMessage({
            publicChatbotId: chatbot.publicId,
            message,
        });

        return NextResponse.json({
            chatbotId: chatbot.publicId,
            conversation_id: result.conversationId,
            message: result.message,
            sources: result.sources.map((s) => ({
                document_id: s.documentId,
                file_name: s.fileName,
                score: s.score,
            })),
        });
    } catch (error) {
        if (error instanceof ChatError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('[admin/chatbots/test] error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Test failed.' },
            { status: 400 }
        );
    }
}