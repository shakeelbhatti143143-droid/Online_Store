export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';
import connectDB from '@/lib/mongodb';
import { mapUser } from '@/lib/data/mappers';

import { isAdminEmail, normalizeEmail } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const data = await storeDb.getCustomers();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to load users');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'User id is required.' }, { status: 400 });
    
    await connectDB();
    const targetUser = await User.findById(body.id);
    if (!targetUser) return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });

    const targetEmail = normalizeEmail(targetUser.email);
    const isTargetPrimaryAdmin = isAdminEmail(targetEmail);

    const updates: Record<string, unknown> = {};

    // Active status updates
    if (typeof body.isActive === 'boolean') {
      if (isTargetPrimaryAdmin && !body.isActive) {
        return NextResponse.json({ success: false, error: 'The primary administrator account cannot be deactivated.' }, { status: 403 });
      }
      updates.isActive = body.isActive;
    }

    // Role updates (Strictly enforce RBAC)
    if (body.role && body.role !== targetUser.role) {
      if (isTargetPrimaryAdmin && body.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'The primary administrator role cannot be altered.' }, { status: 403 });
      }
      if (body.role === 'admin' && !isTargetPrimaryAdmin) {
        return NextResponse.json({ success: false, error: 'Administrative role is exclusively reserved for the designated administrator email.' }, { status: 403 });
      }
      if (['user', 'admin'].includes(body.role)) {
        updates.role = body.role;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, data: mapUser(targetUser) });
    }

    const updatedUser = await User.findByIdAndUpdate(body.id, updates, { new: true });
    if (!updatedUser) return NextResponse.json({ success: false, error: 'Failed to update user.' }, { status: 500 });

    await AdminLog.create({
      adminId: staff.id,
      action: 'user_status_changed',
      entityType: 'user',
      entityId: body.id,
      details: updates,
    });

    return NextResponse.json({ success: true, data: mapUser(updatedUser) });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to update user');
  }
}
