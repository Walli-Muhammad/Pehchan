import { redirect } from 'next/navigation';
import { getProductById } from '@/lib/supabase';
import { getCategories } from '@/actions/admin';
import EditProductForm from './EditProductForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = params;

  // Fetch product data, variants and custom options
  const { product, variants } = await getProductById(id);
  const categories = await getCategories();

  if (!product) {
    redirect('/admin/products');
  }

  return (
    <div>
      <EditProductForm
        product={product}
        initialVariants={variants}
        categories={categories}
      />
    </div>
  );
}
