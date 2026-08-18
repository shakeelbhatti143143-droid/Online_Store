import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { IUser } from '@/lib/models/User';
import { verifyToken, AuthTokenPayload } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin-session';

export type AuthUser = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  fullName: string;
  isActive: boolean;
};

export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // First try the Bearer token (regular user session)
  const token = getBearerToken(request);
  let payload: AuthTokenPayload | null = null;
  if (token) {
    payload = verifyToken(token);
  }

  // If no Bearer token, try the admin session cookie
  if (!payload?.userId) {
    const adminSession = await getAdminSession(request);
    if (adminSession?.adminId) {
      payload = {
        userId: adminSession.adminId,
        email: adminSession.email,
        role: adminSession.role,
      };
    }
  }

  if (!payload?.userId) return null;

  await connectDB();
  const user = await User.findById(payload.userId).lean<{
    _id: unknown;
    email: string;
    fullName: string;
    role: 'user' | 'admin';
    isActive: boolean;
  }>();
  if (!user || user.isActive === false) return null;

  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    isActive: true,
  };
}

export async function requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }
  return user;
}

export function isStaff(user: AuthUser): boolean {
  return user.role === 'admin';
}

export async function requireStaff(request: NextRequest): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;
  if (!isStaff(result)) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
  }
  return result;
}

export function isAuthUser(value: AuthUser | NextResponse): value is AuthUser {
  return !(value instanceof NextResponse);
}

export function mongoErrorResponse(error: unknown, fallback = 'Database request failed') {
  const message = error instanceof Error ? error.message : fallback;
  console.error('[api]', message, error);
  if (typeof message === 'string' && message.includes('E11000')) {
    return NextResponse.json({ success: false, error: 'A record with those unique fields already exists.' }, { status: 409 });
  }
  return NextResponse.json({ success: false, error: fallback }, { status: 500 });
}
