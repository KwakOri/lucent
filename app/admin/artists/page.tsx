import Link from 'next/link';
import { createServerClient } from '@/lib/server/utils/supabase';
import { ArtistsTable } from '@/src/components/admin/artists/ArtistsTable';

async function getArtists() {
  const supabase = await createServerClient();

  const { data: artists } = await supabase
    .from('artists')
    .select(`
      id,
      name,
      slug,
      is_active,
      created_at,
      profile_image:images!profile_image_id (
        id,
        public_url,
        cdn_url
      ),
      project:projects!project_id (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  return artists || [];
}

export default async function AdminArtistsPage() {
  const artists = await getArtists();

  return (
    <div>
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">아티스트 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            레이블 소속 아티스트를 관리합니다
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Link
            href="/admin/artists/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            + 아티스트 등록
          </Link>
        </div>
      </div>

      {/* Artists Table */}
      <ArtistsTable artists={artists} />
    </div>
  );
}
