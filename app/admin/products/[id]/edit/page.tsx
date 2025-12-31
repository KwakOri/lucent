import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/server/utils/supabase';
import { ProductForm } from '@/src/components/admin/products/ProductForm';

async function getProduct(id: string) {
  const supabase = await createServerClient();

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      main_image:images!main_image_id (
        id,
        public_url,
        cdn_url
      )
    `)
    .eq('id', id)
    .single();

  return product;
}

async function getArtists() {
  const supabase = await createServerClient();

  const { data: artists } = await supabase
    .from('artists')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name', { ascending: true});

  return artists || [];
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, artists] = await Promise.all([
    getProduct(id),
    getArtists(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">상품 수정</h1>
        <p className="mt-1 text-sm text-gray-500">
          {product.name} 정보를 수정합니다
        </p>
      </div>

      <ProductForm artists={artists} product={product} />
    </div>
  );
}
