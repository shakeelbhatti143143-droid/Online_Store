export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import { getChatbotById } from '@/lib/chatbot/service';

/**
 * GET /api/admin/chatbots/[id]/conversations/[conversationId] — fetch a conversation + messages
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; conversationId: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await getChatbotById(auth.context.tenantId, params.id);

        const conversation = await Conversation.findOne({
            _id: params.conversationId,
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
        }).lean();

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
        }

        const messages = await Message.find({
            conversationId: params.conversationId,
            tenantId: auth.context.tenantId,
        })
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({
            conversation: {
                id: String(conversation._id),
                visitorId: conversation.visitorId,
                sessionId: conversation.sessionId,
                startedAt: conversation.startedAt,
                lastMessageAt: conversation.lastMessageAt,
                messageCount: conversation.messageCount,
                tokenUsage: conversation.tokenUsage,
            },
            messages: messages.map((m) => ({
                id: String(m._id),
                role: m.role,
                content: m.content,
                createdAt: m.createdAt,
                tokenUsage: m.tokenUsage,
                sources: m.sources,
            })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load conversation.';
        const status = message === 'Chatbot not found.' ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
