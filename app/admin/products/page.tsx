import Link from 'next/link';
import { createServerClient } from '@/lib/server/utils/supabase';
import { ProductsTable } from '@/src/components/admin/products/ProductsTable';

async function getProducts() {
  const supabase = await createServerClient();

  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      type,
      price,
      stock,
      is_active,
      created_at,
      main_image:images!main_image_id (
        id,
        public_url,
        cdn_url
      ),
      artist:artists!artist_id (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  return products || [];
}

async function getArtists() {
  const supabase = await createServerClient();

  const { data: artists } = await supabase
    .from('artists')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return artists || [];
}

export default async function AdminProductsPage() {
  const [products, artists] = await Promise.all([
    getProducts(),
    getArtists(),
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            레이블 상품을 관리합니다
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            + 상품 등록
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <ProductsTable products={products} artists={artists} />
    </div>
  );
}
