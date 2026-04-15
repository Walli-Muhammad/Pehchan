'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-server';

export interface CreateProductInput {
  title: string;
  base_price: number;
  category: string;
  description: string;
  is_pod: boolean;
  image_url: string | null;
}

export interface CreateProductResult {
  success: boolean;
  error: string | null;
  productId: string | null;
}

export async function createProduct(
  input: CreateProductInput
): Promise<CreateProductResult> {
  // ── Server-side validation ──
  if (!input.title.trim()) {
    return { success: false, error: 'Product title is required.', productId: null };
  }
  if (isNaN(input.base_price) || input.base_price <= 0) {
    return { success: false, error: 'A valid price is required.', productId: null };
  }
  if (!input.category) {
    return { success: false, error: 'Category is required.', productId: null };
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      title:       input.title.trim(),
      base_price:  input.base_price,
      category:    input.category,
      description: input.description.trim() || null,
      is_pod:      input.is_pod,
      image_url:   input.image_url || null,
      is_active:   true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createProduct] Supabase error:', error.message);
    return { success: false, error: error.message, productId: null };
  }

  // Revalidate the storefront so new product appears immediately without rebuild
  revalidatePath('/');

  return { success: true, error: null, productId: data.id };
}
