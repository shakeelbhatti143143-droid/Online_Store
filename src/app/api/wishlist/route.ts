import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Wishlist from '@/lib/models/Wishlist';
import Product from '@/lib/models/Product';
import { isAuthUser, mongoErrorResponse, requireAuth } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    await connectDB();
    const rows = await Wishlist.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
    const wanted = new Set(rows.map((r) => String(r.productId)));
    const products = (await storeDb.getProducts()).filter((p) => wanted.has(p.id));
    products.sort((a, b) => {
      const ai = rows.findIndex((r) => String(r.productId) === a.id);
      const bi = rows.findIndex((r) => String(r.productId) === b.id);
      return ai - bi;
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return mongoErrorResponse(error, 'Unable to load wishlist');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    const body = await request.json();
    const productId = body.productId;
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required.' }, { status: 400 });
    }
    await connectDB();
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    await Wishlist.findOneAndUpdate(
      { userId: user.id, productId: product._id },
      { userId: user.id, productId: product._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({ success: true, message: 'Added to wishlist' }, { status: 201 });
  } catch (error) {
    return mongoErrorResponse(error, 'Unable to save wishlist');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!isAuthUser(user)) return user;
    await connectDB();
    await Wishlist.deleteMany({ userId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return mongoErrorResponse(error, 'Unable to clear wishlist');
  }
}
