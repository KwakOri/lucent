# Artist Service

이 문서는 **아티스트(Artist) Server Service** 구현을 정의한다.

> **범위**: 아티스트 관련 비즈니스 로직 및 DB 접근
> **관련 문서**:
> - Server Service 패턴: `/specs/api/server/services/index.md`
> - API Routes: `/specs/api/server/routes/artists/index.md`
> - Database Types: `/types/database.ts`

---

## 1. 개요

**ArtistService**는 아티스트 관련 모든 비즈니스 로직과 데이터베이스 접근을 담당한다.

**위치**: `/lib/server/services/artist.service.ts`
**사용 대상**: API Route에서만 호출
**역할**: 아티스트 CRUD, 프로필 이미지 관리, 상품 개수 집계

---

## 2. 데이터 모델

### 2.1 Artist 타입

```ts
import { Tables, TablesInsert, TablesUpdate } from '@/types/database';

type Artist = Tables<'artists'>;
type ArtistInsert = TablesInsert<'artists'>;
type ArtistUpdate = TablesUpdate<'artists'>;
```

### 2.2 확장 타입 (JOIN 포함)

```ts
interface ArtistWithRelations extends Artist {
  profile_image?: {
    id: string;
    public_url: string;
    cdn_url?: string;
    thumbnail_url?: string;
    alt_text?: string;
    width?: number;
    height?: number;
  } | null;

  project?: {
    id: string;
    name: string;
    slug: string;
    cover_image?: {
      public_url: string;
      cdn_url?: string;
    } | null;
  };

  products_count?: number;
}
```

---

## 3. ArtistService 클래스

### 3.1 기본 구조

```ts
// lib/server/services/artist.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';

type Artist = Tables<'artists'>;

interface GetArtistsOptions {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'name';
  order?: 'asc' | 'desc';
  projectSlug?: string;
  isActive?: boolean;
}

export class ArtistService {
  // 메서드 구현...
}
```

---

## 4. 주요 메서드

### 4.1 아티스트 목록 조회

```ts
/**
 * 아티스트 목록 조회
 */
static async getArtists(
  options: GetArtistsOptions = {}
): Promise<{ artists: ArtistWithRelations[]; total: number }> {
  const supabase = createServerClient();
  const {
    page = 1,
    limit = 12,
    sortBy = 'created_at',
    order = 'asc',
    projectSlug,
    isActive = true,
  } = options;

  let query = supabase
    .from('artists')
    .select(
      `
      *,
      profile_image:images!artists_profile_image_id_fkey (
        id,
        public_url,
        cdn_url,
        thumbnail_url,
        alt_text,
        width,
        height
      ),
      project:projects (
        id,
        name,
        slug
      )
    `,
      { count: 'exact' }
    )
    .eq('is_active', isActive);

  // 프로젝트 필터
  if (projectSlug) {
    query = query.eq('project.slug', projectSlug);
  }

  // 정렬
  query = query.order(sortBy, { ascending: order === 'asc' });

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new ApiError('아티스트 목록 조회 실패', 500, 'ARTISTS_FETCH_FAILED');
  }

  // 각 아티스트의 상품 개수 조회
  const artistsWithCount = await Promise.all(
    (data || []).map(async (artist) => ({
      ...artist,
      products_count: await this.getProductsCount(artist.id),
    }))
  );

  return {
    artists: artistsWithCount as ArtistWithRelations[],
    total: count || 0,
  };
}
```

### 4.2 아티스트 단일 조회 (ID)

```ts
/**
 * 아티스트 단일 조회 (ID)
 */
static async getArtistById(id: string): Promise<ArtistWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('artists')
    .select(
      `
      *,
      profile_image:images!artists_profile_image_id_fkey (*),
      project:projects (
        id,
        name,
        slug,
        cover_image:images (
          public_url,
          cdn_url
        )
      )
    `
    )
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('아티스트 조회 실패', 500, 'ARTIST_FETCH_FAILED');
  }

  if (!data) return null;

  const products_count = await this.getProductsCount(data.id);

  return {
    ...data,
    products_count,
  } as ArtistWithRelations;
}
```

### 4.3 아티스트 단일 조회 (Slug)

```ts
/**
 * 아티스트 단일 조회 (Slug)
 */
static async getArtistBySlug(slug: string): Promise<ArtistWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('artists')
    .select(
      `
      *,
      profile_image:images!artists_profile_image_id_fkey (*),
      project:projects (
        id,
        name,
        slug,
        cover_image:images (*)
      )
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('아티스트 조회 실패', 500, 'ARTIST_FETCH_FAILED');
  }

  if (!data) return null;

  const products_count = await this.getProductsCount(data.id);

  return {
    ...data,
    products_count,
  } as ArtistWithRelations;
}
```

### 4.4 아티스트 상품 개수 조회

```ts
/**
 * 아티스트의 상품 개수 조회
 */
static async getProductsCount(artistId: string): Promise<number> {
  const supabase = createServerClient();

  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('artist_id', artistId)
    .eq('is_active', true);

  if (error) {
    return 0;
  }

  return count || 0;
}
```

---

## 5. 에러 처리

### 5.1 에러 코드

| 에러 코드 | 상태 코드 | 설명 |
|-----------|-----------|------|
| `ARTIST_NOT_FOUND` | 404 | 아티스트를 찾을 수 없음 |
| `ARTISTS_FETCH_FAILED` | 500 | 아티스트 목록 조회 실패 |
| `ARTIST_FETCH_FAILED` | 500 | 아티스트 조회 실패 |

---

## 6. 참고 문서

- Server Service 패턴: `/specs/api/server/services/index.md`
- API Routes: `/specs/api/server/routes/artists/index.md`
- Client Services: `/specs/api/client/services/artists/index.md`
- Database Types: `/types/database.ts`
