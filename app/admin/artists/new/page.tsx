import { createServerClient } from '@/lib/server/utils/supabase';
import { ArtistForm } from '@/src/components/admin/artists/ArtistForm';

async function getProjects() {
  const supabase = await createServerClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return projects || [];
}

export default async function NewArtistPage() {
  const projects = await getProjects();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">아티스트 등록</h1>
        <p className="mt-1 text-sm text-gray-500">
          새로운 아티스트를 등록합니다
        </p>
      </div>

      <ArtistForm projects={projects} />
    </div>
  );
}
