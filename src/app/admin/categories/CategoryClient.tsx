'use client';

import { useState, useTransition } from 'react';
import { createCategory, deleteCategory, type Category } from '@/actions/admin';

export default function CategoryClient({ initialCategories }: { initialCategories: Category[] }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !slug) return;

    startTransition(async () => {
      const res = await createCategory(name, slug);
      if (res.success) {
        setName('');
        setSlug('');
      } else {
        setError(res.error || 'Failed to create category');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    startTransition(async () => {
      await deleteCategory(id);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create Form */}
      <div className="lg:col-span-1">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add Category</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Anime"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Slug (URL)
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. anime"
                className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !name}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center"
            >
              {isPending ? 'Saving...' : 'Create Category'}
            </button>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Existing Categories</h2>
          </div>
          
          {initialCategories.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No categories found. Create one to get started.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {initialCategories.map((cat) => (
                <div key={cat.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <h3 className="text-white font-medium">{cat.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">/category/{cat.slug}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
