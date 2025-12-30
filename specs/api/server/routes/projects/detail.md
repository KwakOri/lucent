# Projects – Detail Spec

이 문서는 **프로젝트 상세 조회** API 스펙을 정의한다.

---

## 1. API 스펙

### 1.1 엔드포인트

```
GET /api/projects/:id
```

### 1.2 인증

- **불필요**: 공개 API

### 1.3 요청

**Path Parameters**

- `id` (required): 프로젝트 ID

**예시**

```
GET /api/projects/proj_001
```

### 1.4 응답

**성공 (200 OK)**

```json
{
  "status": "success",
  "data": {
    "id": "proj_001",
    "title": "미루루 보이스팩 vol.1 출시",
    "description": "미루루의 첫 번째 보이스팩이 출시되었습니다. 일상 대화부터 특별한 순간까지, 미루루의 다양한 목소리를 만나보세요.",
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

    "tags": ["voice", "digital", "miruru"],

    "links": [
      {
        "type": "youtube",
        "url": "https://youtube.com/watch?v=xxx",
        "label": "샘플 듣기"
      },
      {
        "type": "twitter",
        "url": "https://twitter.com/lucent_mgmt/status/xxx"
      }
    ],

    "images": [
      "https://r2.example.com/projects/proj_001/img1.jpg",
      "https://r2.example.com/projects/proj_001/img2.jpg",
      "https://r2.example.com/projects/proj_001/img3.jpg"
    ],

    "videoUrl": "https://r2.example.com/projects/proj_001/video.mp4",

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
}
```

**에러 (404 Not Found)**

```json
{
  "status": "error",
  "message": "프로젝트를 찾을 수 없습니다",
  "errorCode": "PROJECT_NOT_FOUND"
}
```

**에러 (500 Internal Server Error)**

```json
{
  "status": "error",
  "message": "프로젝트를 불러오는데 실패했습니다",
  "errorCode": "FETCH_FAILED"
}
```

---

## 2. 처리 로직

### 2.1 서버 처리 흐름

```
1. Path Parameter에서 ID 추출
   ↓
2. Supabase에서 프로젝트 조회
   ↓
3. 관련 아티스트 정보 조인
   ↓
4. 관련 굿즈 정보 조인
   ↓
5. 데이터 존재 여부 확인
   ↓
6. 응답 반환
```

### 2.2 구현 예시

```ts
// app/api/projects/[id]/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      artists:project_artists(
        artist:artists(*)
      ),
      related_goods:project_goods(
        goods:goods(
          id,
          name,
          thumbnail_url,
          price,
          status
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return Response.json(
      {
        status: 'error',
        message: '프로젝트를 찾을 수 없습니다',
        errorCode: 'PROJECT_NOT_FOUND'
      },
      { status: 404 }
    );
  }

  return Response.json({
    status: 'success',
    data
  });
}
```

---

## 3. 클라이언트 처리

### 3.1 Service Layer

```ts
// services/project.service.ts
export class ProjectService {
  static async getProject(id: string): Promise<ApiResponse<Project>> {
    const response = await fetch(`/api/projects/${id}`);
    return response.json();
  }
}
```

### 3.2 React Query Hook

```ts
// hooks/projects/useProject.ts
import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '@/services/project.service';

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => ProjectService.getProject(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10분
    retry: 1,
  });
};
```

### 3.3 사용 예시

```tsx
// app/projects/[id]/page.tsx
'use client';
import { useProject } from '@/hooks/projects/useProject';
import { notFound } from 'next/navigation';

export default function ProjectDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { data, isLoading, error } = useProject(params.id);

  if (isLoading) {
    return <Loading />;
  }

  if (error || !data?.data) {
    notFound();
  }

  const project = data.data;

  return (
    <div>
      <h1>{project.title}</h1>
      <img src={project.thumbnailUrl} alt={project.title} />
      <p>{project.description}</p>

      {/* 아티스트 정보 */}
      <div>
        {project.artists.map(artist => (
          <ArtistChip key={artist.id} artist={artist} />
        ))}
      </div>

      {/* 이미지 갤러리 */}
      {project.images && (
        <ImageGallery images={project.images} />
      )}

      {/* 관련 굿즈 */}
      {project.relatedGoods && project.relatedGoods.length > 0 && (
        <div>
          <h2>관련 굿즈</h2>
          <div className="grid grid-cols-2 gap-4">
            {project.relatedGoods.map(goods => (
              <GoodsCard key={goods.id} goods={goods} />
            ))}
          </div>
        </div>
      )}

      {/* SNS 링크 */}
      {project.links && (
        <div>
          {project.links.map((link, index) => (
            <SocialLink key={index} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 4. SEO 최적화

### 4.1 Server Component 활용

```tsx
// app/projects/[id]/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';

export async function generateMetadata({
  params
}: {
  params: { id: string }
}): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('projects')
    .select('title, description, thumbnail_url')
    .eq('id', params.id)
    .single();

  if (!data) {
    return {
      title: 'Project Not Found'
    };
  }

  return {
    title: `${data.title} | Lucent Management`,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      images: [data.thumbnail_url]
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: [data.thumbnail_url]
    }
  };
}

export default async function ProjectDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
```

### 4.2 정적 생성 (ISR)

```tsx
// app/projects/[id]/page.tsx
export const revalidate = 3600; // 1시간마다 재생성

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .limit(50); // 인기 프로젝트 50개만 사전 생성

  return projects?.map((project) => ({
    id: project.id
  })) || [];
}
```

---

## 5. 성능 최적화

### 5.1 이미지 최적화

- Next.js Image 컴포넌트 사용
- Cloudflare R2 + Image Resizing 활용
- Lazy Loading 적용

### 5.2 데이터 프리페칭

```tsx
// app/projects/page.tsx
'use client';
import { useQueryClient } from '@tanstack/react-query';
import { ProjectService } from '@/services/project.service';

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  const handleProjectHover = (id: string) => {
    // 마우스 오버 시 상세 데이터 프리페칭
    queryClient.prefetchQuery({
      queryKey: ['projects', id],
      queryFn: () => ProjectService.getProject(id)
    });
  };

  return (
    <div>
      {projects.map(project => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          onMouseEnter={() => handleProjectHover(project.id)}
        >
          <ProjectCard project={project} />
        </Link>
      ))}
    </div>
  );
}
```

---

## 6. 에러 케이스

| 상황              | HTTP Status | errorCode           | 메시지                          |
| ----------------- | ----------- | ------------------- | ------------------------------- |
| 프로젝트 없음     | 404         | PROJECT_NOT_FOUND   | 프로젝트를 찾을 수 없습니다     |
| 잘못된 ID 형식    | 400         | INVALID_ID          | 잘못된 프로젝트 ID입니다        |
| DB 조회 실패      | 500         | FETCH_FAILED        | 프로젝트를 불러오는데 실패했습니다 |
| 네트워크 에러     | 500         | NETWORK_ERROR       | 서버 접속이 원활하지 않습니다   |

---

## 7. 확장 고려사항

- 조회수 카운트
- 관련 프로젝트 추천
- 공유 기능 (SNS 공유)
- 프로젝트 알림 설정
