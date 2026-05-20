'use client';

import { useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { deleteProduct } from '@/actions/admin';
import type { Product } from '@/lib/supabase';

export default function ProductListClient({ products }: { products: Product[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    startTransition(async () => {
      await deleteProduct(id);
    });
  };

  if (products.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-zinc-500">No products found. Start by adding a new product.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[10px] border-b border-zinc-800">
          <tr>
            <th className="px-6 py-4 font-medium">Product</th>
            <th className="px-6 py-4 font-medium">Category</th>
            <th className="px-6 py-4 font-medium">Base Price</th>
            <th className="px-6 py-4 font-medium">Type</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 text-zinc-300">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 relative shrink-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{product.title}</p>
                    <p className="text-xs text-zinc-500 max-w-[200px] truncate">{product.description || 'No description'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="bg-zinc-800 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-300">
                  {product.category || 'Uncategorized'}
                </span>
              </td>
              <td className="px-6 py-4">
                Rs. {product.base_price.toLocaleString()}
              </td>
              <td className="px-6 py-4">
                {product.is_pod ? (
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md">
                    POD
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-md">
                    Standard
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end items-center gap-2">
                  <Link
                    href={`/admin/products/edit/${product.id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-xs px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={isPending}
                    className="text-red-400 hover:text-red-300 font-medium text-xs px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
