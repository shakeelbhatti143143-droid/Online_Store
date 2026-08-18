import { NextRequest, NextResponse } from 'next/server';
import { redisCache } from '@/lib/cache/redis';

export async function POST(request: NextRequest) {
  try {
    const { action, pattern, slug } = await request.json();

    if (action === 'purge_all') {
      await redisCache.invalidateAll();
      return NextResponse.json({ success: true, message: 'All caches purged successfully.' });
    }

    if (action === 'purge_product') {
      await redisCache.invalidateProductCache(slug);
      return NextResponse.json({ success: true, message: `Product cache for ${slug} invalidated.` });
    }

    if (action === 'purge_pattern' && pattern) {
      await redisCache.invalidatePattern(pattern);
      return NextResponse.json({ success: true, message: `Pattern ${pattern} invalidated.` });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Cache invalidation error' }, { status: 500 });
  }
}
