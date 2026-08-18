import { NextRequest, NextResponse } from 'next/server';
import { storeDb } from '@/lib/data/store-db';
import { isAuthUser, mongoErrorResponse, requireStaff } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const badge = searchParams.get('badge');
    const query = searchParams.get('q');

    let products = await storeDb.getProducts();

    if (category) {
      products = products.filter((p) => p.categoryId === category || p.slug === category || p.categoryName?.toLowerCase().includes(category.toLowerCase()));
    }
    if (badge) {
      products = products.filter((p) => p.badge === badge || (badge === 'NEW' && p.isNewArrival) || (badge === 'BEST SELLER' && p.isBestSeller));
    }
    if (query) {
      const q = query.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brandName?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to fetch products');
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff(request);
    if (!isAuthUser(staff)) return staff;
    const body = await request.json();
    if (!body?.title) {
      return NextResponse.json({ success: false, error: 'Product title is required.' }, { status: 400 });
    }
    const created = await storeDb.createProduct(body, staff.id);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to create product');
  }
}
