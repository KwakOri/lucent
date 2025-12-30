# Image Service

이 문서는 **이미지(Image) Server Service** 구현을 정의한다.

> **범위**: 이미지 관련 비즈니스 로직 및 DB 접근
> **관련 문서**:
> - Server Service 패턴: `/specs/api/server/services/index.md`
> - API Routes: `/specs/api/server/routes/images/index.md`
> - Database Types: `/types/database.ts`

---

## 1. 개요

**ImageService**는 이미지 업로드, 관리, 조회 관련 모든 비즈니스 로직과 데이터베이스 접근을 담당한다.

**위치**: `/lib/server/services/image.service.ts`
**사용 대상**: API Route에서만 호출
**역할**: 이미지 업로드, R2 연동, 메타데이터 관리

---

## 2. 데이터 모델

### 2.1 Image 타입

```ts
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/types/database';

type Image = Tables<'images'>;
type ImageInsert = TablesInsert<'images'>;
type ImageUpdate = TablesUpdate<'images'>;
type ImageType = Enums<'image_type'>;
```

### 2.2 Image 구조

```ts
interface Image {
  id: string;
  r2_key: string; // R2 버킷 내 파일 경로
  r2_bucket: string; // R2 버킷 이름
  public_url: string; // 공개 접근 URL
  file_name: string; // 원본 파일명
  file_size: number; // 파일 크기 (bytes)
  mime_type: string; // MIME 타입
  width: number | null; // 이미지 너비 (px)
  height: number | null; // 이미지 높이 (px)
  image_type: string; // 이미지 용도 분류
  alt_text: string | null; // 대체 텍스트
  cdn_url: string | null; // CDN URL (선택)
  thumbnail_url: string | null; // 썸네일 URL (선택)
  uploaded_by: string; // 업로드한 사용자 (관리자)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## 3. ImageService 클래스

### 3.1 기본 구조

```ts
// lib/server/services/image.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables, TablesInsert, Enums } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';
import { uploadToR2, deleteFromR2 } from '@/lib/server/utils/r2';

type Image = Tables<'images'>;
type ImageType = Enums<'image_type'>;

interface GetImagesOptions {
  page?: number;
  limit?: number;
  imageType?: ImageType;
  isActive?: boolean;
}

export class ImageService {
  // 메서드 구현...
}
```

---

## 4. 주요 메서드

### 4.1 이미지 업로드

```ts
/**
 * 이미지 업로드 (R2 + DB)
 */
static async uploadImage(
  file: File,
  imageType: ImageType,
  uploadedBy: string,
  altText?: string
): Promise<Image> {
  // 1. 파일 검증
  this.validateImageFile(file);

  // 2. R2 키 생성
  const r2Key = this.generateR2Key(file.name, imageType);

  // 3. R2 업로드
  const uploadResult = await uploadToR2(file, r2Key);

  // 4. 이미지 메타데이터 추출
  const metadata = await this.extractImageMetadata(file);

  // 5. DB 저장
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('images')
    .insert({
      r2_key: r2Key,
      r2_bucket: process.env.R2_BUCKET_NAME!,
      public_url: uploadResult.publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      width: metadata.width,
      height: metadata.height,
      image_type: imageType,
      alt_text: altText || '',
      uploaded_by: uploadedBy,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    // 업로드 실패 시 R2 파일 삭제
    await deleteFromR2(r2Key).catch(console.error);
    throw new ApiError('이미지 저장 실패', 500, 'IMAGE_SAVE_FAILED');
  }

  return data;
}
```

### 4.2 이미지 목록 조회

```ts
/**
 * 이미지 목록 조회 (관리자)
 */
static async getImages(
  options: GetImagesOptions = {}
): Promise<{ images: Image[]; total: number }> {
  const supabase = createServerClient();
  const {
    page = 1,
    limit = 20,
    imageType,
    isActive = true,
  } = options;

  let query = supabase
    .from('images')
    .select('*', { count: 'exact' })
    .eq('is_active', isActive);

  // 이미지 타입 필터
  if (imageType) {
    query = query.eq('image_type', imageType);
  }

  // 정렬 (최신순)
  query = query.order('created_at', { ascending: false });

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new ApiError('이미지 목록 조회 실패', 500, 'IMAGE_FETCH_FAILED');
  }

  return {
    images: data,
    total: count || 0,
  };
}
```

### 4.3 이미지 단일 조회

```ts
/**
 * 이미지 단일 조회
 */
