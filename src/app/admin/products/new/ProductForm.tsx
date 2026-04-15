'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { createProduct, type CreateProductResult } from '@/actions/admin';

const CATEGORIES = ['Heavyweight', 'Graphic Tees', 'Outerwear', 'Bottoms', 'Accessories'];

const EMPTY_FORM = {
  title: '',
  base_price: '',
  category: '',
  description: '',
  is_pod: false,
  image_url: null as string | null,
};

export default function NewProductForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState<CreateProductResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    const price = parseFloat(form.base_price);
    if (!form.title || !form.category || isNaN(price) || price <= 0) return;

    startTransition(async () => {
      const res = await createProduct({
        title:       form.title,
        base_price:  price,
        category:    form.category,
        description: form.description,
        is_pod:      form.is_pod,
        image_url:   form.image_url,
      });

      setResult(res);
      if (res.success) {
        setForm(EMPTY_FORM); // clear form for next product
      }
    });
  };

  const field = (key: keyof typeof EMPTY_FORM, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Add New Product</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Fill in the details below to create a new storefront listing.
        </p>
      </div>

      {/* Success Banner */}
      {result?.success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-4 text-emerald-400">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-semibold">Product created successfully!</p>
            <p className="text-xs text-emerald-500/70 mt-0.5">ID: {result.productId}</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Product Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => field('title', e.target.value)}
            placeholder="e.g. Pehchan Classic Heavyweight Tee"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Price + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
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
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={form.category}
              onChange={(e) => field('category', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
            >
              <option value="" disabled>Select category...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
            placeholder="Premium 300gsm cotton, boxy silhouette, dropped shoulders..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Product Image
          </label>

          <div className="flex items-start gap-4">
            {/* Image Preview */}
            {form.image_url ? (
              <div className="relative group w-24 h-24">
                <Image
                  src={form.image_url}
                  alt="Product preview"
                  fill
                  className="object-cover rounded-xl border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => field('image_url', '')}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Upload Widget Trigger */}
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
              options={{
                maxFiles: 1,
                resourceType: 'image',
                cropping: false,
                sources: ['local', 'url', 'camera'],
              }}
              onSuccess={(result) => {
                const info = result.info as { secure_url: string };
                if (info?.secure_url) {
                  setForm((f) => ({ ...f, image_url: info.secure_url }));
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-indigo-500 hover:text-white transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {form.image_url ? 'Change Image' : 'Upload Image'}
                </button>
              )}
            </CldUploadWidget>
          </div>

          {form.image_url && (
            <p className="mt-2 text-xs text-zinc-500 truncate max-w-sm">
              ✓ {form.image_url}
            </p>
          )}
        </div>

        {/* POD Toggle */}
        <div className="flex items-center gap-3 p-5 rounded-xl bg-zinc-900 border border-zinc-800">
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
            <p className="text-sm font-medium text-white">Print-on-Demand (POD)</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Enable if this product allows custom printing (name, graphic, etc.)
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Product
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setForm(EMPTY_FORM); setResult(null); }}
            className="px-4 py-3 rounded-xl text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
