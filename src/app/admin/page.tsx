import Link from 'next/link';
import { getProducts } from '@/lib/supabase';
import { getCategories } from '@/actions/admin';
import { LayoutDashboard, ShoppingBag, Tags } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-indigo-500" />
          Admin Dashboard
        </h1>
        <p className="text-zinc-400 mt-2">
          Overview of your store&apos;s inventory and configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Stat Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-24 h-24 text-indigo-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Total Products</h2>
            <p className="text-5xl font-black text-white mt-2">{products.length}</p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/admin/products"
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
              >
                View all &rarr;
              </Link>
              <Link
                href="/admin/products/new"
                className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add New
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Stat Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Tags className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Active Categories</h2>
            <p className="text-5xl font-black text-white mt-2">{categories.length}</p>
            <div className="mt-8">
              <Link
                href="/admin/categories"
                className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Manage categories &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
