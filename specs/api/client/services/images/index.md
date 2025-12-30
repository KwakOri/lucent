# Images Client Services

이 문서는 **이미지(Images) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 이미지 API를 호출하는 Client Services Layer
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/images/index.md`
> - API Routes: `/specs/api/server/routes/images/index.md`

---

## 1. 개요

**ImagesAPI**는 프론트엔드에서 이미지 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/images.api.ts`
**사용 대상**: React Query Hook에서만 호출 (주로 관리자 기능)
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 Image 타입

```ts
// lib/client/services/images.api.ts
export interface Image {
  id: string;
  r2_key: string;
  r2_bucket: string;
  public_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  image_type: string;
  alt_text: string | null;
  cdn_url: string | null;
  thumbnail_url: string | null;
  uploaded_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### 2.2 쿼리 파라미터 타입

```ts
export interface GetImagesParams {
  page?: number;
  limit?: number;
  imageType?: string;
}
```

### 2.3 업로드 입력 타입

```ts
export interface UploadImageInput {
  file: File;
  image_type: string;
  alt_text?: string;
}
```

---

## 3. ImagesAPI 구현

### 3.1 기본 구조

```ts
// lib/client/services/images.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export const ImagesAPI = {
  /**
   * 이미지 목록 조회 (관리자)
   */
  async getImages(params?: GetImagesParams): Promise<PaginatedResponse<Image>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.imageType) searchParams.set('image_type', params.imageType);

    return apiClient.get(`/api/images?${searchParams}`);
  },

  /**
   * 이미지 단일 조회
   */
  async getImage(id: string): Promise<ApiResponse<Image>> {
    return apiClient.get(`/api/images/${id}`);
  },

  /**
   * 이미지 업로드 (관리자)
   */
  async uploadImage(input: UploadImageInput): Promise<ApiResponse<Image>> {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('image_type', input.image_type);
    if (input.alt_text) {
      formData.append('alt_text', input.alt_text);
    }

    return apiClient.post('/api/images/upload', formData);
  },

  /**
   * 이미지 삭제 (관리자)
   */
  async deleteImage(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/images/${id}`);
  },
};
```

---

## 4. 사용 예시

### 4.1 이미지 목록 조회 (관리자)

```ts
import { ImagesAPI } from '@/lib/client/services/images.api';

// 이미지 목록
const response = await ImagesAPI.getImages({
  page: 1,
  limit: 20,
  imageType: 'product_main',
});

console.log(response.data); // Image[]
console.log(response.pagination); // { total, page, limit, totalPages }
```

### 4.2 이미지 업로드 (관리자)

```ts
// 파일 선택 시
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const response = await ImagesAPI.uploadImage({
      file,
      image_type: 'product_main',
      alt_text: '상품 메인 이미지',
    });

    console.log('업로드 성공:', response.data);
  } catch (error) {
    console.error('업로드 실패:', error);
  }
};
```

### 4.3 이미지 삭제 (관리자)

```ts
const handleDelete = async (imageId: string) => {
  try {
    await ImagesAPI.deleteImage(imageId);
    alert('이미지가 삭제되었습니다.');
  } catch (error) {
    console.error('삭제 실패:', error);
  }
};
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
  await ImagesAPI.uploadImage({ file, image_type: 'product_main' });
} catch (error) {
  if (error instanceof ApiError) {
    if (error.errorCode === 'FILE_TOO_LARGE') {
      alert('파일 크기는 5MB를 초과할 수 없습니다.');
    } else if (error.errorCode === 'INVALID_FILE_TYPE') {
      alert('허용되지 않은 파일 형식입니다. (jpeg, png, webp만 가능)');
    } else {
      alert(error.message);
    }
  }
}
```

---

## 6. FormData 사용

### 6.1 multipart/form-data 업로드

이미지 업로드는 `FormData`를 사용합니다:

```ts
const formData = new FormData();
formData.append('file', file);
formData.append('image_type', 'product_main');
formData.append('alt_text', '상품 이미지');

// apiClient는 FormData를 자동 인식
await apiClient.post('/api/images/upload', formData);
```

### 6.2 파일 검증 (클라이언트)

서버 검증 전에 클라이언트에서 먼저 검증:

```ts
function validateImageFile(file: File): string | null {
  // 1. 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return '허용되지 않은 파일 형식입니다. (jpeg, png, webp만 가능)';
  }

  // 2. 파일 크기 검증 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return '파일 크기는 5MB를 초과할 수 없습니다.';
  }

  return null; // 검증 통과
}
```

---

## 7. 응답 형식

### 7.1 목록 응답

```ts
{
  status: 'success',
  data: Image[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### 7.2 업로드 응답

```ts
{
  status: 'success',
  data: {
    id: string,
    public_url: string,
    file_name: string,
    width: number,
    height: number,
    // ...
  }
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
const input: UploadImageInput = {
  file: new File([''], 'image.png'),
  image_type: 'product_main',
  alt_text: '상품 이미지',
};

// ❌ 컴파일 에러
const invalid: UploadImageInput = {
  file: 'not a file', // Type error!
  image_type: 'product_main',
};
```

### 8.2 응답 타입 추론

```ts
const response = await ImagesAPI.uploadImage(input);
// response.data는 Image 타입

const images = await ImagesAPI.getImages();
// images.data는 Image[] 타입
```

---

## 9. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/images/index.md`
- API Routes: `/specs/api/server/routes/images/index.md`
- API 공통 타입: `/lib/shared/types/api.types.ts`
