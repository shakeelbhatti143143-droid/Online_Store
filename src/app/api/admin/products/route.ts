import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const data = await storeDb.getAllProductsAdmin();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to load products');
  }
}
