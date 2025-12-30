# Artists Client Services

이 문서는 **아티스트(Artists) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 아티스트 API를 호출하는 Client Services Layer
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/artists/index.md`
> - API Routes: `/specs/api/server/routes/artists/index.md`

---

## 1. 개요

**ArtistsAPI**는 프론트엔드에서 아티스트 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/artists.api.ts`
**사용 대상**: React Query Hook에서만 호출
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 Artist 타입

```ts
// lib/client/services/artists.api.ts
export interface Artist {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description: string;

  profile_image: {
    id: string;
    public_url: string;
    cdn_url?: string;
    thumbnail_url?: string;
    alt_text?: string;
    width?: number;
    height?: number;
  } | null;

  shop_theme: {
    primary_color?: string;
    secondary_color?: string;
    concept?: string;
  } | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;

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

### 2.2 쿼리 파라미터 타입

```ts
export interface GetArtistsParams {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'name';
  order?: 'asc' | 'desc';
  projectSlug?: string;
}
```

---

## 3. ArtistsAPI 구현

```ts
// lib/client/services/artists.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export const ArtistsAPI = {
  /**
   * 아티스트 목록 조회
   */
  async getArtists(params?: GetArtistsParams): Promise<PaginatedResponse<Artist>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.projectSlug) searchParams.set('filter[project]', params.projectSlug);

    return apiClient.get(`/api/artists?${searchParams}`);
  },

  /**
   * 아티스트 단일 조회 (Slug)
   */
  async getArtist(slug: string): Promise<ApiResponse<Artist>> {
    return apiClient.get(`/api/artists/${slug}`);
  },

  /**
   * 아티스트별 상품 목록
   */
  async getArtistProducts(slug: string, params?: any): Promise<any> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    return apiClient.get(`/api/artists/${slug}/products?${searchParams}`);
  },
};
```

---

## 4. 사용 예시

### 4.1 아티스트 목록 조회

```ts
import { ArtistsAPI } from '@/lib/client/services/artists.api';

// 전체 목록
const artists = await ArtistsAPI.getArtists();
console.log(artists.data); // Artist[]

// 특정 프로젝트의 아티스트
const projectArtists = await ArtistsAPI.getArtists({
  projectSlug: '0th',
  sortBy: 'created_at',
  order: 'asc',
});
```

### 4.2 아티스트 상세 조회

```ts
const artist = await ArtistsAPI.getArtist('miruru');
console.log(artist.data); // Artist
```

---

## 5. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/artists/index.md`
- API Routes: `/specs/api/server/routes/artists/index.md`
