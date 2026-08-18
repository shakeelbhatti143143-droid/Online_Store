import { NextRequest, NextResponse } from 'next/server';
import { storeDb } from '@/lib/data/store-db';
import { formatPrice } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const lower = (message || '').toLowerCase();

    const products = await storeDb.getProducts();
    const orders = await storeDb.getOrders();
    const analytics = await storeDb.getAnalytics();

    let reply = '';
    let actionRequired = undefined;

    if (lower.includes('revenue') || lower.includes('sales')) {
      reply = `Gross revenue is ${formatPrice(analytics.totalRevenue)} with ${analytics.totalOrders} total completed orders (+${analytics.revenueChangePct}%).`;
    } else if (lower.includes('low') || lower.includes('stock')) {
      const low = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
      reply = `Found ${low.length} low stock pieces: ${low.map((p) => `${p.title} (${p.stockQuantity} left)`).join(', ')}`;
    } else if (lower.includes('delete') && lower.includes('product')) {
      const target = products[0];
      actionRequired = {
        actionType: 'DELETE_PRODUCT',
        title: `Delete ${target.title}`,
        description: `Permanently delete ${target.sku} from database and purge cache.`,
        payload: { productId: target.id, title: target.title },
      };
      reply = `Confirmation required to delete ${target.title}.`;
    } else {
      reply = `Autonomous store agent processed request: "${message}". Systems synchronized.`;
    }

    return NextResponse.json({
      success: true,
      reply,
      actionRequired,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}
