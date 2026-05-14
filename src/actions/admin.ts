'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-server';

export interface CreateProductInput {
  title: string;
  base_price: number;
  category: string;
  description: string;
  is_pod: boolean;
  image_urls: string[];
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
      // Store first image in legacy image_url for backward compat with existing product cards
      image_url:   input.image_urls[0] ?? null,
      image_urls:  input.image_urls,
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
  revalidatePath('/admin/products');

  return { success: true, error: null, productId: data.id };
}

export async function deleteProduct(id: string) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) {
    console.error('[deleteProduct] Supabase error:', error.message);
    return { success: false, error: error.message };
  }
  revalidatePath('/');
  revalidatePath('/admin/products');
  return { success: true };
}

// ── Categories ──

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getCategories] error:', error.message);
    return [];
  }
  return data || [];
}

export async function createCategory(name: string, slug: string) {
  if (!name.trim() || !slug.trim()) {
    return { success: false, error: 'Name and slug are required.' };
  }
  
  const { error } = await supabaseAdmin
    .from('categories')
    .insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    });

  if (error) {
    console.error('[createCategory] error:', error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/categories');
  return { success: true };
}

export async function deleteCategory(id: string) {
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) {
    console.error('[deleteCategory] error:', error.message);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/');
  revalidatePath('/admin/categories');
  return { success: true };
}
