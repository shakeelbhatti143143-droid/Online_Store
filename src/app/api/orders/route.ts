import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isAuthUser, isStaff, mongoErrorResponse, requireAuth } from '@/lib/auth-server';
import { storeDb } from '@/lib/data/store-db';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    if (orderNumber) {
      const order = await storeDb.getOrderById(orderNumber, isStaff(user) ? undefined : user.id);
      if (!order) return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      if (!isStaff(user) && order.userId && order.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: order });
    }
    const data = await storeDb.getOrders(isStaff(user) ? undefined : user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return mongoErrorResponse(error, 'Failed to retrieve orders');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const normalized = items
      .map((item: any) => ({
        productId: item.productId || item.product?.id,
        variantId: item.variantId || item.selectedVariant?.id,
        quantity: Number(item.quantity),
      }))
      .filter((item: { productId: string; quantity: number }) => item.productId && item.quantity > 0);

    if (!normalized.length) {
      return NextResponse.json({ success: false, error: 'Order items are required.' }, { status: 400 });
    }

    const customerEmail = user?.email || body.customerEmail || body.shippingAddress?.email;
    const customerName = user?.fullName || body.customerName || body.shippingAddress?.fullName;
    if (!customerEmail || !customerName) {
      return NextResponse.json({ success: false, error: 'Customer name and email are required.' }, { status: 400 });
    }
    const shippingAddress = body.shippingAddress;
    if (!shippingAddress?.addressLine1 || !shippingAddress?.city || !shippingAddress?.postalCode) {
      return NextResponse.json({ success: false, error: 'A complete shipping address is required.' }, { status: 400 });
    }

    const order = await storeDb.createSecureOrder({
      userId: user?.id,
      guestEmail: user ? undefined : customerEmail,
      customerEmail,
      customerName,
      customerPhone: body.customerPhone || shippingAddress.phone,
      paymentMethod: body.paymentMethod,
      deliveryMethod: body.deliveryMethod,
      couponCode: body.couponCode,
      shippingAddress,
      billingAddress: body.billingAddress,
      notes: body.notes,
      items: normalized,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to place order';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
