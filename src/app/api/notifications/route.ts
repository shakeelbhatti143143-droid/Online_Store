import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, isStaff, mongoErrorResponse, requireAuth } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    const data = await storeDb.getNotifications(user.id, isStaff(user));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to load notifications');
  }
}
