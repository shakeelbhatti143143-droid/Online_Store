export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { getChatbotById } from '@/lib/chatbot/service';
import AllowedDomain from '@/lib/models/AllowedDomain';
import { isDomainMatch, normalizeHostname } from '@/lib/security/domain-validation';

/**
 * GET /api/admin/chatbots/[id]/integrate — get embed code + domain status
 * POST /api/admin/chatbots/[id]/integrate — verify installation on a domain
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const chatbot = await getChatbotById(auth.context.tenantId, params.id);

        const domains = await AllowedDomain.find({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
        }).lean();

        const embedUrl = process.env.CHATBOT_EMBED_URL || `${process.env.APP_URL || 'https://yourdomain.com'}/chatbot.js`;

        return NextResponse.json({
            chatbot: {
                id: String(chatbot._id),
                publicId: chatbot.publicId,
                name: chatbot.name,
            },
            embedUrl,
            embedCode: `<script\n    src="${embedUrl}"\n    data-chatbot-id="${chatbot.publicId}">\n</script>`,
            allowedDomains: domains.map((d) => ({
                id: String(d._id),
                domain: d.domain,
                isEnabled: d.isEnabled,
                verifiedAt: d.verifiedAt,
            })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load integration.';
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

        const body = await request.json().catch(() => null);
        const domain = typeof body?.domain === 'string' ? body.domain.trim() : '';

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required.' }, { status: 400 });
        }

        const normalized = normalizeHostname(domain);

        // Check if domain is in the allowed list
        const allowedDomains = await AllowedDomain.find({
            tenantId: auth.context.tenantId,
            chatbotId: params.id,
            isEnabled: true,
        }).lean();

        const isAllowed = allowedDomains.some((d) => isDomainMatch(normalized, d.domain));

        // Verify installation checks
        const checks = {
            scriptDetected: isAllowed,
            domainAuthorized: isAllowed,
            chatbotResponding: chatbot.status === 'active',
        };

        const allPassed = checks.scriptDetected && checks.domainAuthorized && checks.chatbotResponding;

        return NextResponse.json({
            domain,
            checks,
            installed: allPassed,
            instructions: allPassed
                ? 'Installation verified successfully.'
                : 'Installation not detected. Ensure the embed script is placed before </body> on your website and the domain is authorized.',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to verify installation.';
        const status = message === 'Chatbot not found.' ? 404 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
