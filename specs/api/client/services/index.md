# Client Services Layer

이 문서는 **클라이언트 측 API Layer** 패턴을 정의한다.

> **범위**: 이 문서는 클라이언트 측(Frontend)에서만 사용되는 API Client만 다룹니다.
> **관련 문서**:
> - Server Service Layer: `/specs/api/server/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/index.md`

---

## 1. 개요

### 1-1. Client Services란?

**Client Services**는 **Frontend에서 API Route를 호출**하는 레이어로, HTTP 통신을 캡슐화한다.

**위치**: `/lib/client/services/`
**사용 대상**: React Query Hook에서만
**역할**: API Route 호출 (fetch), 타입 안전성 보장

### 1-2. 데이터 흐름에서의 위치

```
React Query Hook (useProducts)
       ↓
Client Services (ProductsAPI.getProducts) ⭐ 이 문서
       ↓
fetch('/api/products')
       ↓
       --- HTTP 경계 ---
       ↓
Next.js API Route
```

---

## 2. 디렉토리 구조

```
/lib
  /client
    /api
      products.api.ts
      orders.api.ts
      artists.api.ts
      projects.api.ts
      auth.api.ts
    /utils
      api-client.ts     # fetch 헬퍼
      api-error.ts      # 에러 클래스
```

---

## 3. 네이밍 규칙

### 3-1. 파일명

**패턴**: `{resource}.api.ts` (복수형 사용)

```
products.api.ts
orders.api.ts
auth.api.ts
```

### 3-2. 객체명

**패턴**: `{Resource}API` (단수형, 복수형 모두 가능)

```ts
export const ProductsAPI = { }
export const OrdersAPI = { }
export const AuthAPI = { }
```

### 3-3. 메서드명

**패턴**: 동사 + 명사

| 메서드 | HTTP | 설명 |
|--------|------|------|
| `getProducts()` | GET | 목록 조회 |
| `getProduct(id)` | GET | 단일 조회 |
| `createProduct(data)` | POST | 생성 |
| `updateProduct(id, data)` | PATCH/PUT | 수정 |
| `deleteProduct(id)` | DELETE | 삭제 |

---

## 4. 기본 구현 패턴

### 4-1. 기본 구조

```ts
// lib/client/services/products.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

// 타입 정의
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  type: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  // ...
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  type?: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  artistSlug?: string;
}

// API 객체
export const ProductsAPI = {
  /**
   * 상품 목록 조회
   */
  async getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.type) searchParams.set('type', params.type);
    if (params?.artistSlug) searchParams.set('artistSlug', params.artistSlug);

    return apiClient.get(`/api/products?${searchParams}`);
  },

  /**
   * 상품 단일 조회
   */
  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get(`/api/products/${id}`);
  },

  /**
   * 상품 생성 (관리자 전용)
   */
  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.post('/api/products', data);
  },

  /**
   * 상품 수정 (관리자 전용)
   */
  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.patch(`/api/products/${id}`, data);
  },

  /**
   * 상품 삭제 (관리자 전용)
   */
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/products/${id}`);
  },
};
```

---

## 5. API Client 유틸리티

### 5-1. fetch 헬퍼

```ts
// lib/client/utils/api-client.ts
import { ApiError } from './api-error';

class APIClient {
  private baseURL: string;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || '요청 실패',
        response.status,
        data.errorCode
      );
    }

    return data;
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
```

### 5-2. 에러 클래스

```ts
// lib/client/utils/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## 6. 공통 타입 정의

### 6-1. API 응답 타입

