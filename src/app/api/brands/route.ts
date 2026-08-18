import { NextRequest, NextResponse } from 'next/server';
import { storeDb } from '@/lib/data/store-db';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';

export async function GET() {
  try {
    const data = await storeDb.getBrands();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to fetch brands');
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json({ success: false, error: 'Brand name is required.' }, { status: 400 });
    }
    const created = await storeDb.createBrand(body, staff.id);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to create brand');
  }
}
