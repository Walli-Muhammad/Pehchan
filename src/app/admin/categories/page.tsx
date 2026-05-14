import { getCategories } from '@/actions/admin';
import CategoryClient from './CategoryClient';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Manage Categories</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Create and remove categories. These categories will automatically appear in the storefront sidebar.
        </p>
      </div>

      <CategoryClient initialCategories={categories} />
    </div>
  );
}
