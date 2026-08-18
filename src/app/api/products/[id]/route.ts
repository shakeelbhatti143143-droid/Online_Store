import { NextRequest, NextResponse } from 'next/server';
import { storeDb } from '@/lib/data/store-db';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await storeDb.getProductBySlug(params.id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to fetch product');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const body = await request.json();
    const updated = await storeDb.updateProduct(params.id, body, staff.id);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to update product');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const ok = await storeDb.deleteProduct(params.id, staff.id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to delete product');
  }
}
