import { notFound } from 'next/navigation';
import { ArtistService } from '@/lib/server/services/artist.service';
import { ProjectService } from '@/lib/server/services/project.service';
import { ArtistForm } from '@/src/components/admin/artists/ArtistForm';

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let artist;
  let projects;

  try {
    [artist, projects] = await Promise.all([
      ArtistService.getArtistById(id),
      ProjectService.getProjects(),
    ]);
  } catch (error) {
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
