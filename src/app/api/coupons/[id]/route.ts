import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const ok = await storeDb.deleteCoupon(params.id, staff.id);
    if (!ok) return NextResponse.json({ success: false, error: 'Coupon not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to delete coupon');
  }
}
