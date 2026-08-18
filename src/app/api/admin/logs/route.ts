export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const logs = await storeDb.getAdminLogs();
    return NextResponse.json({
      success: true,
      data: logs.map((log: any) => ({
        id: String(log._id),
        adminId: String(log.adminId),
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to load admin logs');
  }
}
