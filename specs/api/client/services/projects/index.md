# Projects Client Services

이 문서는 **프로젝트(Projects) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 프로젝트 API를 호출하는 Client Services Layer
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/projects/index.md`
> - API Routes: `/specs/api/server/routes/projects/index.md`

---

## 1. 개요

**ProjectsAPI**는 프론트엔드에서 프로젝트 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/projects.api.ts`
**사용 대상**: React Query Hook에서만 호출
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 Project 타입

```ts
// lib/client/services/projects.api.ts
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;

  cover_image: {
    id: string;
    public_url: string;
    cdn_url?: string;
    thumbnail_url?: string;
    alt_text?: string;
    width?: number;
    height?: number;
  } | null;

  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  artists?: {
    id: string;
    name: string;
    slug: string;
    profile_image: {
      public_url: string;
      cdn_url?: string;
    } | null;
  }[];
}
```

### 2.2 쿼리 파라미터 타입

```ts
export interface GetProjectsParams {
  page?: number;
  limit?: number;
  sortBy?: 'order_index' | 'created_at' | 'name';
  order?: 'asc' | 'desc';
  artistSlug?: string;
}
```

### 2.3 응답 타입

```ts
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

// 목록 응답
type ProjectListResponse = PaginatedResponse<Project>;

// 상세 응답
type ProjectDetailResponse = ApiResponse<Project>;
```

---

## 3. ProjectsAPI 구현

### 3.1 기본 구조

```ts
// lib/client/services/projects.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export const ProjectsAPI = {
  /**
   * 프로젝트 목록 조회
   */
  async getProjects(params?: GetProjectsParams): Promise<PaginatedResponse<Project>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.artistSlug) searchParams.set('filter[artist]', params.artistSlug);

    return apiClient.get(`/api/projects?${searchParams}`);
  },

  /**
   * 프로젝트 단일 조회 (ID)
   */
  async getProject(id: string): Promise<ApiResponse<Project>> {
    return apiClient.get(`/api/projects/${id}`);
  },

  /**
   * 프로젝트 단일 조회 (Slug)
   */
  async getProjectBySlug(slug: string): Promise<ApiResponse<Project>> {
    return apiClient.get(`/api/projects/${slug}`);
  },
};
```

---

## 4. 사용 예시

### 4.1 프로젝트 목록 조회

```ts
import { ProjectsAPI } from '@/lib/client/services/projects.api';

// 기본 목록
const response = await ProjectsAPI.getProjects();
console.log(response.data); // Project[]
console.log(response.pagination); // { total, page, limit, totalPages }

// 필터링 + 페이지네이션
const filtered = await ProjectsAPI.getProjects({
  page: 1,
  limit: 12,
  artistSlug: 'miruru',
  sortBy: 'order_index',
  order: 'asc',
});
```

### 4.2 프로젝트 상세 조회

```ts
// ID로 조회
const project = await ProjectsAPI.getProject('project-uuid');
console.log(project.data); // Project

// Slug로 조회
const projectBySlug = await ProjectsAPI.getProjectBySlug('0th');
console.log(projectBySlug.data); // Project
```

---

## 5. 에러 처리

### 5.1 API Client의 자동 에러 처리

`apiClient`는 자동으로 `ApiError`를 던집니다:

```ts
// lib/client/utils/api-client.ts
if (!response.ok) {
  throw new ApiError(
    data.message || '요청 실패',
    response.status,
    data.errorCode
  );
}
```

### 5.2 에러 핸들링 예시

```ts
import { ApiError } from '@/lib/client/utils/api-error';

try {
  const project = await ProjectsAPI.getProject('invalid-id');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      console.error('프로젝트를 찾을 수 없습니다');
    } else if (error.errorCode === 'PROJECT_FETCH_FAILED') {
      console.error('프로젝트 조회 실패');
    }
  }
}
```

---

## 6. Query Parameters 빌더

### 6.1 URLSearchParams 사용

```ts
const searchParams = new URLSearchParams();

// 기본 파라미터
if (params?.page) searchParams.set('page', String(params.page));
if (params?.limit) searchParams.set('limit', String(params.limit));

// 정렬
if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
if (params?.order) searchParams.set('order', params.order);

// 필터 (filter[key] 형식)
if (params?.artistSlug) searchParams.set('filter[artist]', params.artistSlug);

const url = `/api/projects?${searchParams}`;
// → /api/projects?page=1&limit=12&filter[artist]=miruru
```

---

## 7. 응답 형식

### 7.1 목록 응답

```ts
{
  status: 'success',
  data: Project[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### 7.2 상세 응답

```ts
{
  status: 'success',
  data: Project
}
```

### 7.3 에러 응답

```ts
{
  status: 'error',
  message: string,
  errorCode?: string
}
```

---

## 8. 타입 안전성

### 8.1 TypeScript 타입 체크

모든 API 메서드는 타입 안전성을 보장합니다:

```ts
// ✅ 올바른 사용
const params: GetProjectsParams = {
  page: 1,
  sortBy: 'order_index', // 자동완성 지원
};

// ❌ 컴파일 에러
const invalid: GetProjectsParams = {
  page: 1,
  sortBy: 'invalid_field', // Type error!
};
```

### 8.2 응답 타입 추론

```ts
const response = await ProjectsAPI.getProjects();
// response.data는 Project[] 타입
// response.pagination은 PaginationMeta 타입

const project = await ProjectsAPI.getProject('id');
// project.data는 Project 타입
```

---

## 9. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/projects/index.md`
- API Routes: `/specs/api/server/routes/projects/index.md`
- API 공통 타입: `/lib/shared/types/api.types.ts`
