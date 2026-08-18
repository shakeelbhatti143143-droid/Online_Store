import { CACHE_KEYS } from './keys';

/**
 * Resilient In-Memory LRU Cache with TTL fallback for standalone / server environments
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private maxItems = 500;

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  delByPattern(pattern: string): void {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}`);
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const memoryFallback = new MemoryCache();

export class CacheService {
  private static instance: CacheService;
  private isRedisAvailable = false;
  private upstashClient: any = null;

  private constructor() {
    this.initClients();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private async initClients() {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (url && token) {
        const { Redis } = await import('@upstash/redis');
        this.upstashClient = new Redis({ url, token });
        this.isRedisAvailable = true;
      }
    } catch (err) {
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get cached item by key with automatic fallback
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisAvailable && this.upstashClient) {
        const data = await this.upstashClient.get(key);
        if (data !== null && data !== undefined) {
          return typeof data === 'string' ? JSON.parse(data) : data;
        }
      }
    } catch (error) {
      // Fallback seamlessly to in-memory
    }
    return memoryFallback.get<T>(key);
  }

  /**
   * Set cached item with TTL in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    try {
      if (this.isRedisAvailable && this.upstashClient) {
        await this.upstashClient.set(key, JSON.stringify(value), { ex: ttlSeconds });
      }
    } catch (error) {
      // Ignore remote redis failure and store in memory
    }
    memoryFallback.set(key, value, ttlSeconds);
  }

  /**
   * Delete a single key
   */
  async del(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.upstashClient) {
        await this.upstashClient.del(key);
      }
    } catch (error) {
      // ignore
    }
    memoryFallback.del(key);
  }

  /**
   * Delete keys matching a prefix or wildcard
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.upstashClient) {
        const keys = await this.upstashClient.keys(pattern);
        if (keys && keys.length > 0) {
          await this.upstashClient.del(...keys);
        }
      }
    } catch (error) {
      // ignore
    }
    memoryFallback.delByPattern(pattern);
  }

  /**
   * Invalidate product related caches on product create/update/delete
   */
  async invalidateProductCache(slug?: string, id?: string): Promise<void> {
    await this.del(CACHE_KEYS.ALL_PRODUCTS);
    await this.del(CACHE_KEYS.FEATURED_PRODUCTS);
    await this.del(CACHE_KEYS.BESTSELLER_PRODUCTS);
    await this.del(CACHE_KEYS.NEW_ARRIVALS);
    await this.del(CACHE_KEYS.HOMEPAGE_DATA);
    await this.del(CACHE_KEYS.ANALYTICS_SUMMARY);
    if (slug) await this.del(CACHE_KEYS.PRODUCT_BY_SLUG(slug));
    if (id) await this.del(CACHE_KEYS.PRODUCT_BY_ID(id));
    await this.invalidatePattern(`${CACHE_KEYS.SEARCH_RESULTS('')}*`);
  }

  /**
   * Invalidate category caches on category change
   */
  async invalidateCategoryCache(): Promise<void> {
    await this.del(CACHE_KEYS.ALL_CATEGORIES);
    await this.del(CACHE_KEYS.HOMEPAGE_DATA);
    await this.del(CACHE_KEYS.ALL_PRODUCTS);
    await this.invalidatePattern(`${CACHE_KEYS.SEARCH_RESULTS('')}*`);
  }

  /**
   * Purge all cache
   */
  async invalidateAll(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.upstashClient) {
        await this.upstashClient.flushall();
      }
    } catch (e) {
      // ignore
    }
    memoryFallback.clear();
  }
}

export const redisCache = CacheService.getInstance();
