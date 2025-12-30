# API – Image Management

이 문서는 **Lucent Management**에서 이미지 파일을 관리하는 정책, 구조, 플로우를 정의한다.
Cloudflare R2와 연동하여 모든 이미지를 중앙 집중식으로 관리하며, 데이터베이스와의 분리를 통해 확장성과 유지보수성을 확보한다.

---

## 1. 이미지 관리 철학

### 1-1. 중앙 집중식 관리

- **모든 이미지는 `images` 테이블을 통해 관리**
- Cloudflare R2에 파일 저장 → DB에 메타데이터 저장
- 각 테이블은 이미지 파일 경로를 직접 저장하지 않고 `images` 테이블의 ID를 참조

### 1-2. 3계층 구조

```
Cloudflare R2 (실제 파일 저장)
       ↓
images 테이블 (메타데이터 + URL 관리)
       ↓
다른 테이블 (projects, artists, products 등)
```

### 1-3. 설계 목표

1. **확장성**: 이미지 재사용 가능, 다대다 관계 지원
2. **유지보수성**: 이미지 정보 수정 시 한 곳만 변경
3. **성능**: CDN 연동, 썸네일 자동 생성 지원
4. **추적성**: 업로드 사용자, 용도, 생성일 기록
5. **안전성**: 삭제 시 연관 테이블 영향 최소화 (SET NULL)

---

## 2. 데이터베이스 구조

### 2-1. images 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 이미지 고유 ID |
| `r2_key` | VARCHAR(500) | R2 버킷 내 파일 경로 (고유값) |
| `r2_bucket` | VARCHAR(100) | R2 버킷 이름 |
| `public_url` | VARCHAR(1000) | 공개 접근 URL |
| `file_name` | VARCHAR(255) | 원본 파일명 |
| `file_size` | INTEGER | 파일 크기 (bytes) |
| `mime_type` | VARCHAR(100) | MIME 타입 (image/png, image/jpeg 등) |
| `width` | INTEGER | 이미지 너비 (px, 선택) |
| `height` | INTEGER | 이미지 높이 (px, 선택) |
| `image_type` | VARCHAR(50) | 이미지 용도 분류 |
| `alt_text` | VARCHAR(500) | 접근성을 위한 대체 텍스트 |
| `cdn_url` | VARCHAR(1000) | CDN 최적화 URL (선택) |
| `thumbnail_url` | VARCHAR(1000) | 썸네일 URL (선택) |
| `uploaded_by` | UUID | 업로드한 사용자 (관리자) |
| `is_active` | BOOLEAN | 활성화 여부 |
| `created_at` | TIMESTAMPTZ | 생성일 |
| `updated_at` | TIMESTAMPTZ | 수정일 |

### 2-2. image_type 분류

| image_type | 설명 | 사용 테이블 |
|------------|------|-------------|
| `project_cover` | 프로젝트 커버 이미지 | `projects.cover_image_id` |
| `artist_profile` | 아티스트 프로필 이미지 | `artists.profile_image_id` |
| `product_main` | 상품 메인 이미지 | `products.main_image_id` |
| `product_gallery` | 상품 갤러리 이미지 | `product_images.image_id` |
| `banner` | 메인 페이지 배너 (2차 확장) | - |
| `thumbnail` | 자동 생성 썸네일 | - |

### 2-3. 이미지 참조 구조

#### 단일 이미지 참조 (1:1 또는 N:1)

```sql
-- Projects 테이블
CREATE TABLE projects (
    ...
    cover_image_id UUID REFERENCES images(id) ON DELETE SET NULL
);

-- Artists 테이블
CREATE TABLE artists (
    ...
    profile_image_id UUID REFERENCES images(id) ON DELETE SET NULL
);

-- Products 테이블
CREATE TABLE products (
    ...
    main_image_id UUID REFERENCES images(id) ON DELETE SET NULL
);
```

#### 다중 이미지 참조 (N:M) - 상품 이미지 갤러리

```sql
-- Product Images 중간 테이블
CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ
);
```

---

## 3. 이미지 업로드 플로우

### 3-1. 관리자 이미지 업로드

```
[관리자] 이미지 선택
    ↓
[클라이언트] 파일 검증 (크기, 형식)
    ↓
[API Route] POST /api/images/upload
    ↓
[서버] Cloudflare R2에 파일 업로드
    ↓
[서버] images 테이블에 메타데이터 저장
    ↓
[응답] { imageId, publicUrl, ... }
    ↓
[관리자] 상품/프로젝트/아티스트 생성 시 imageId 사용
```

### 3-2. 클라이언트 검증 규칙 (1차 MVP)

| 항목 | 규칙 |
|------|------|
| 파일 형식 | `image/jpeg`, `image/png`, `image/webp` |
| 파일 크기 | 최대 5MB |
| 이미지 해상도 | 최대 4000x4000px (권장: 1920x1080px) |
| 파일명 | 영문, 숫자, `-`, `_`만 허용 |