static async getImageById(id: string): Promise<Image | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('이미지 조회 실패', 500, 'IMAGE_FETCH_FAILED');
  }

  return data;
}
```

### 4.4 이미지 삭제 (Soft Delete)

```ts
/**
 * 이미지 비활성화 (Soft Delete)
 */
static async deactivateImage(id: string): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('images')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new ApiError('이미지 삭제 실패', 500, 'IMAGE_DELETE_FAILED');
  }
}
```

### 4.5 이미지 Hard Delete (관리자)

```ts
/**
 * 이미지 완전 삭제 (DB + R2)
 */
static async deleteImagePermanently(id: string): Promise<void> {
  const supabase = createServerClient();

  // 1. 이미지 정보 조회
  const image = await this.getImageById(id);
  if (!image) {
    throw new ApiError('이미지를 찾을 수 없습니다', 404, 'IMAGE_NOT_FOUND');
  }

  // 2. DB에서 삭제
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ApiError('이미지 삭제 실패', 500, 'IMAGE_DELETE_FAILED');
  }

  // 3. R2에서 삭제
  try {
    await deleteFromR2(image.r2_key);
  } catch (error) {
    console.error('R2 파일 삭제 실패:', error);
    // R2 삭제 실패는 로깅만 하고 에러를 던지지 않음
  }
}
```

---

## 5. 헬퍼 메서드

### 5.1 파일 검증

```ts
/**
 * 이미지 파일 검증
 */
private static validateImageFile(file: File): void {
  // 1. MIME 타입 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new ApiError(
      '허용되지 않은 파일 형식입니다. (jpeg, png, webp만 가능)',
      400,
      'INVALID_FILE_TYPE'
    );
  }

  // 2. 파일 크기 검증 (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new ApiError(
      '파일 크기는 5MB를 초과할 수 없습니다.',
      400,
      'FILE_TOO_LARGE'
    );
  }

  // 3. 확장자 검증
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new ApiError(
      '허용되지 않은 파일 확장자입니다.',
      400,
      'INVALID_FILE_EXTENSION'
    );
  }
}
```

### 5.2 R2 키 생성

```ts
/**
 * R2 키 생성
 */
private static generateR2Key(fileName: string, imageType: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();

  // 파일명 정규화
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-');

  return `images/${imageType}/${year}/${month}/${uuid}-${sanitized}`;
}
```

### 5.3 이미지 메타데이터 추출

```ts
/**
 * 이미지 메타데이터 추출 (width, height)
 */
private static async extractImageMetadata(file: File): Promise<{
  width: number | null;
  height: number | null;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: null, height: null });
    };

    img.src = objectUrl;
  });
}
```

---

## 6. 에러 처리

### 6.1 에러 코드

| 에러 코드 | 상태 코드 | 설명 |
|-----------|-----------|------|
| `IMAGE_NOT_FOUND` | 404 | 이미지를 찾을 수 없음 |
| `IMAGE_FETCH_FAILED` | 500 | 이미지 조회 실패 |
| `IMAGE_SAVE_FAILED` | 500 | 이미지 저장 실패 |
| `IMAGE_DELETE_FAILED` | 500 | 이미지 삭제 실패 |
| `INVALID_FILE_TYPE` | 400 | 허용되지 않은 파일 형식 |
| `FILE_TOO_LARGE` | 400 | 파일 크기 초과 |
| `INVALID_FILE_EXTENSION` | 400 | 허용되지 않은 파일 확장자 |

### 6.2 사용 예시

```ts
if (!image) {
  throw new ApiError('이미지를 찾을 수 없습니다', 404, 'IMAGE_NOT_FOUND');
}

if (file.size > maxSize) {
  throw new ApiError('파일 크기는 5MB를 초과할 수 없습니다', 400, 'FILE_TOO_LARGE');
}
```

---

## 7. R2 연동

### 7.1 R2 업로드

```ts
// lib/server/utils/r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  file: File,
  key: string
): Promise<{ publicUrl: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { publicUrl };
}
```

### 7.2 R2 삭제

```ts
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );
}
```

---

## 8. 참고 문서

- Server Service 패턴: `/specs/api/server/services/index.md`
- API Routes: `/specs/api/server/routes/images/index.md`
- Client Services: `/specs/api/client/services/images/index.md`
- Database Types: `/types/database.ts`
- [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)
