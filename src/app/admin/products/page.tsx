import Link from 'next/link';
import { getProducts } from '@/lib/supabase';
import ProductListClient from './ProductListClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products Inventory</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Manage your store&apos;s product catalog.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors text-sm"
        >
          + Add Product
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <ProductListClient products={products} />
      </div>
    </div>
  );
}
