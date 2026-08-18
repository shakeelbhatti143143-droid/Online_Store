import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, isStaff, mongoErrorResponse, requireAuth } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    await storeDb.markNotificationAsRead(params.id, user.id, isStaff(user));
    return NextResponse.json({ success: true });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to update notification');
  }
}
