import { getProducts } from '@/lib/supabase';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import CustomCursor from '@/components/Interactions/CustomCursor';
import CartDrawer from '@/components/Cart/CartDrawer';
import CartToggle from '@/components/Cart/CartToggle';
import CheckoutModal from '@/components/Checkout/CheckoutModal';
import Hero from '@/components/Hero/Hero';

// Force dynamic rendering so we always get fresh product data.
// Remove this if you want ISR (revalidate = N seconds instead).
export const dynamic = 'force-dynamic';

export default async function Home() {
  // ✅ SERVER-SIDE FETCH — zero client JS cost, full SEO benefit
  const products = await getProducts();

  return (
    <main className="relative flex w-full flex-col overflow-x-hidden">
      {/* Global UI chrome — client components, z-indexed above all content */}
      <CustomCursor />
      <CartDrawer />
      <CartToggle />
      <CheckoutModal />

      <Hero />

      {/* Pass live Supabase data; ProductGrid handles all interactivity */}
      <ProductGrid products={products} />
    </main>
  );
}
