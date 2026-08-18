import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Wishlist from '@/lib/models/Wishlist';
import { isAuthUser, mongoErrorResponse, requireAuth } from '@/lib/auth-server';

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    await connectDB();
    await Wishlist.deleteOne({ userId: user.id, productId: params.productId });
    return NextResponse.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    return mongoErrorResponse(error, 'Unable to save wishlist');
  }
}
