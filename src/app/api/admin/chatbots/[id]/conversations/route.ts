export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import { getChatbotById } from '@/lib/chatbot/service';

/**
 * GET /api/admin/chatbots/[id]/conversations — list conversations
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await getChatbotById(auth.context.tenantId, params.id);

        const conversations = await Conversation.find({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
        })
            .sort({ lastMessageAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json({
            conversations: conversations.map((c) => ({
                id: String(c._id),
                visitorId: c.visitorId,
                sessionId: c.sessionId,
                startedAt: c.startedAt,
                lastMessageAt: c.lastMessageAt,
                messageCount: c.messageCount,
                tokenUsage: c.tokenUsage,
            })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load conversations.';
        const status = message === 'Chatbot not found.' ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}