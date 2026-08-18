export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';
import { verifyToken, toUserProfile } from '@/lib/auth';
import { isAuthUser, requireAuth } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: 'User no longer exists.' }, { status: 401 });
    }

    return NextResponse.json({ user: toUserProfile(user) });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Something went wrong while fetching your profile.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!isAuthUser(auth)) return auth;
    const body = await request.json();
    await connectDB();
    const user = await User.findById(auth.id);
    if (!user) return NextResponse.json({ error: 'User no longer exists.' }, { status: 401 });

    if (typeof body.fullName === 'string' && body.fullName.trim().length >= 2) {
      user.fullName = body.fullName.trim();
    }
    if (typeof body.phone === 'string') user.phone = body.phone;
    if (typeof body.avatarUrl === 'string') user.avatarUrl = body.avatarUrl;
    await user.save();

    // Log admin profile updates
    if (user.role === 'admin') {
      try {
        await AdminLog.create({
          adminId: user._id,
          action: 'ADMIN_PROFILE_UPDATED',
          entityType: 'auth',
          entityId: '',
          details: {
            email: user.email,
            message: 'Admin profile updated',
            updatedFields: Object.keys(body).filter(k => ['fullName', 'phone', 'avatarUrl'].includes(k)),
          },
        });
      } catch (logErr) {
        console.error('[auth/me] AdminLog error:', logErr);
      }
    }

    return NextResponse.json({ user: toUserProfile(user) });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Unable to update profile.' }, { status: 500 });
  }
}
