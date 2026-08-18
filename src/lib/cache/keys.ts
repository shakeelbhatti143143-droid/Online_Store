export const CACHE_PREFIX = 'luxe:store:';

export const CACHE_KEYS = {
  ALL_PRODUCTS: `${CACHE_PREFIX}products:all`,
  FEATURED_PRODUCTS: `${CACHE_PREFIX}products:featured`,
  BESTSELLER_PRODUCTS: `${CACHE_PREFIX}products:bestseller`,
  NEW_ARRIVALS: `${CACHE_PREFIX}products:new`,
  ALL_CATEGORIES: `${CACHE_PREFIX}categories:all`,
  HOMEPAGE_DATA: `${CACHE_PREFIX}homepage:data`,
  ANALYTICS_SUMMARY: `${CACHE_PREFIX}analytics:summary`,
  ALL_COUPONS: `${CACHE_PREFIX}coupons:all`,
  
  PRODUCT_BY_SLUG: (slug: string) => `${CACHE_PREFIX}product:slug:${slug}`,
  PRODUCT_BY_ID: (id: string) => `${CACHE_PREFIX}product:id:${id}`,
  CATEGORY_BY_SLUG: (slug: string) => `${CACHE_PREFIX}category:slug:${slug}`,
  SEARCH_RESULTS: (query: string) => `${CACHE_PREFIX}search:${encodeURIComponent(query.toLowerCase().trim())}`,
  CATEGORY_PRODUCTS: (categoryId: string) => `${CACHE_PREFIX}category:${categoryId}:products`,
};

export const CACHE_TTL = {
  SHORT: 60 * 2, // 2 minutes
  MEDIUM: 60 * 15, // 15 minutes
  LONG: 60 * 60, // 1 hour
  DAY: 60 * 60 * 24, // 24 hours
};
