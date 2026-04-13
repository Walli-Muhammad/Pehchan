import { getProducts } from '@/lib/supabase';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import Hero from '@/components/Hero/Hero';

// Force dynamic rendering so we always get fresh product data.
export const dynamic = 'force-dynamic';

export default async function Home() {
  // SERVER-SIDE FETCH — zero client JS cost, full SEO benefit
  const products = await getProducts();

  return (
    // pt-[72px] accounts for the fixed Navbar height so content doesn't sit underneath it.
    // Hero is full-screen so it deliberately ignores this padding to bleed behind the nav.
    <main className="relative flex w-full flex-col overflow-x-hidden">
      <Hero />
      <ProductGrid products={products} />
    </main>
  );
}
