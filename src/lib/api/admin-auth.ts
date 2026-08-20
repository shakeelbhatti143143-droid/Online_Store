import { NextResponse } from 'next/server';
import { getAdminSession, AdminSessionPayload } from '@/lib/admin-session';
import { resolveTenantIdForUser } from '@/lib/chatbot/service';

export interface AdminContext {
    session: AdminSessionPayload;
    tenantId: string;
}

/**
 * Verify the admin session and resolve their tenant context.
 * All admin API routes must call this helper first.
 * Returns a NextResponse error if unauthorized.
 */
export async function requireAdmin(request: Request): Promise<
    | { ok: true; context: AdminContext }
    | { ok: false; response: NextResponse }
> {
    const session = await getAdminSession(request);
    if (!session) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    try {
        const tenantId = await resolveTenantIdForUser(session.adminId);
        return {
            ok: true,
            context: { session, tenantId },
        };
    } catch (error) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: error instanceof Error ? error.message : 'Tenant resolution failed' },
                { status: 401 }
            ),
        };
    }
}

/**
 * Parse a JSON body safely. Returns null if invalid.
 */
export async function parseJsonBody(request: Request): Promise<Record<string, unknown> | null> {
    try {
        const body = await request.json();
        return body && typeof body === 'object' ? body : null;
    } catch {
        return null;
    }
}