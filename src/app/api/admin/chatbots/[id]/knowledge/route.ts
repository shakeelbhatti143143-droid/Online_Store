export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseJsonBody } from '@/lib/api/admin-auth';
import connectDB from '@/lib/mongodb';
import KnowledgeDocument from '@/lib/models/KnowledgeDocument';
import { getChatbotById } from '@/lib/chatbot/service';
import { processKnowledgeDocument } from '@/lib/knowledge/processor';

/**
 * GET /api/admin/chatbots/[id]/knowledge — list documents
 * POST /api/admin/chatbots/[id]/knowledge — add knowledge (URL or text)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        // Verify chatbot ownership
        await getChatbotById(auth.context.tenantId, params.id);

        const docs = await KnowledgeDocument.find({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
            isDeleted: false,
        }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({
            documents: docs.map((d) => ({
                id: String(d._id),
                sourceType: d.sourceType,
                fileName: d.fileName,
                fileType: d.fileType,
                fileSize: d.fileSize,
                sourceUrl: d.sourceUrl,
                status: d.status,
                chunkCount: d.chunkCount,
                errorMessage: d.errorMessage,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt,
            })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load knowledge.';
        const status = message === 'Chatbot not found.' ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const chatbot = await getChatbotById(auth.context.tenantId, params.id);

        const contentType = request.headers.get('content-type') || '';

        // Multipart file upload
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;
            if (!file) {
                return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
            }

            const fileName = file.name || 'document';
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = (fileName.split('.').pop() || '').toLowerCase();

            const doc = await KnowledgeDocument.create({
                tenantId: auth.context.tenantId,
                chatbotId: params.id,
                sourceType: 'file',
                fileName,
                fileType: ext,
                fileSize: file.size,
                status: 'pending',
            });

            // Fire-and-forget background processing
            processKnowledgeDocument(String(doc._id), {
                file: {
                    buffer,
                    fileName,
                    mimeType: file.type,
                },
            }).catch((err) => {
                console.error('[knowledge] file processing failed:', err);
            });

            return NextResponse.json(
                {
                    document: {
                        id: String(doc._id),
                        sourceType: 'file',
                        fileName,
                        fileType: ext,
                        fileSize: file.size,
                        status: 'pending',
                    },
                },
                { status: 201 }
            );
        }

        const body = await parseJsonBody(request);
        if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

        const sourceType = body.sourceType === 'url' || body.sourceType === 'text' || body.sourceType === 'file' ? body.sourceType : null;
        if (!sourceType) {
            return NextResponse.json({ error: 'sourceType must be "file", "url", or "text".' }, { status: 400 });
        }

        // Base64 file upload via JSON
        if (sourceType === 'file') {
            const fileName = typeof body.fileName === 'string' ? body.fileName : 'document.txt';
            const base64Data = typeof body.fileData === 'string' ? body.fileData : '';
            if (!base64Data) {
                return NextResponse.json({ error: 'fileData (base64) is required.' }, { status: 400 });
            }

            const buffer = Buffer.from(base64Data.replace(/^data:.*?;base64,/, ''), 'base64');
            const ext = (fileName.split('.').pop() || '').toLowerCase();

            const doc = await KnowledgeDocument.create({
                tenantId: auth.context.tenantId,
                chatbotId: params.id,
                sourceType: 'file',
                fileName,
                fileType: ext,
                fileSize: buffer.length,
                status: 'pending',
            });

            processKnowledgeDocument(String(doc._id), {
                file: { buffer, fileName, mimeType: typeof body.mimeType === 'string' ? body.mimeType : undefined },
            }).catch((err) => {
                console.error('[knowledge] base64 file processing failed:', err);
            });

            return NextResponse.json(
                {
                    document: {
                        id: String(doc._id),
                        sourceType: 'file',
                        fileName,
                        status: 'pending',
                    },
                },
                { status: 201 }
            );
        }

        // URL source
        if (sourceType === 'url') {
            const url = typeof body.url === 'string' ? body.url.trim() : '';
            if (!url || !/^https?:\/\//i.test(url)) {
                return NextResponse.json({ error: 'A valid URL is required.' }, { status: 400 });
            }

            const doc = await KnowledgeDocument.create({
                tenantId: auth.context.tenantId,
                chatbotId: params.id,
                sourceType: 'url',
                sourceUrl: url,
                fileName: url,
                fileType: 'url',
                status: 'pending',
            });

            // Fire-and-forget processing
            processKnowledgeDocument(String(doc._id), { url }).catch((err) => {
                console.error('[knowledge] URL processing failed:', err);
            });

            return NextResponse.json(
                {
                    document: {
                        id: String(doc._id),
                        sourceType: 'url',
                        sourceUrl: url,
                        status: 'pending',
                    },
                },
                { status: 201 }
            );
        }

        // Plain text source
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (!text) {
            return NextResponse.json({ error: 'Text content is required.' }, { status: 400 });
        }
        if (text.length > 100000) {
            return NextResponse.json({ error: 'Text content is too large (max 100K chars).' }, { status: 400 });
        }

        const doc = await KnowledgeDocument.create({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
            sourceType: 'text',
            content: text,
            fileName: typeof body.fileName === 'string' && body.fileName ? body.fileName : 'Plain Text Input',
            fileType: 'text',
            status: 'pending',
        });

        // Fire-and-forget processing
        processKnowledgeDocument(String(doc._id), { text }).catch((err) => {
            console.error('[knowledge] text processing failed:', err);
        });

        return NextResponse.json(
            {
                document: {
                    id: String(doc._id),
                    sourceType: 'text',
                    status: 'pending',
                },
            },
            { status: 201 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add knowledge.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}