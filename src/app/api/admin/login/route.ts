import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';
import { verifyPassword } from '@/lib/auth';
import { signAdminSession, setAdminSessionCookie } from '@/lib/admin-session';
import { normalizeEmail } from '@/lib/config';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        const normalizedEmail = normalizeEmail(String(email));

        await connectDB();

        // Find the admin user: email must match, role must be 'admin', account must be active
        const admin = await User.findOne({
            email: normalizedEmail,
            role: 'admin',
            isActive: { $ne: false },
        }).select('+password');

        if (!admin) {
            // Log failed attempt (email not found or not an admin)
            await logAdminAction({
                adminId: null,
                email: normalizedEmail,
                action: 'ADMIN_LOGIN_FAILED',
                entityType: 'auth',
                details: { reason: 'admin_not_found', ip: getClientIp(request) },
            });
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // Verify password using bcrypt
        const isPasswordValid = await verifyPassword(password, admin.password);
        if (!isPasswordValid) {
            // Log failed attempt (wrong password)
            await logAdminAction({
                adminId: admin._id,
                email: admin.email,
                action: 'ADMIN_LOGIN_FAILED',
                entityType: 'auth',
                details: { reason: 'invalid_password', ip: getClientIp(request) },
            });
            return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        // Create admin session token
        const sessionToken = signAdminSession({
            adminId: String(admin._id),
            email: admin.email,
            role: admin.role,
        });

        // Log successful login
        await logAdminAction({
            adminId: admin._id,
            email: admin.email,
            action: 'ADMIN_LOGIN_SUCCESS',
            entityType: 'auth',
            details: { ip: getClientIp(request), userAgent: request.headers.get('user-agent') || '' },
        });

        const response = NextResponse.json({
            success: true,
            redirectTo: '/admin',
            admin: {
                id: String(admin._id),
                email: admin.email,
                role: admin.role,
            },
        });

        // Set secure HTTP-only cookie
        setAdminSessionCookie(response, sessionToken);

        return response;
    } catch (error) {
        console.error('[admin/login] error:', error);
        return NextResponse.json({ error: 'Something went wrong during login. Please try again.' }, { status: 500 });
    }
}

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
}

async function logAdminAction(params: {
    adminId: any;
    email: string;
    action: string;
    entityType: string;
    details?: Record<string, unknown>;
}) {
    try {
        await AdminLog.create({
            adminId: params.adminId,
            action: params.action,
            entityType: params.entityType,
            entityId: '',
            details: { ...(params.details || {}), email: params.email },
        });
    } catch (err) {
        console.error('[admin/login] AdminLog error:', err);
    }
}