import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const body = await request.json();
    const updates: { status?: string; paymentStatus?: string; trackingNumber?: string } = {};
    if (body.status) {
      if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid order status.' }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.paymentStatus) {
      if (!['pending', 'paid', 'failed', 'refunded'].includes(body.paymentStatus)) {
        return NextResponse.json({ success: false, error: 'Invalid payment status.' }, { status: 400 });
      }
      updates.paymentStatus = body.paymentStatus;
    }
    if (typeof body.trackingNumber === 'string') updates.trackingNumber = body.trackingNumber;

    let updated = null;
    if (updates.status && Object.keys(updates).length === 1) {
      updated = await storeDb.updateOrderStatus(params.id, updates.status as any, staff.id);
    } else {
      updated = await storeDb.updateOrderAdmin(params.id, updates as any, staff.id);
    }
    if (!updated) return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to update order');
  }
}
