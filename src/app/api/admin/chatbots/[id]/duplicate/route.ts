export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { duplicateChatbot } from '@/lib/chatbot/service';

/**
 * Backwards-compatible duplicate endpoint. The admin UI uses the action on
 * /api/admin/chatbots/[id], but integrations may still call this path.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const chatbot = await duplicateChatbot(
            auth.context.tenantId,
            params.id,
            auth.context.session.adminId
        );

        return NextResponse.json({
            chatbot: {
                id: String(chatbot._id),
                publicId: chatbot.publicId,
                name: chatbot.name,
                description: chatbot.description,
                status: chatbot.status,
                aiConfig: chatbot.aiConfig,
                appearance: chatbot.appearance,
                createdAt: chatbot.createdAt,
                updatedAt: chatbot.updatedAt,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to duplicate chatbot.';
        return NextResponse.json({ error: message }, { status: message === 'Chatbot not found.' ? 404 : 400 });
    }
}
