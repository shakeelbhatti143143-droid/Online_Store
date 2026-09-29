import { storeDb } from '@/lib/data/store-db';
import { HeroSection } from '@/components/storefront/HeroSection';
import { TrustStrip } from '@/components/storefront/TrustStrip';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';
import { FeaturedProducts } from '@/components/storefront/FeaturedProducts';
import { DealsBanner } from '@/components/storefront/DealsBanner';
import { TrendingProducts } from '@/components/storefront/TrendingProducts';
import { AtelierStory } from '@/components/storefront/AtelierStory';

// The catalog is fetched dynamically from MongoDB at request time.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    storeDb.getProducts().catch(() => []),
    storeDb.getCategories().catch(() => []),
  ]);

  const featuredProduct = products.find((p) => p.isFeatured) || products[0];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 1. Large Hero Banner */}
      <HeroSection product={featuredProduct} />

      {/* 2. Trust / Service Features */}
      <TrustStrip />

      {/* 3. Shop by Categories (Dynamic from Admin/DB) */}
      <CategoryShowcase categories={categories} />

      {/* 4. Featured / Best Selling Products (Compact 4-5 Column Grid) */}
      <FeaturedProducts products={products} />

      {/* 5. Promotional Banner */}
      <DealsBanner />

      {/* 6. Popular / Trending Products */}
      <TrendingProducts products={products} />

      {/* 7. Craftsmanship & Brand Heritage */}
      <AtelierStory />
    </div>
  );
}