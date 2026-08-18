export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Address from '@/lib/models/Address';
import { isAuthUser, mongoErrorResponse, requireAuth } from '@/lib/auth-server';

function toAddress(doc: any) {
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: '',
    phone: doc.phone,
    addressLine1: doc.addressLine1,
    addressLine2: doc.addressLine2,
    city: doc.city,
    state: doc.state,
    postalCode: doc.postalCode,
    country: doc.country,
    isDefault: Boolean(doc.isDefault),
  };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    const body = await request.json();
    await connectDB();
    const existing = await Address.findOne({ _id: params.id, userId: user.id });
    if (!existing) return NextResponse.json({ success: false, error: 'Address not found.' }, { status: 404 });

    if (body.isDefault) {
      await Address.updateMany({ userId: user.id, _id: { $ne: existing._id } }, { isDefault: false });
    }

    existing.fullName = body.fullName ?? existing.fullName;
    existing.phone = body.phone ?? existing.phone;
    existing.addressLine1 = body.addressLine1 ?? existing.addressLine1;
    existing.addressLine2 = body.addressLine2 ?? existing.addressLine2;
    existing.city = body.city ?? existing.city;
    existing.state = body.state ?? existing.state;
    existing.postalCode = body.postalCode ?? existing.postalCode;
    existing.country = body.country ?? existing.country;
    if (body.isDefault !== undefined) existing.isDefault = Boolean(body.isDefault);
    await existing.save();
    return NextResponse.json({ success: true, data: toAddress(existing) });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to update address');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    await connectDB();
    const res = await Address.deleteOne({ _id: params.id, userId: user.id });
    if (!res.deletedCount) return NextResponse.json({ success: false, error: 'Address not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to delete address');
  }
}
