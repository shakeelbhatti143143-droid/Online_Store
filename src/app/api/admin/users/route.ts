import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';
import User from '@/lib/models/User';
import AdminLog from '@/lib/models/AdminLog';
import connectDB from '@/lib/mongodb';
import { mapUser } from '@/lib/data/mappers';

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
    const updates: Record<string, unknown> = {};
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive;
    if (body.role && staff.role === 'admin' && ['user', 'admin'].includes(body.role)) {
      updates.role = body.role;
    }
    const user = await User.findByIdAndUpdate(body.id, updates, { new: true });
    if (!user) return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    await AdminLog.create({
      adminId: staff.id,
      action: 'user_status_changed',
      entityType: 'user',
      entityId: body.id,
      details: updates,
    });
    return NextResponse.json({ success: true, data: mapUser(user) });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to update user');
  }
}