### 3-3. 서버 처리 로직

```ts
// API Route: /api/images/upload
export async function POST(req: Request) {
  // 1. 인증 확인 (관리자만)
  const user = await getAuthenticatedUser(req);
  if (!user.isAdmin) {
    return errorResponse('UNAUTHORIZED');
  }

  // 2. 파일 검증
  const formData = await req.formData();
  const file = formData.get('file') as File;
  validateImageFile(file); // 크기, 형식, 해상도 검증

  // 3. R2 업로드
  const r2Key = generateR2Key(file.name); // 예: images/2025/01/uuid-filename.png
  const uploadResult = await uploadToR2(file, r2Key);

  // 4. 이미지 메타데이터 추출
  const metadata = await extractImageMetadata(file); // width, height, mime_type

  // 5. DB 저장
  const image = await createImage({
    r2_key: r2Key,
    r2_bucket: process.env.R2_BUCKET_NAME,
    public_url: uploadResult.publicUrl,
    file_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    width: metadata.width,
    height: metadata.height,
    image_type: formData.get('image_type') as string,
    alt_text: formData.get('alt_text') as string || '',
    uploaded_by: user.id,
  });

  return successResponse(image);
}
```

---

## 4. 이미지 사용 패턴

### 4-1. 프로젝트 커버 이미지 설정

```ts
// 프로젝트 생성 시
await createProject({
  name: '0th Project',
  slug: '0th',
  cover_image_id: 'uuid-of-uploaded-image', // images 테이블의 ID
});
```

### 4-2. 상품 메인 이미지 + 갤러리 이미지

```ts
// 1. 상품 생성 (메인 이미지)
const product = await createProduct({
  name: '미루루 보이스팩',
  main_image_id: 'uuid-main-image',
  // ...
});

// 2. 갤러리 이미지 추가 (순서대로)
await addProductImages(product.id, [
  { image_id: 'uuid-gallery-1', display_order: 0 },
  { image_id: 'uuid-gallery-2', display_order: 1 },
  { image_id: 'uuid-gallery-3', display_order: 2 },
]);
```

### 4-3. 프론트엔드 이미지 조회

```ts
// React Query Hook 예시
export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      return response.json();
    },
  });
}

// API 응답 구조
{
  "status": "success",
  "data": {
    "id": "...",
    "name": "미루루 보이스팩",
    "main_image": {
      "id": "...",
      "public_url": "https://r2.example.com/images/...",
      "cdn_url": "https://cdn.example.com/images/...",
      "alt_text": "미루루 보이스팩 메인 이미지",
      "width": 1920,
      "height": 1080
    },
    "gallery_images": [
      {
        "id": "...",
        "public_url": "...",
        "display_order": 0
      },
      // ...
    ]
  }
}
```

---

## 5. R2 파일 경로 규칙

### 5-1. 경로 구조

```
/{image_type}/{year}/{month}/{uuid}-{filename}

예시:
- images/project_cover/2025/01/abc123-0th-cover.png
- images/artist_profile/2025/01/def456-miruru-profile.jpg
- images/product_main/2025/01/ghi789-voicepack-main.png
- images/product_gallery/2025/01/jkl012-voicepack-detail-1.png
```

### 5-2. 파일명 생성 로직

```ts
function generateR2Key(originalFilename: string, imageType: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();

  // 파일명 정규화 (특수문자 제거, 소문자 변환)
  const sanitized = originalFilename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-');

  return `images/${imageType}/${year}/${month}/${uuid}-${sanitized}`;
}
```

---

## 6. 이미지 삭제 정책

### 6-1. Soft Delete (기본)

- `is_active = false`로 설정
- R2 파일은 유지 (복구 가능)
- 연관 테이블은 계속 참조 가능 (public_url 접근 제한)

### 6-2. Hard Delete (관리자 수동)

- DB 레코드 삭제 시 `ON DELETE SET NULL` 동작
- 연관 테이블의 `*_image_id` 필드가 NULL로 설정
- R2 파일은 별도 스크립트로 정리 (2차 확장)

### 6-3. 고아 파일 정리 (2차 확장)

- 정기적으로 R2 파일 중 DB에 없는 파일 탐지
- 30일 이상 참조되지 않은 파일 자동 삭제

---

## 7. 성능 최적화

### 7-1. CDN 연동 (2차 확장)

- Cloudflare CDN을 통한 전 세계 배포
- `cdn_url` 필드에 최적화된 URL 저장
- 프론트엔드에서 `cdn_url` 우선 사용, 없으면 `public_url` 사용

### 7-2. 썸네일 자동 생성 (2차 확장)

