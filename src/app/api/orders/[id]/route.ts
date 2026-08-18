import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isStaff, mongoErrorResponse } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }
    const order = await storeDb.getOrderById(params.id, isStaff(user) ? undefined : user.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    if (!isStaff(user) && order.userId && order.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to retrieve order');
  }
}
