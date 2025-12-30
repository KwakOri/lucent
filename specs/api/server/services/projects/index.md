# Project Service

이 문서는 **프로젝트(Project) Server Service** 구현을 정의한다.

> **범위**: 프로젝트 관련 비즈니스 로직 및 DB 접근
> **관련 문서**:
> - Server Service 패턴: `/specs/api/server/services/index.md`
> - API Routes: `/specs/api/server/routes/projects/index.md`
> - Database Types: `/types/database.ts`

---

## 1. 개요

**ProjectService**는 프로젝트 관련 모든 비즈니스 로직과 데이터베이스 접근을 담당한다.

**위치**: `/lib/server/services/project.service.ts`
**사용 대상**: API Route에서만 호출
**역할**: 프로젝트 CRUD, 아티스트 조회

---

## 2. 데이터 모델

### 2.1 Project 타입

```ts
import { Tables, TablesInsert, TablesUpdate } from '@/types/database';

type Project = Tables<'projects'>;
type ProjectInsert = TablesInsert<'projects'>;
type ProjectUpdate = TablesUpdate<'projects'>;
```

### 2.2 확장 타입 (JOIN 포함)

```ts
interface ProjectWithRelations extends Project {
  cover_image: {
    id: string;
    public_url: string;
    cdn_url?: string;
    thumbnail_url?: string;
    alt_text?: string;
    width?: number;
    height?: number;
  } | null;

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

---

## 3. ProjectService 클래스

### 3.1 기본 구조

```ts
// lib/server/services/project.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';

type Project = Tables<'projects'>;

interface GetProjectsOptions {
  page?: number;
  limit?: number;
  sortBy?: 'order_index' | 'created_at' | 'name';
  order?: 'asc' | 'desc';
  artistSlug?: string;
  isActive?: boolean;
}

export class ProjectService {
  // 메서드 구현...
}
```

---

## 4. 주요 메서드

### 4.1 프로젝트 목록 조회

```ts
/**
 * 프로젝트 목록 조회
 */
static async getProjects(
  options: GetProjectsOptions = {}
): Promise<{ projects: ProjectWithRelations[]; total: number }> {
  const supabase = createServerClient();
  const {
    page = 1,
    limit = 12,
    sortBy = 'order_index',
    order = 'asc',
    artistSlug,
    isActive = true,
  } = options;

  let query = supabase
    .from('projects')
    .select(
      `
      *,
      cover_image:images!projects_cover_image_id_fkey (
        id,
        public_url,
        cdn_url,
        thumbnail_url,
        alt_text,
        width,
        height
      ),
      artists (
        id,
        name,
        slug,
        profile_image:images (
          public_url,
          cdn_url
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('is_active', isActive);

  // 아티스트 필터
  if (artistSlug) {
    query = query.eq('artists.slug', artistSlug);
  }

  // 정렬
  query = query.order(sortBy, { ascending: order === 'asc' });

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new ApiError('프로젝트 목록 조회 실패', 500, 'PROJECT_FETCH_FAILED');
  }

  return {
    projects: data as ProjectWithRelations[],
    total: count || 0,
  };
}
```

### 4.2 프로젝트 단일 조회 (ID)

```ts
/**
 * 프로젝트 단일 조회 (ID)
 */
static async getProjectById(id: string): Promise<ProjectWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      cover_image:images!projects_cover_image_id_fkey (
        id,
        public_url,
        cdn_url,
        thumbnail_url,
        alt_text,
        width,
        height
      ),
      artists (
        id,
        name,
        slug,
        description,
        profile_image:images (
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
    throw new ApiError('프로젝트 조회 실패', 500, 'PROJECT_FETCH_FAILED');
  }

  return data as ProjectWithRelations | null;
}
```

### 4.3 프로젝트 단일 조회 (Slug)

```ts
/**
 * 프로젝트 단일 조회 (Slug)
 */
static async getProjectBySlug(slug: string): Promise<ProjectWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      cover_image:images!projects_cover_image_id_fkey (*),
      artists (
        id,
        name,
        slug,
        description,
        profile_image:images (*)
      )
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('프로젝트 조회 실패', 500, 'PROJECT_FETCH_FAILED');
  }

  return data as ProjectWithRelations | null;
}
```

### 4.4 프로젝트 생성 (관리자)

```ts
/**
 * 프로젝트 생성 (관리자 전용)
 */
static async createProject(
  data: Omit<ProjectInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<Project> {
  const supabase = createServerClient();

  // 필수 필드 검증
  if (!data.name || !data.slug) {
    throw new ApiError('필수 필드 누락', 400, 'INVALID_INPUT');
  }

  // slug 중복 확인
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', data.slug)
    .single();

  if (existing) {
    throw new ApiError('이미 존재하는 프로젝트 slug입니다', 400, 'DUPLICATE_SLUG');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new ApiError('프로젝트 생성 실패', 500, 'PROJECT_CREATE_FAILED');
  }

  return project;
}
```

### 4.5 프로젝트 수정 (관리자)

```ts
/**
 * 프로젝트 수정 (관리자 전용)
 */
static async updateProject(
  id: string,
  data: ProjectUpdate
): Promise<Project> {
  const supabase = createServerClient();

  const { data: project, error } = await supabase
    .from('projects')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ApiError('프로젝트 업데이트 실패', 500, 'PROJECT_UPDATE_FAILED');
  }

  return project;
}
```

---

## 5. 이미지 관리

### 5.1 커버 이미지

프로젝트의 커버 이미지는 `projects.cover_image_id`를 통해 `images` 테이블과 연결됩니다.

```ts
// JOIN 쿼리에서 자동으로 로드
cover_image:images!projects_cover_image_id_fkey (
  id,
  public_url,
  cdn_url,
  thumbnail_url,
  alt_text
)
```

---

## 6. 에러 처리

### 6.1 에러 코드

| 에러 코드 | 상태 코드 | 설명 |
|-----------|-----------|------|
| `PROJECT_NOT_FOUND` | 404 | 프로젝트를 찾을 수 없음 |
| `PROJECT_FETCH_FAILED` | 500 | 프로젝트 조회 실패 |
| `PROJECT_CREATE_FAILED` | 500 | 프로젝트 생성 실패 |
| `PROJECT_UPDATE_FAILED` | 500 | 프로젝트 업데이트 실패 |
| `DUPLICATE_SLUG` | 400 | slug 중복 |
| `INVALID_INPUT` | 400 | 필수 필드 누락 |

### 6.2 사용 예시

```ts
if (!project) {
  throw new ApiError('프로젝트를 찾을 수 없습니다', 404, 'PROJECT_NOT_FOUND');
}
```

---

## 7. 참고 문서

- Server Service 패턴: `/specs/api/server/services/index.md`
- API Routes: `/specs/api/server/routes/projects/index.md`
- Client Services: `/specs/api/client/services/projects/index.md`
- Database Types: `/types/database.ts`
