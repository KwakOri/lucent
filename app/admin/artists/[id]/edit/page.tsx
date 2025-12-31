import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/server/utils/supabase';
import { ArtistForm } from '@/src/components/admin/artists/ArtistForm';

async function getArtist(id: string) {
  const supabase = await createServerClient();

  const { data: artist } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .single();

  return artist;
}

async function getProjects() {
  const supabase = await createServerClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return projects || [];
}

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [artist, projects] = await Promise.all([
    getArtist(id),
    getProjects(),
  ]);

  if (!artist) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">아티스트 수정</h1>
        <p className="mt-1 text-sm text-gray-500">
          {artist.name} 정보를 수정합니다
        </p>
      </div>

      <ArtistForm projects={projects} artist={artist} />
    </div>
  );
}
