export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    await connectDB();
    const docs = await Address.find({ userId: user.id }).sort({ isDefault: -1, createdAt: -1 });
    return NextResponse.json({ success: true, data: docs.map(toAddress) });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to load addresses');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    const body = await request.json();
    if (!body.fullName || !body.phone || !body.addressLine1 || !body.city || !body.state || !body.postalCode || !body.country) {
      return NextResponse.json({ success: false, error: 'All required address fields must be provided.' }, { status: 400 });
    }
    await connectDB();
    const existingCount = await Address.countDocuments({ userId: user.id });
    const makeDefault = body.isDefault || existingCount === 0;
    const session = await mongoose.startSession();
    let created: any = null;
    try {
      await session.withTransaction(async () => {
        if (makeDefault) {
          await Address.updateMany({ userId: user.id }, { isDefault: false }, { session });
        }
        const docs = await Address.create(
          [
            {
              userId: user.id,
              fullName: body.fullName,
              phone: body.phone,
              addressLine1: body.addressLine1,
              addressLine2: body.addressLine2 || '',
              city: body.city,
              state: body.state,
              postalCode: body.postalCode,
              country: body.country,
              isDefault: makeDefault,
            },
          ],
          { session }
        );
        created = docs[0];
      });
    } finally {
      session.endSession();
    }
    return NextResponse.json({ success: true, data: toAddress(created) }, { status: 201 });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to save address');
  }
}
