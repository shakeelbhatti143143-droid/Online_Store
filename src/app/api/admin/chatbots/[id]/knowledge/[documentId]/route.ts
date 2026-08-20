export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import connectDB from '@/lib/mongodb';
import KnowledgeDocument from '@/lib/models/KnowledgeDocument';
import { getChatbotById } from '@/lib/chatbot/service';

/**
 * DELETE /api/admin/chatbots/[id]/knowledge/[documentId] — soft-delete a document
 * POST /api/admin/chatbots/[id]/knowledge/[documentId] — reindex a document
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; documentId: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await getChatbotById(auth.context.tenantId, params.id);

        const doc = await KnowledgeDocument.findOneAndUpdate(
            {
                _id: params.documentId,
                tenantId: auth.context.tenantId,
                chatbotId: params.id,
                isDeleted: false,
            },
            { $set: { isDeleted: true } },
            { new: true }
        );

        if (!doc) {
            return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete document.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; documentId: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await getChatbotById(auth.context.tenantId, params.id);

        const doc = await KnowledgeDocument.findOne({
            _id: params.documentId,
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
            isDeleted: false,
        });
        if (!doc) {
            return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
        }

        // Re-process the document
        doc.status = 'pending';
        doc.errorMessage = '';
        await doc.save();

        // Fire-and-forget processing
        const { processKnowledgeDocument } = await import('@/lib/knowledge/processor');
        processKnowledgeDocument(params.documentId).catch((err) => {
            console.error('[knowledge] reindex failed:', err);
        });

        return NextResponse.json({
            document: {
                id: String(doc._id),
                status: 'pending',
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reindex document.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}