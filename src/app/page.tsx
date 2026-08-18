import { storeDb } from '@/lib/data/store-db';
import { HeroSection } from '@/components/storefront/HeroSection';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';
import { FeaturedProducts } from '@/components/storefront/FeaturedProducts';
import { DealsBanner } from '@/components/storefront/DealsBanner';

export const revalidate = 60; // 1 minute ISR revalidation

export default async function HomePage() {
  const products = await storeDb.getProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Showcase */}
      <HeroSection />

      {/* 2. Department / Category Grid */}
      <CategoryShowcase />

      {/* 3. Curated Featured Highlights & Tab Filter */}
      <FeaturedProducts products={products} />

      {/* 4. Limited-Time Vault Deals Banner */}
      <DealsBanner />
    </div>
  );
}
