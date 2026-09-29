export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';
import { getAdminSession } from '@/lib/admin-session';
import { isAdminEmail } from '@/lib/config';

export async function GET(request: NextRequest) {
    try {
        const session = await getAdminSession(request);

        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Verify the admin still exists, has role admin, is active, is verified, and matches the dedicated admin email
        await connectDB();
        const admin = await User.findById(session.adminId).select('-password');

        if (
            !admin ||
            admin.role !== 'admin' ||
            admin.isActive === false ||
            admin.emailVerified !== true ||
            !isAdminEmail(admin.email)
        ) {
            return NextResponse.json({ authenticated: false, error: 'Unauthorized admin access.' }, { status: 403 });
        }

        // Log admin access
        try {
            await AdminLog.create({
                adminId: admin._id,
                action: 'ADMIN_ACCESS',
                entityType: 'auth',
                entityId: '',
                details: {
                    email: admin.email,
                    message: 'Admin accessed the admin portal',
                    ip: getClientIp(request),
                },
            });
        } catch (logErr) {
            console.error('[admin/me] AdminLog error:', logErr);
        }

        return NextResponse.json({
            authenticated: true,
            admin: {
                id: String(admin._id),
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role,
                createdAt: admin.createdAt,
            },
        });
    } catch (error) {
        console.error('[admin/me] error:', error);
        return NextResponse.json({ authenticated: false });
    }
}

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
}
