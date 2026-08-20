export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseJsonBody } from '@/lib/api/admin-auth';
import connectDB from '@/lib/mongodb';
import AllowedDomain from '@/lib/models/AllowedDomain';
import AdminLog from '@/lib/models/AdminLog';
import { getChatbotById } from '@/lib/chatbot/service';
import { normalizeAllowedDomain, isValidDomainInput } from '@/lib/security/domain-validation';
import crypto from 'crypto';

/**
 * GET /api/admin/chatbots/[id]/domains — list allowed domains
 * POST /api/admin/chatbots/[id]/domains — add an allowed domain
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        await getChatbotById(auth.context.tenantId, params.id);

        const domains = await AllowedDomain.find({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
        }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({
            domains: domains.map((d) => ({
                id: String(d._id),
                domain: d.domain,
                isEnabled: d.isEnabled,
                verifiedAt: d.verifiedAt,
                createdAt: d.createdAt,
            })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load domains.';
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

        const body = await parseJsonBody(request);
        if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

        const domainInput = typeof body.domain === 'string' ? body.domain.trim() : '';
        if (!isValidDomainInput(domainInput)) {
            return NextResponse.json({ error: 'Invalid domain format.' }, { status: 400 });
        }

        const normalized = normalizeAllowedDomain(domainInput);

        // Check for duplicate
        const existing = await AllowedDomain.findOne({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
            domain: normalized,
        });
        if (existing) {
            return NextResponse.json({ error: 'This domain is already added.' }, { status: 409 });
        }

        const domain = await AllowedDomain.create({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
            domain: normalized,
            isEnabled: true,
            verificationToken: crypto.randomBytes(16).toString('hex'),
        });

        await AdminLog.create({
            adminId: auth.context.session.adminId,
            action: 'DOMAIN_ADDED',
            entityType: 'chatbot_domain',
            entityId: String(domain._id),
            details: { chatbotId: params.id, domain: normalized },
        });

        return NextResponse.json(
            {
                domain: {
                    id: String(domain._id),
                    domain: domain.domain,
                    isEnabled: domain.isEnabled,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add domain.';
        const status = message === 'Chatbot not found.' ? 404 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}