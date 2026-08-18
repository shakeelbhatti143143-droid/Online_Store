import { NextRequest, NextResponse } from 'next/server';
import AdminLog from '@/lib/models/AdminLog';
import { getAdminSession, clearAdminSessionCookie } from '@/lib/admin-session';

export async function POST(request: NextRequest) {
    try {
        const session = await getAdminSession(request);

        // Log logout if we have a valid session
        if (session) {
            try {
                await AdminLog.create({
                    adminId: session.adminId,
                    action: 'ADMIN_LOGOUT',
                    entityType: 'auth',
                    entityId: '',
                    details: { ip: getClientIp(request), email: session.email },
                });
            } catch (err) {
                console.error('[admin/logout] AdminLog error:', err);
            }
        }

        const response = NextResponse.json({
            success: true,
            redirectTo: '/admin/login',
        });

        // Clear the admin session cookie
        clearAdminSessionCookie(response);

        return response;
    } catch (error) {
        console.error('[admin/logout] error:', error);
        const response = NextResponse.json({ error: 'Something went wrong during logout.' }, { status: 500 });
        clearAdminSessionCookie(response);
        return response;
    }
}

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
}
