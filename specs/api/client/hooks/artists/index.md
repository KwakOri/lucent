# Artists React Query Hooks

이 문서는 **아티스트(Artists) React Query Hooks** 구현을 정의한다.

> **범위**: 아티스트 데이터 fetching 및 상태 관리 Hooks
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/artists/index.md`
> - API Routes: `/specs/api/server/routes/artists/index.md`

---

## 1. QueryKey 구조

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  artists: {
    all: ['artists'] as const,
    lists: () => [...queryKeys.artists.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.artists.lists(), filters] as const,
    details: () => [...queryKeys.artists.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.artists.details(), slug] as const,
  },
} as const;
```

---

## 2. Query Hooks

### 2.1 useArtists (아티스트 목록)

```ts
// lib/client/hooks/useArtists.ts
import { useQuery } from '@tanstack/react-query';
import { ArtistsAPI, type GetArtistsParams } from '@/lib/client/services/artists.api';
import { queryKeys } from './query-keys';

export function useArtists(params?: GetArtistsParams) {
  return useQuery({
    queryKey: queryKeys.artists.list(params || {}),
    queryFn: () => ArtistsAPI.getArtists(params),
    staleTime: 1000 * 60 * 10, // 10분
  });
}
```

**사용 예시**:

```tsx
function ArtistsPage() {
  const { data, isLoading, error } = useArtists();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const artists = data?.data || [];

  return (
    <div className="grid grid-cols-3 gap-4">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}
```

### 2.2 useArtist (아티스트 상세)

```ts
// lib/client/hooks/useArtist.ts
import { useQuery } from '@tanstack/react-query';
import { ArtistsAPI } from '@/lib/client/services/artists.api';
import { queryKeys } from './query-keys';

export function useArtist(slug: string) {
  return useQuery({
    queryKey: queryKeys.artists.detail(slug),
    queryFn: () => ArtistsAPI.getArtist(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // 10분
  });
}
```

**사용 예시**:

```tsx
function ArtistShop({ slug }: { slug: string }) {
  const { data: artistData, isLoading } = useArtist(slug);

  if (isLoading) return <Loading />;

  const artist = artistData?.data;
  if (!artist) return <NotFound />;

  const theme = artist.shop_theme;

  return (
    <div
      style={{
        '--primary-color': theme?.primary_color || '#000000',
        '--secondary-color': theme?.secondary_color || '#F5F5F5',
      } as React.CSSProperties}
    >
      <h1 style={{ color: 'var(--primary-color)' }}>{artist.name} 굿즈샵</h1>
      <p>{theme?.concept}</p>
      <ProductGrid artistSlug={slug} />
    </div>
  );
}
```

---

## 3. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/artists/index.md`
- API Routes: `/specs/api/server/routes/artists/index.md`
