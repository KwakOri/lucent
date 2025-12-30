# Projects – List Spec

이 문서는 **프로젝트 목록 조회** API 스펙을 정의한다.

---

## 1. API 스펙

### 1.1 엔드포인트

```
GET /api/projects
```

### 1.2 인증

- **불필요**: 공개 API

### 1.3 요청

**Query Parameters**

```
GET /api/projects?page=1&limit=12&sortBy=publishedAt&order=desc&filter[status]=ongoing&filter[artist]=miruru
```

| 파라미터        | 타입   | 필수 | 기본값        | 설명                              |
| --------------- | ------ | ---- | ------------- | --------------------------------- |
| `page`          | number | ❌   | 1             | 페이지 번호                       |
| `limit`         | number | ❌   | 12            | 페이지당 항목 수 (최대 50)        |
| `sortBy`        | string | ❌   | `publishedAt` | 정렬 기준                         |
| `order`         | string | ❌   | `desc`        | 정렬 순서 (`asc` \| `desc`)       |
| `filter[status]`| string | ❌   | -             | 프로젝트 상태 필터                |
| `filter[artist]`| string | ❌   | -             | 아티스트 slug 필터                |
| `filter[tag]`   | string | ❌   | -             | 태그 필터                         |

**정렬 옵션**

- `publishedAt`: 공개일 (기본)
- `createdAt`: 생성일
- `title`: 제목 (가나다순)

**상태 옵션**

- `upcoming`: 예정
- `ongoing`: 진행 중
- `completed`: 완료

### 1.4 응답

**성공 (200 OK)**

```json
{
  "status": "success",
  "data": [
    {
      "id": "proj_001",
      "title": "미루루 보이스팩 vol.1 출시",
      "description": "미루루의 첫 보이스팩이 출시되었습니다",
      "thumbnailUrl": "https://r2.example.com/projects/proj_001/thumb.jpg",
      "status": "ongoing",
      "publishedAt": "2024-03-01T00:00:00Z",
      "createdAt": "2024-02-25T00:00:00Z",
      "updatedAt": "2024-03-01T00:00:00Z",
      "artists": [
        {
          "id": "artist_miruru",
          "name": "미루루",
          "avatarUrl": "https://r2.example.com/artists/miruru/avatar.jpg",
          "slug": "miruru"
        }
      ],
      "tags": ["voice", "digital"],
      "relatedGoods": [
        {
          "id": "goods_001",
          "name": "미루루 보이스팩 vol.1",
          "thumbnailUrl": "https://r2.example.com/goods/001/thumb.jpg",
          "price": 9900,
          "status": "available"
        }
      ]
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 12,
    "totalPages": 2
  }
}
```

**에러 (400 Bad Request)**

```json
{
  "status": "error",
  "message": "잘못된 요청입니다",
  "errorCode": "INVALID_PARAMS"
}
```

---

## 2. 처리 로직

### 2.1 서버 처리 흐름

```
1. Query Parameters 파싱 및 검증
   ↓
2. 필터 조건 적용
   ↓
3. 정렬 적용
   ↓
4. 페이지네이션 계산
   ↓
5. Supabase에서 데이터 조회
   ↓
6. 관련 아티스트, 굿즈 정보 포함
   ↓
7. 응답 반환
```

### 2.2 구현 예시

```ts
// app/api/projects/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Query Parameters 파싱
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
  const sortBy = searchParams.get('sortBy') || 'publishedAt';
  const order = searchParams.get('order') || 'desc';

  // 필터 파싱
  const statusFilter = searchParams.get('filter[status]');
  const artistFilter = searchParams.get('filter[artist]');
  const tagFilter = searchParams.get('filter[tag]');

  const supabase = createClient();

  // 쿼리 빌더
  let query = supabase
    .from('projects')
    .select(`
      *,
      artists:project_artists(
        artist:artists(*)
      ),
      related_goods:project_goods(
        goods:goods(id, name, thumbnail_url, price, status)
      )
    `, { count: 'exact' });

  // 필터 적용
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  if (artistFilter) {
    query = query.contains('artists', [{ slug: artistFilter }]);
  }

  if (tagFilter) {
    query = query.contains('tags', [tagFilter]);
  }

  // 정렬
  query = query.order(sortBy, { ascending: order === 'asc' });

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return Response.json(
      {
        status: 'error',
        message: '프로젝트 목록을 불러오는데 실패했습니다',
        errorCode: 'FETCH_FAILED'
      },
      { status: 500 }
    );
  }

  return Response.json({
    status: 'success',
    data,
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}
```

---

## 3. 클라이언트 처리

### 3.1 Service Layer

```ts
// services/project.service.ts
export interface ProjectListParams {
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
  status?: 'upcoming' | 'ongoing' | 'completed';
  artist?: string;
  tag?: string;
}

export class ProjectService {
  static async getProjects(params: ProjectListParams = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.order) searchParams.set('order', params.order);
    if (params.status) searchParams.set('filter[status]', params.status);
    if (params.artist) searchParams.set('filter[artist]', params.artist);
    if (params.tag) searchParams.set('filter[tag]', params.tag);

    const response = await fetch(`/api/projects?${searchParams.toString()}`);
    return response.json();
  }
}
```

### 3.2 React Query Hook

```ts
// hooks/projects/useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { ProjectService, ProjectListParams } from '@/services/project.service';

export const useProjects = (params: ProjectListParams = {}) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => ProjectService.getProjects(params),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5분
  });
};
```

### 3.3 사용 예시

```tsx
// app/projects/page.tsx
'use client';
import { useProjects } from '@/hooks/projects/useProjects';
import { useState } from 'react';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'all' | 'ongoing' | 'completed'>('all');

  const { data, isLoading, error } = useProjects({
    page,
    limit: 12,
    status: status === 'all' ? undefined : status,
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState />;

  const projects = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      {/* 필터 */}
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">전체</option>
        <option value="ongoing">진행 중</option>
        <option value="completed">완료</option>
      </select>

      {/* 프로젝트 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* 페이지네이션 */}
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

---

## 4. 성능 최적화

### 4.1 캐싱

- React Query로 5분간 캐싱
- `keepPreviousData: true`로 페이지 전환 시 이전 데이터 유지

### 4.2 데이터베이스 인덱스

```sql
-- 정렬 성능 향상
CREATE INDEX idx_projects_published_at ON projects(published_at DESC);
CREATE INDEX idx_projects_status ON projects(status);

-- 필터링 성능 향상
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);
```

---

## 5. 에러 케이스

| 상황              | HTTP Status | errorCode       | 메시지                              |
| ----------------- | ----------- | --------------- | ----------------------------------- |
| 잘못된 파라미터   | 400         | INVALID_PARAMS  | 잘못된 요청입니다                   |
| DB 조회 실패      | 500         | FETCH_FAILED    | 프로젝트 목록을 불러오는데 실패했습니다 |
| 네트워크 에러     | 500         | NETWORK_ERROR   | 서버 접속이 원활하지 않습니다       |

---

## 6. 확장 고려사항

- 전문 검색 (Elasticsearch)
- 무한 스크롤 지원
- 프로젝트 미리보기 최적화
- SSR/ISR 적용