```ts
// lib/shared/types/api.types.ts

/**
 * 기본 API 응답
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  errorCode?: string;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## 7. 실전 예시

### 7-1. Products API

```ts
// lib/client/services/products.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export interface Product {
  id: string;
  artist_id: string;
  name: string;
  slug: string;
  type: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  price: number;
  description: string | null;
  main_image: {
    id: string;
    public_url: string;
    cdn_url?: string;
    thumbnail_url?: string;
  } | null;
  sample_audio_url?: string;
  stock: number | null;
  is_active: boolean;
  created_at: string;
  artist?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  type?: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  artistSlug?: string;
  sortBy?: 'created_at' | 'price' | 'name';
  order?: 'asc' | 'desc';
}

export const ProductsAPI = {
  async getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.type) searchParams.set('filter[type]', params.type);
    if (params?.artistSlug) searchParams.set('filter[artist]', params.artistSlug);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);

    return apiClient.get(`/api/products?${searchParams}`);
  },

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    return apiClient.get(`/api/products/${id}`);
  },

  async getProductBySlug(artistSlug: string, productSlug: string): Promise<ApiResponse<Product>> {
    return apiClient.get(`/api/artists/${artistSlug}/products/${productSlug}`);
  },
};
```

### 7-2. Orders API

```ts
// lib/client/services/orders.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'PENDING' | 'PAID' | 'MAKING' | 'SHIPPING' | 'DONE';
  total_price: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_memo: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_type: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  price_snapshot: number;
  quantity: number;
  download_url: string | null;
  download_count: number;
}

export interface CreateOrderData {
  productId: string;
  quantity: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingMemo?: string;
}

export const OrdersAPI = {
  async getMyOrders(page = 1, limit = 10): Promise<PaginatedResponse<Order>> {
    return apiClient.get(`/api/orders?page=${page}&limit=${limit}`);
  },

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    return apiClient.get(`/api/orders/${id}`);
  },

  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return apiClient.post('/api/orders', data);
  },

  async downloadDigitalProduct(orderItemId: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.post(`/api/orders/items/${orderItemId}/download`, {});
  },
};
```

### 7-3. Auth API

```ts
// lib/client/services/auth.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse } from '@/lib/shared/types/api.types';

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export const AuthAPI = {
  async login(data: LoginData): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/api/auth/login', data);
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/api/auth/logout', {});
  },

  async signUp(data: SignUpData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/auth/sign-up', data);
  },

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return apiClient.post('/api/auth/verify-email', { token });
  },

  async getSession(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/api/auth/session');
  },

  async resetPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/auth/reset-password', { email });
  },
};
```

---

## 8. 에러 처리

### 8-1. API에서 에러 던지기

```ts
// apiClient.request()에서 자동으로 ApiError 던짐
if (!response.ok) {
  throw new ApiError(
    data.message || '요청 실패',
    response.status,
    data.errorCode
  );
}
```

### 8-2. React Query Hook에서 처리

```ts
// lib/client/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductsAPI } from '@/lib/client/services/products.api';
import { ApiError } from '@/lib/client/utils/api-error';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => ProductsAPI.getProducts(),
    onError: (error) => {
      if (error instanceof ApiError) {
        // 상태 코드별 처리
        if (error.statusCode === 401) {
          // 인증 실패 → 로그인 페이지로
        } else if (error.statusCode === 404) {
          // 리소스 없음
        }
      }
    },
  });
}
```

---

## 9. 체크리스트

새 Client Services 작성 시 확인:

- [ ] `/lib/client/services/` 경로에 생성
- [ ] `apiClient` 헬퍼 사용
- [ ] 타입 정의 포함 (Request, Response)
- [ ] JSDoc 주석 작성
- [ ] 일관된 네이밍 (getXxx, createXxx, updateXxx, deleteXxx)
- [ ] Query Parameters를 URLSearchParams로 처리
- [ ] 에러는 자동으로 ApiError로 변환됨

---

## 10. 참고 문서

- `/specs/api/server/services/index.md` - Server Service 패턴
- `/specs/api/client/hooks/index.md` - React Query hooks
- `/specs/api/index.md` - API 응답 형식
- `/lib/shared/types/api.types.ts` - 공통 타입 정의
