import { createClient } from '@supabase/supabase-js';

// These are injected at build time via .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Copy .env.local.example to .env.local and fill in your project credentials.'
  );
}

// Singleton client for use on both server and client components.
// For server-side actions that bypass RLS (admin writes), create a separate
// server-only client using the `service_role` key (never expose to browser).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// Typed Database Row Interfaces
// =============================================

export interface Product {
  id: string;
  title: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  category: string | null;
  is_pod: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  sku: string | null;
  stock_count: number;
  price_delta: number;
  created_at: string;
}

export interface PodOption {
  id: string;
  product_id: string;
  option_type: 'custom_name' | 'upload_image' | 'custom_text' | 'choose_color';
  label: string;
  is_required: boolean;
  max_length: number | null;
  created_at: string;
}

// =============================================
// Convenience Query Helpers
// =============================================

/** Fetch all active products for the storefront grid */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getProducts] Supabase error:', error.message);
    return [];
  }
  return data ?? [];
}

/** Fetch all active products for a specific category by its slug */
export async function getProductsByCategorySlug(slug: string): Promise<{ products: Product[], categoryName: string | null }> {
  // First, find the category name from the slug
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .single();

  if (categoryError || !categoryData) {
    console.error('[getProductsByCategorySlug] Category not found:', slug);
    return { products: [], categoryName: null };
  }

  // Then fetch products matching that category name
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('category', categoryData.name)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getProductsByCategorySlug] Supabase error:', error.message);
    return { products: [], categoryName: categoryData.name };
  }
  
  return { products: data ?? [], categoryName: categoryData.name };
}

/** Fetch a single product with all its variants and POD options */
export async function getProductById(id: string): Promise<{
  product: Product | null;
  variants: Variant[];
  podOptions: PodOption[];
}> {
  const [productRes, variantsRes, podRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('variants').select('*').eq('product_id', id),
    supabase.from('pod_options').select('*').eq('product_id', id),
  ]);

  return {
    product: productRes.data ?? null,
    variants: variantsRes.data ?? [],
    podOptions: podRes.data ?? [],
  };
}
