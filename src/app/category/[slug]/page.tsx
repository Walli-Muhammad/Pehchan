import { getProductsByCategorySlug } from '@/lib/supabase';
import ProductGrid from '@/components/ProductGrid/ProductGrid';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const { products, categoryName } = await getProductsByCategorySlug(params.slug);

  if (!categoryName) {
    notFound();
  }

  return (
    <main className="relative flex w-full flex-col overflow-x-hidden pt-[100px] min-h-screen">
      <div className="max-w-7xl mx-auto w-full px-6 mb-8 mt-12">
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
          {categoryName}
        </h1>
        <p className="text-zinc-400 mt-2">
          {products.length} {products.length === 1 ? 'product' : 'products'} available
        </p>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Products Found</h2>
          <p className="text-zinc-500 text-center max-w-md">
            We currently don&apos;t have any products in the {categoryName} category. Check back later!
          </p>
        </div>
      )}
    </main>
  );
}
