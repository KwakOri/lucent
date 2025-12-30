# Projects React Query Hooks

이 문서는 **프로젝트(Projects) React Query Hooks** 구현을 정의한다.

> **범위**: 프로젝트 데이터 fetching 및 상태 관리 Hooks
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/projects/index.md`
> - API Routes: `/specs/api/server/routes/projects/index.md`

---

## 1. QueryKey 구조

### 1.1 QueryKey 정의

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    bySlug: (slug: string) =>
      [...queryKeys.projects.details(), 'slug', slug] as const,
  },
} as const;
```

### 1.2 QueryKey 사용 예시

```ts
// 프로젝트 목록 (필터 포함)
queryKeys.projects.list({ page: 1 })
// → ['projects', 'list', { page: 1 }]

// 프로젝트 상세 (ID)
queryKeys.projects.detail('project-uuid')
// → ['projects', 'detail', 'project-uuid']

// 프로젝트 상세 (Slug)
queryKeys.projects.bySlug('0th')
// → ['projects', 'detail', 'slug', '0th']

// 모든 프로젝트 목록 무효화
queryKeys.projects.lists()
// → ['projects', 'list']
```

---

## 2. Query Hooks

### 2.1 useProjects (프로젝트 목록)

```ts
// lib/client/hooks/useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { ProjectsAPI, type GetProjectsParams } from '@/lib/client/services/projects.api';
import { queryKeys } from './query-keys';

export function useProjects(params?: GetProjectsParams) {
  return useQuery({
    queryKey: queryKeys.projects.list(params || {}),
    queryFn: () => ProjectsAPI.getProjects(params),
    keepPreviousData: true, // 페이지네이션 시 이전 데이터 유지
    staleTime: 1000 * 60 * 10, // 10분
  });
}
```

**사용 예시**:

```tsx
function ProjectList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, isPreviousData } = useProjects({
    page,
    limit: 12,
    sortBy: 'order_index',
    order: 'asc',
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const projects = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {pagination && (
        <Pagination
          current={pagination.page}
          total={pagination.totalPages}
          onChange={setPage}
          disabled={isPreviousData}
        />
      )}
    </div>
  );
}
```

### 2.2 useProject (프로젝트 상세 - ID)

```ts
// lib/client/hooks/useProject.ts
import { useQuery } from '@tanstack/react-query';
import { ProjectsAPI } from '@/lib/client/services/projects.api';
import { queryKeys } from './query-keys';

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => ProjectsAPI.getProject(id),
    enabled: !!id, // id가 있을 때만 실행
    staleTime: 1000 * 60 * 15, // 15분
  });
}
```

**사용 예시**:

```tsx
function ProjectDetail({ projectId }: { projectId: string }) {
  const { data: projectData, isLoading, error } = useProject(projectId);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!projectData?.data) return <NotFound />;

  const project = projectData.data;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      {project.cover_image && (
        <img
          src={project.cover_image.cdn_url || project.cover_image.public_url}
          alt={project.cover_image.alt_text}
        />
      )}

      {project.artists && (
        <div className="artists">
          <h2>참여 아티스트</h2>
          {project.artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2.3 useProjectBySlug (프로젝트 상세 - Slug)

```ts
// lib/client/hooks/useProjectBySlug.ts
import { useQuery } from '@tanstack/react-query';
import { ProjectsAPI } from '@/lib/client/services/projects.api';
import { queryKeys } from './query-keys';

