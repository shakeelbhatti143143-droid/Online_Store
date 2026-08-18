import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const data = await storeDb.getCoupons();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to load coupons');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'validate') {
      const code = String(body.code || '').trim();
      const subtotal = Number(body.subtotal) || 0;
      if (!code) return NextResponse.json({ valid: false, message: 'Promo code is required.' }, { status: 400 });
      const result = await storeDb.validateCoupon(code, subtotal);
      return NextResponse.json(result);
    }

    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    if (!body.code || body.discountValue == null) {
      return NextResponse.json({ success: false, error: 'Coupon code and discount value are required.' }, { status: 400 });
    }
    if (!['percentage', 'fixed'].includes(body.discountType || 'percentage')) {
      return NextResponse.json({ success: false, error: 'Invalid discount type.' }, { status: 400 });
    }
    const created = await storeDb.createCoupon(body, staff.id);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to save coupon');
  }
}
