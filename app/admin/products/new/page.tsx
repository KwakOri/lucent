import { createServerClient } from '@/lib/server/utils/supabase';
import { ProductForm } from '@/src/components/admin/products/ProductForm';

async function getProjects() {
  const supabase = await createServerClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return projects || [];
}

export default async function NewProductPage() {
  const projects = await getProjects();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">상품 등록</h1>
        <p className="mt-1 text-sm text-gray-500">
          새로운 상품을 등록합니다
        </p>
      </div>

      <ProductForm projects={projects} />
    </div>
  );
}