export function useProjectBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.projects.bySlug(slug),
    queryFn: () => ProjectsAPI.getProjectBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 15, // 15분
  });
}
```

**사용 예시**:

```tsx
// /projects/0th
function ProjectPage({ slug }: { slug: string }) {
  const { data, isLoading } = useProjectBySlug(slug);

  if (isLoading) return <Loading />;

  const project = data?.data;
  if (!project) return <NotFound />;

  return <ProjectDetail project={project} />;
}
```

---

## 3. Mutation Hooks

프로젝트는 **읽기 전용**이므로 Mutation Hook은 없습니다.

관리자 기능이 추가되는 경우:
- `useCreateProject()` - 프로젝트 생성
- `useUpdateProject()` - 프로젝트 수정
- `useDeleteProject()` - 프로젝트 삭제

---

## 4. 실전 예시

### 4.1 프로젝트 목록 + 필터링

```tsx
function ProjectListWithFilters() {
  const [filters, setFilters] = useState<GetProjectsParams>({
    page: 1,
    limit: 12,
    sortBy: 'order_index',
    order: 'asc',
  });

  const { data, isLoading, isPreviousData } = useProjects(filters);

  const handleSortChange = (sortBy: 'order_index' | 'created_at' | 'name') => {
    setFilters((prev) => ({ ...prev, sortBy, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div>
      <SortBar currentSort={filters.sortBy} onSortChange={handleSortChange} />

      {isLoading && <Loading />}

      {data && (
        <>
          <ProjectGrid projects={data.data} />
          <Pagination
            current={data.pagination.page}
            total={data.pagination.totalPages}
            onChange={handlePageChange}
            disabled={isPreviousData}
          />
        </>
      )}
    </div>
  );
}
```

### 4.2 프로젝트 상세 + 아티스트 목록

```tsx
function ProjectDetailPage({ slug }: { slug: string }) {
  const { data: projectData, isLoading } = useProjectBySlug(slug);

  if (isLoading) return <Loading />;

  const project = projectData?.data;
  if (!project) return <NotFound />;

  return (
    <div>
      <section className="project-hero">
        {project.cover_image && (
          <img
            src={project.cover_image.cdn_url || project.cover_image.public_url}
            alt={project.cover_image.alt_text}
            className="cover"
          />
        )}
        <h1>{project.name}</h1>
        <p>{project.description}</p>
      </section>

      {project.artists && project.artists.length > 0 && (
        <section className="artists">
          <h2>참여 아티스트</h2>
          <div className="artist-grid">
            {project.artists.map((artist) => (
              <Link key={artist.id} href={`/goods/${artist.slug}`}>
                <ArtistCard artist={artist} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

### 4.3 메인 페이지 프로젝트 프리뷰

```tsx
function HomeProjectsSection() {
  // 최근 3개 프로젝트만 표시
  const { data, isLoading } = useProjects({
    limit: 3,
    sortBy: 'created_at',
    order: 'desc',
  });

  if (isLoading) return <ProjectsSkeleton />;

  const projects = data?.data || [];

  return (
    <section className="home-projects">
      <h2>최근 프로젝트</h2>
      <div className="project-carousel">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <Link href="/projects">모든 프로젝트 보기 →</Link>
    </section>
  );
}
```

---

## 5. 에러 처리

### 5.1 Hook 레벨 에러 처리

```ts
export function useProjects(params?: GetProjectsParams) {
  return useQuery({
    queryKey: queryKeys.projects.list(params || {}),
    queryFn: () => ProjectsAPI.getProjects(params),
    onError: (error) => {
      if (error instanceof ApiError) {
        console.error('Projects fetch error:', error.message);
      }
    },
  });
}
```

### 5.2 Component 레벨 에러 처리

```tsx
function ProjectList() {
  const { data, error, isError } = useProjects();

  if (isError) {
    if (error instanceof ApiError) {
      if (error.statusCode === 404) {
        return <NotFound />;
      }
      return <Error message={error.message} />;
    }
    return <Error message="알 수 없는 오류가 발생했습니다" />;
  }

  return <ProjectGrid projects={data?.data || []} />;
}
```

---

## 6. 캐시 관리

### 6.1 Cache Invalidation

프로젝트 데이터가 변경되었을 때 캐시 무효화:

```ts
import { useQueryClient } from '@tanstack/react-query';

function AdminPanel() {
  const queryClient = useQueryClient();

  const handleProjectUpdate = async () => {
    // 프로젝트 수정 후...

    // 모든 프로젝트 목록 캐시 무효화
    await queryClient.invalidateQueries({
      queryKey: queryKeys.projects.lists(),
    });

    // 특정 프로젝트 상세 캐시 무효화
    await queryClient.invalidateQueries({
      queryKey: queryKeys.projects.detail(projectId),
    });
  };
}
```

### 6.2 Prefetching

페이지 전환 전에 데이터 미리 로드:

```tsx
import { useQueryClient } from '@tanstack/react-query';

function ProjectCard({ project }: { project: Project }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // 프로젝트 상세 데이터 prefetch
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(project.id),
      queryFn: () => ProjectsAPI.getProject(project.id),
    });
  };

  return (
    <Link href={`/projects/${project.slug}`} onMouseEnter={handleMouseEnter}>
      <ProjectCardContent project={project} />
    </Link>
  );
}
```

---

## 7. 성능 최적화

### 7.1 staleTime 설정

```ts
// 프로젝트 목록: 10분
staleTime: 1000 * 60 * 10

// 프로젝트 상세: 15분
staleTime: 1000 * 60 * 15
```

### 7.2 keepPreviousData

페이지네이션 시 이전 데이터 유지:

```ts
useQuery({
  queryKey: queryKeys.projects.list(params),
  queryFn: () => ProjectsAPI.getProjects(params),
  keepPreviousData: true, // 페이지 전환 시 깜빡임 방지
});
```

### 7.3 Select를 사용한 데이터 변환

필요한 데이터만 추출:

```ts
function useProjectNames() {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => ProjectsAPI.getProjects(),
    select: (data) => data.data.map((p) => p.name),
  });
}
```

---

## 8. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/projects/index.md`
- API Routes: `/specs/api/server/routes/projects/index.md`
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
