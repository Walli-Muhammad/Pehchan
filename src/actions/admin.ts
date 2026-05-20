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

export async function updateProduct(
  id: string,
  input: CreateProductInput,
  variants: Array<{
    size: string | null;
    color: string | null;
    color_hex: string | null;
    sku: string | null;
    stock_count: number;
    price_delta: number;
  }>
) {
  if (!id) {
    return { success: false, error: 'Product ID is required.' };
  }
  if (!input.title.trim()) {
    return { success: false, error: 'Product title is required.' };
  }
  if (isNaN(input.base_price) || input.base_price <= 0) {
    return { success: false, error: 'A valid price is required.' };
  }
  if (!input.category) {
    return { success: false, error: 'Category is required.' };
  }

  const { error: productError } = await supabaseAdmin
    .from('products')
    .update({
      title:       input.title.trim(),
      base_price:  input.base_price,
      category:    input.category,
      description: input.description.trim() || null,
      is_pod:      input.is_pod,
      image_url:   input.image_urls[0] ?? null,
      image_urls:  input.image_urls,
    })
    .eq('id', id);

  if (productError) {
    console.error('[updateProduct] Supabase error updating product:', productError.message);
    return { success: false, error: productError.message };
  }

  const { error: deleteVariantsError } = await supabaseAdmin
    .from('variants')
    .delete()
    .eq('product_id', id);

  if (deleteVariantsError) {
    console.error('[updateProduct] Supabase error deleting old variants:', deleteVariantsError.message);
    return { success: false, error: deleteVariantsError.message };
  }

  if (variants && variants.length > 0) {
    const variantsToInsert = variants.map((v) => ({
      product_id:  id,
      size:        v.size?.trim() || null,
      color:       v.color?.trim() || null,
      color_hex:   v.color_hex?.trim() || null,
      sku:         v.sku?.trim() || null,
      stock_count: isNaN(v.stock_count) ? 0 : Number(v.stock_count),
      price_delta: isNaN(v.price_delta) ? 0 : Number(v.price_delta),
    }));

    const { error: insertVariantsError } = await supabaseAdmin
      .from('variants')
      .insert(variantsToInsert);

    if (insertVariantsError) {
      console.error('[updateProduct] Supabase error inserting variants:', insertVariantsError.message);
      return { success: false, error: insertVariantsError.message };
    }
  }

  revalidatePath('/');
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/edit/${id}`);

  return { success: true, error: null };
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

// ── Orders ──

export interface OrderItem {
  id: string;
  product_title: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_pkr: number;
  pod_customization: Record<string, unknown> | null;
  is_pod: boolean;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  city: string;
  province: string;
  gateway: string;
  subtotal_pkr: number;
  shipping_pkr: number;
  total_pkr: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getOrders] error:', error.message);
    return [];
  }
  return data || [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[getOrderById] error:', error.message);
    return null;
  }
  return data;
}

export async function updateOrderStatus(id: string, status: string) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('[updateOrderStatus] error:', error.message);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}
