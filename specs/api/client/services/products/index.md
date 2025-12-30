# Products Client Services

이 문서는 **상품(Products) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 상품 API를 호출하는 Client Services Layer
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/products/index.md`
> - API Routes: `/specs/api/server/routes/products/index.md`

---

## 1. 개요

**ProductsAPI**는 프론트엔드에서 상품 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/products.api.ts`
**사용 대상**: React Query Hook에서만 호출
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 Product 타입

```ts
// lib/client/services/products.api.ts
export interface Product {
  id: string;
  artist_id: string;
  name: string;
  slug: string;
  type: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  price: number;
  description: string;

  main_image: {
    id: string;
    public_url: string;
    cdn_url?: string;
    thumbnail_url?: string;
    alt_text?: string;
    width?: number;
    height?: number;
  } | null;

  gallery_images?: {
    id: string;
    public_url: string;
    cdn_url?: string;
    alt_text?: string;
    display_order: number;
  }[];

  sample_audio_url?: string;
  digital_file_url?: string;
  stock: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  artist?: {
    id: string;
    name: string;
    slug: string;
    profile_image: {
      public_url: string;
      cdn_url?: string;
    } | null;
  };
}
```

### 2.2 쿼리 파라미터 타입

```ts
export interface GetProductsParams {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'price' | 'name';
  order?: 'asc' | 'desc';
  type?: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  artistSlug?: string;
  projectSlug?: string;
  inStock?: boolean;
}
```

### 2.3 응답 타입

```ts
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

// 목록 응답
type ProductListResponse = PaginatedResponse<Product>;

// 상세 응답
type ProductDetailResponse = ApiResponse<Product>;
```

---

## 3. ProductsAPI 구현

### 3.1 기본 구조

```ts
// lib/client/services/products.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export const ProductsAPI = {
  /**
   * 상품 목록 조회
   */
  async getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.type) searchParams.set('filter[type]', params.type);
    if (params?.artistSlug) searchParams.set('filter[artist]', params.artistSlug);
    if (params?.projectSlug) searchParams.set('filter[project]', params.projectSlug);
    if (params?.inStock !== undefined) {
      searchParams.set('filter[in_stock]', String(params.inStock));
    }

    return apiClient.get(`/api/products?${searchParams}`);
  },

  /**
   * 상품 단일 조회 (ID)
   */
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get(`/api/products/${id}`);
  },

  /**
   * 상품 단일 조회 (아티스트 slug + 상품 slug)
   */
  async getProductBySlug(
    artistSlug: string,
    productSlug: string
  ): Promise<ApiResponse<Product>> {
    return apiClient.get(`/api/artists/${artistSlug}/products/${productSlug}`);
  },

  /**
   * 아티스트별 상품 목록
   */
  async getProductsByArtist(
    artistSlug: string,
    params?: Omit<GetProductsParams, 'artistSlug'>
  ): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.type) searchParams.set('filter[type]', params.type);
    if (params?.inStock !== undefined) {
      searchParams.set('filter[in_stock]', String(params.inStock));
    }

    return apiClient.get(`/api/artists/${artistSlug}/products?${searchParams}`);
  },

  /**
   * 보이스팩 샘플 URL 가져오기
   */
  getSampleUrl(productId: string): string {
    return `/api/products/${productId}/sample`;
  },
};
```

---

## 4. 사용 예시

### 4.1 상품 목록 조회

```ts
import { ProductsAPI } from '@/lib/client/services/products.api';

// 기본 목록
const response = await ProductsAPI.getProducts();
console.log(response.data); // Product[]
console.log(response.pagination); // { total, page, limit, totalPages }

// 필터링 + 페이지네이션
const filtered = await ProductsAPI.getProducts({
  page: 1,
  limit: 12,
  type: 'VOICE_PACK',
  artistSlug: 'miruru',
  sortBy: 'created_at',
  order: 'desc',
});
```

### 4.2 상품 상세 조회

```ts
// ID로 조회
const product = await ProductsAPI.getProduct('product-uuid');
console.log(product.data); // Product

// Slug로 조회
const productBySlug = await ProductsAPI.getProductBySlug('miruru', 'voicepack-vol1');
console.log(productBySlug.data); // Product
```

### 4.3 아티스트별 상품 목록

```ts
const miruruProducts = await ProductsAPI.getProductsByArtist('miruru', {
  page: 1,
  limit: 12,
  type: 'VOICE_PACK',
});
```

### 4.4 샘플 오디오 재생

```tsx
// React 컴포넌트에서
function ProductSample({ productId }: { productId: string }) {
  const sampleUrl = ProductsAPI.getSampleUrl(productId);

  return (
    <audio controls src={sampleUrl}>
      Your browser does not support the audio element.
    </audio>
  );
}
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
  const product = await ProductsAPI.getProduct('invalid-id');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      console.error('상품을 찾을 수 없습니다');
    } else if (error.errorCode === 'PRODUCT_FETCH_FAILED') {
      console.error('상품 조회 실패');
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
if (params?.type) searchParams.set('filter[type]', params.type);
if (params?.artistSlug) searchParams.set('filter[artist]', params.artistSlug);

// Boolean 파라미터
if (params?.inStock !== undefined) {
  searchParams.set('filter[in_stock]', String(params.inStock));
}

const url = `/api/products?${searchParams}`;
// → /api/products?page=1&limit=12&filter[type]=VOICE_PACK&filter[artist]=miruru
```

---

## 7. 응답 형식

### 7.1 목록 응답

```ts
{
  status: 'success',
  data: Product[],
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
  data: Product
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
const params: GetProductsParams = {
  page: 1,
  type: 'VOICE_PACK', // 자동완성 지원
};

// ❌ 컴파일 에러
const invalid: GetProductsParams = {
  page: 1,
  type: 'INVALID_TYPE', // Type error!
};
```

### 8.2 응답 타입 추론

```ts
const response = await ProductsAPI.getProducts();
// response.data는 Product[] 타입
// response.pagination은 PaginationMeta 타입

const product = await ProductsAPI.getProduct('id');
// product.data는 Product 타입
```

---

## 9. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/products/index.md`
- API Routes: `/specs/api/server/routes/products/index.md`
- API 공통 타입: `/lib/shared/types/api.types.ts`
