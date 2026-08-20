export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseJsonBody } from '@/lib/api/admin-auth';
import AllowedDomain from '@/lib/models/AllowedDomain';
import AdminLog from '@/lib/models/AdminLog';
import { getChatbotById } from '@/lib/chatbot/service';

/**
 * DELETE /api/admin/chatbots/[id]/domains/[domainId] — remove an allowed domain
 * POST /api/admin/chatbots/[id]/domains/[domainId] — toggle domain enable/disable
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; domainId: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await getChatbotById(auth.context.tenantId, params.id);

        const domain = await AllowedDomain.findOneAndDelete({
            _id: params.domainId,
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
        });

        if (!domain) {
            return NextResponse.json({ error: 'Domain not found.' }, { status: 404 });
        }

        await AdminLog.create({
            adminId: auth.context.session.adminId,
            action: 'DOMAIN_REMOVED',
            entityType: 'chatbot_domain',
            entityId: String(domain._id),
            details: { chatbotId: params.id, domain: domain.domain },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove domain.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; domainId: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await getChatbotById(auth.context.tenantId, params.id);

        const body = await parseJsonBody(request);
        const isEnabled = body?.isEnabled === true;

        const domain = await AllowedDomain.findOneAndUpdate(
            {
                _id: params.domainId,
                tenantId: auth.context.tenantId,
                chatbotId: params.id,
            },
            { $set: { isEnabled } },
            { new: true }
        );

        if (!domain) {
            return NextResponse.json({ error: 'Domain not found.' }, { status: 404 });
        }

        return NextResponse.json({
            domain: {
                id: String(domain._id),
                domain: domain.domain,
                isEnabled: domain.isEnabled,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update domain.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}