export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseJsonBody } from '@/lib/api/admin-auth';
import {
    getChatbotById,
    updateChatbot,
    duplicateChatbot,
    deleteChatbot,
    setChatbotStatus,
} from '@/lib/chatbot/service';

/**
 * GET /api/admin/chatbots/[id] — fetch a single chatbot (full config)
 * PUT /api/admin/chatbots/[id] — update chatbot config/appearance
 * DELETE /api/admin/chatbots/[id] — soft-delete chatbot
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const chatbot = await getChatbotById(auth.context.tenantId, params.id);

        return NextResponse.json({
            chatbot: {
                id: String(chatbot._id),
                publicId: chatbot.publicId,
                name: chatbot.name,
                description: chatbot.description,
                internalIdentifier: chatbot.internalIdentifier,
                status: chatbot.status,
                aiConfig: chatbot.aiConfig,
                appearance: chatbot.appearance,
                createdAt: chatbot.createdAt,
                updatedAt: chatbot.updatedAt,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load chatbot.';
        const status = message === 'Chatbot not found.' ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const body = await parseJsonBody(request);
        if (!body) {
            return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
        }

        // Extract valid update fields
        const input: Record<string, unknown> = {};
        if (typeof body.name === 'string') input.name = body.name.trim();
        if (typeof body.description === 'string') input.description = body.description;
        if (typeof body.internalIdentifier === 'string') input.internalIdentifier = body.internalIdentifier;
        if (body.status === 'active' || body.status === 'inactive') input.status = body.status;
        if (body.aiConfig && typeof body.aiConfig === 'object') input.aiConfig = body.aiConfig;
        if (body.appearance && typeof body.appearance === 'object') input.appearance = body.appearance;

        const chatbot = await updateChatbot(
            auth.context.tenantId,
            params.id,
            auth.context.session.adminId,
            input
        );

        return NextResponse.json({
            chatbot: {
                id: String(chatbot._id),
                publicId: chatbot.publicId,
                name: chatbot.name,
                status: chatbot.status,
                aiConfig: chatbot.aiConfig,
                appearance: chatbot.appearance,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update chatbot.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await deleteChatbot(auth.context.tenantId, params.id, auth.context.session.adminId);

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete chatbot.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}

/**
 * POST /api/admin/chatbots/[id]  — action endpoint (duplicate / activate / deactivate)
 * Body: { "action": "duplicate" | "activate" | "deactivate" }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const body = await parseJsonBody(request);
        const action = body?.action;

        if (action === 'duplicate') {
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
                    status: chatbot.status,
                },
            });
        }

        if (action === 'activate' || action === 'deactivate') {
            const status = action === 'activate' ? 'active' : 'inactive';
            const chatbot = await setChatbotStatus(
                auth.context.tenantId,
                params.id,
                auth.context.session.adminId,
                status
            );
            return NextResponse.json({
                chatbot: {
                    id: String(chatbot._id),
                    publicId: chatbot.publicId,
                    name: chatbot.name,
                    status: chatbot.status,
                },
            });
        }

        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Action failed.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}