import { NextRequest, NextResponse } from 'next/server';
import { isAuthUser, mongoErrorResponse, requireAuth } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';
import Review from '@/lib/models/Review';
import connectDB from '@/lib/mongodb';
import { mapReview } from '@/lib/data/mappers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required.' }, { status: 400 });
    }
    await connectDB();
    const docs = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: docs.map(mapReview) });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to load reviews');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    const body = await request.json();
    if (!body.productId || !body.comment || body.rating == null) {
      return NextResponse.json({ success: false, error: 'productId, rating, and comment are required.' }, { status: 400 });
    }
    const review = await storeDb.addProductReview(
      body.productId,
      {
        userName: user.fullName,
        rating: Number(body.rating),
        title: body.title,
        comment: body.comment,
      },
      user.id
    );
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create review';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