- 업로드 시 자동으로 썸네일 생성
- 규칙: 최대 가로 400px, 비율 유지
- `thumbnail_url` 필드에 저장
- 목록 페이지에서 썸네일 사용 → 로딩 속도 개선

### 7-3. 이미지 리사이징 (2차 확장)

- Cloudflare Image Resizing API 활용
- URL 파라미터로 동적 리사이징
- 예: `https://cdn.example.com/images/abc.png?w=800&h=600&fit=cover`

---

## 8. 보안 정책

### 8-1. 업로드 권한

- **관리자만** 이미지 업로드 가능
- API Route에서 JWT 토큰 검증
- Supabase RLS 정책으로 이중 보호

### 8-2. 파일 검증

```ts
function validateImageFile(file: File) {
  // 1. MIME 타입 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('허용되지 않은 파일 형식입니다.');
  }

  // 2. 파일 크기 검증 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
  }

  // 3. 확장자 이중 검증 (MIME 타입 스푸핑 방지)
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new Error('허용되지 않은 파일 확장자입니다.');
  }
}
```

### 8-3. 공개 접근 제어

- 모든 이미지는 기본적으로 공개 접근 가능 (정적 자산)
- 민감한 이미지는 `is_active = false`로 비공개 처리
- Presigned URL은 사용하지 않음 (이미지는 모두 공개)

---

## 9. API 엔드포인트

### 9-1. 이미지 업로드

```
POST /api/images/upload
Content-Type: multipart/form-data

Request Body:
{
  file: File,
  image_type: 'project_cover' | 'artist_profile' | 'product_main' | 'product_gallery',
  alt_text: string (optional)
}

Response:
{
  "status": "success",
  "data": {
    "id": "uuid",
    "public_url": "https://r2.example.com/...",
    "file_name": "example.png",
    "file_size": 123456,
    "width": 1920,
    "height": 1080
  }
}
```

### 9-2. 이미지 목록 조회 (관리자)

```
GET /api/images?page=1&limit=20&image_type=product_main

Response:
{
  "status": "success",
  "data": [
    {
      "id": "...",
      "public_url": "...",
      "file_name": "...",
      "image_type": "product_main",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 9-3. 이미지 삭제 (Soft Delete)

```
DELETE /api/images/:id

Response:
{
  "status": "success",
  "message": "이미지가 비활성화되었습니다."
}
```

---

## 10. 프론트엔드 사용 가이드

### 10-1. 이미지 컴포넌트

```tsx
// components/ui/Image.tsx
interface ImageProps {
  src: string; // public_url 또는 cdn_url
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Image({ src, alt, width, height, className }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy" // 성능 최적화
    />
  );
}
```

### 10-2. 상품 이미지 갤러리

```tsx
// components/product/ProductGallery.tsx
interface ProductGalleryProps {
  mainImage: ImageData;
  galleryImages: ImageData[];
}

export function ProductGallery({ mainImage, galleryImages }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(mainImage);

  return (
    <div>
      <Image
        src={selectedImage.cdn_url || selectedImage.public_url}
        alt={selectedImage.alt_text}
        width={800}
        height={600}
      />
      <div className="thumbnails">
        {galleryImages.map((img) => (
          <button key={img.id} onClick={() => setSelectedImage(img)}>
            <Image
              src={img.thumbnail_url || img.public_url}
              alt={img.alt_text}
              width={100}
              height={100}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 11. 1차 MVP 범위

### 포함 사항

- ✅ images 테이블 생성
- ✅ 프로젝트/아티스트/상품 이미지 참조 구조
- ✅ 상품 갤러리 이미지 (product_images)
- ✅ 이미지 업로드 API
- ✅ R2 연동
- ✅ 파일 검증

### 제외 사항 (2차 확장)

- ⏸️ CDN 연동
- ⏸️ 썸네일 자동 생성
- ⏸️ 이미지 리사이징
- ⏸️ 고아 파일 정리
- ⏸️ 배너 이미지 관리

---

## 12. 마이그레이션 가이드

기존 프로젝트에서 이미지 관리 구조를 전환하는 경우:

1. `images` 테이블 생성
2. 기존 이미지 파일을 R2로 이전
3. `images` 테이블에 메타데이터 입력
4. 기존 테이블의 URL 컬럼을 `*_image_id`로 변경
5. 데이터 마이그레이션 스크립트 실행

---

## 요약

- **Cloudflare R2 - images 테이블 - 다른 테이블** 3계층 구조
- 모든 이미지는 `images` 테이블에서 중앙 관리
- 단일 이미지는 `*_image_id` 참조, 다중 이미지는 중간 테이블 사용
- 관리자만 업로드 가능, 파일 검증 필수
- 1차 MVP는 기본 업로드 및 참조 구조만 구현
- CDN, 썸네일, 리사이징은 2차 확장

이 구조를 통해 **확장성**, **유지보수성**, **성능**, **추적성**을 모두 확보할 수 있다.
