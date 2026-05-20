'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import { updateProduct } from '@/actions/admin';
import type { Product, Variant } from '@/lib/supabase';

interface EditProductFormProps {
  product: Product;
  initialVariants: Variant[];
  categories: { name: string }[];
}

export default function EditProductForm({
  product,
  initialVariants,
  categories,
}: EditProductFormProps) {
  const [form, setForm] = useState({
    title: product.title,
    base_price: product.base_price.toString(),
    category: product.category || '',
    description: product.description || '',
    is_pod: product.is_pod,
  });

  const [imageUrls, setImageUrls] = useState<string[]>(
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
      ? [product.image_url]
      : []
  );

  const [variants, setVariants] = useState<
    Array<{
      size: string;
      color: string;
      color_hex: string;
      sku: string;
      price_delta: number;
      stock_count: number;
    }>
  >(
    initialVariants.map((v) => ({
      size: v.size || '',
      color: v.color || '',
      color_hex: v.color_hex || '',
      sku: v.sku || '',
      price_delta: v.price_delta || 0,
      stock_count: v.stock_count || 0,
    }))
  );

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; error: string | null } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    const price = parseFloat(form.base_price);
    if (!form.title || !form.category || isNaN(price) || price <= 0) return;

    startTransition(async () => {
      const res = await updateProduct(
        product.id,
        {
          title: form.title,
          base_price: price,
          category: form.category,
          description: form.description,
          is_pod: form.is_pod,
          image_urls: imageUrls,
        },
        variants
      );

      setResult(res);
    });
  };

  const field = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const removeImage = (idx: number) =>
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  // ── Variant Helpers ──
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { size: '', color: '', color_hex: '', sku: '', price_delta: 0, stock_count: 50 },
    ]);
  };

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateVariantField = (
    idx: number,
    key: 'size' | 'color' | 'color_hex' | 'sku' | 'price_delta' | 'stock_count',
    value: string | number
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [key]: value } : v))
    );
  };

  return (
    <div className="max-w-4xl pb-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Product</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Modify product details, gallery, and variations.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-zinc-400 hover:text-white px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800/40 text-sm font-medium transition-colors"
        >
          Back to Inventory
        </Link>
      </div>

      {/* Success Banner */}
      {result?.success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-emerald-400">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-semibold">Product updated successfully!</p>
            <p className="text-xs text-emerald-500/70 mt-0.5">Your changes are now live storefront-wide.</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {result?.error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-red-400">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="font-semibold">{result.error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Product Fields Grid */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-400">Basic Information</h2>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Product Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => field('title', e.target.value)}
              placeholder="e.g. Pehchan Classic Heavyweight Tee"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Price + Category row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Base Price (PKR) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step="0.01"
                value={form.base_price}
                onChange={(e) => field('base_price', e.target.value)}
                placeholder="2500"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => field('category', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
              >
                <option value="" disabled>Select category...</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
              placeholder="Premium cotton description..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* ── Multi-Image Gallery ───────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-400">Image Gallery</h2>
              <p className="text-xs text-zinc-500 mt-1">
                {imageUrls.length} uploaded — first image is the main display photo.
              </p>
            </div>
          </div>

          {/* Image grid */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {imageUrls.map((url, idx) => (
                <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800">
                  <Image
                    src={url}
                    alt={`Product image ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* Primary badge */}
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">
                      MAIN
                    </span>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Make primary button */}
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => setImageUrls((prev) => [prev[idx], ...prev.filter((_, i) => i !== idx)])}
                      className="absolute bottom-2 left-2 text-[9px] font-bold bg-zinc-950/80 text-zinc-300 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      SET MAIN
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            options={{
              maxFiles: 10,
              resourceType: 'image',
              cropping: false,
              sources: ['local', 'url', 'camera'],
              multiple: true,
            }}
            onSuccess={(result) => {
              const info = result.info as { secure_url: string };
              if (info?.secure_url) {
                setImageUrls((prev) => [...prev, info.secure_url]);
              }
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:border-indigo-500 hover:text-white transition-colors text-sm font-semibold w-full justify-center bg-zinc-950/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {imageUrls.length === 0 ? 'Upload Product Images' : 'Add More Images to Gallery'}
              </button>
            )}
          </CldUploadWidget>
        </div>

        {/* ── Product Variations section ─────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-400">Sizes & Color Variations</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Configure color, sizes, price differentials, and stock count.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-400 text-xs px-3.5 py-2 rounded-xl font-bold transition-all"
            >
              + Add Row
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
              <p className="text-zinc-600 text-sm">No variations added. Using base product details only.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-zinc-950/50 text-zinc-500 uppercase tracking-widest text-[9px] border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Color Name</th>
                    <th className="px-4 py-3 font-semibold">Color Hex</th>
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold">Price Delta</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                      {/* Size */}
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => updateVariantField(idx, 'size', e.target.value)}
                          placeholder="e.g. XL"
                          className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* Color Name */}
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => updateVariantField(idx, 'color', e.target.value)}
                          placeholder="e.g. Navy Blue"
                          className="w-32 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* Color Hex */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={v.color_hex || '#000000'}
                            onChange={(e) => updateVariantField(idx, 'color_hex', e.target.value)}
                            className="w-6 h-6 border-0 bg-transparent rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={v.color_hex}
                            onChange={(e) => updateVariantField(idx, 'color_hex', e.target.value)}
                            placeholder="#0B192F"
                            className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                          placeholder="e.g. PK-TEE-NVY-XL"
                          className="w-36 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* Price Delta */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={v.price_delta}
                          onChange={(e) => updateVariantField(idx, 'price_delta', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* Stock Count */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={v.stock_count}
                          onChange={(e) => updateVariantField(idx, 'stock_count', parseInt(e.target.value) || 0)}
                          placeholder="100"
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-red-400 hover:text-red-300 font-medium px-2 py-1 hover:bg-red-500/10 border border-red-500/20 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Print-on-Demand Toggle */}
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            role="checkbox"
            aria-checked={form.is_pod}
            onClick={() => field('is_pod', !form.is_pod)}
            className={`relative w-10 h-6 rounded-full transition-colors ${form.is_pod ? 'bg-indigo-500' : 'bg-zinc-700'}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_pod ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
          <div>
            <p className="text-sm font-semibold text-white">Print-on-Demand (POD)</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Enable if this product allows custom printing configurations in the studio.
            </p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold transition-colors text-sm shadow-lg shadow-indigo-600/20"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
                Saving changes...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Product & Variants
              </>
            )}
          </button>
          <Link
            href="/admin/products"
            className="px-5 py-3.5 rounded-xl text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
