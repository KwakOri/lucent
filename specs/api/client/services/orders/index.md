# Orders Client Services

이 문서는 **주문(Orders) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 주문 API를 호출하는 Client Services Layer
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/orders/index.md`
> - API Routes: `/specs/api/server/routes/orders/index.md`

---

## 1. 개요

**OrdersAPI**는 프론트엔드에서 주문 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/orders.api.ts`
**사용 대상**: React Query Hook에서만 호출
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 Order 타입

```ts
// lib/client/services/orders.api.ts
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

  admin_memo: string | null;

  created_at: string;
  updated_at: string;

  orderer?: {
    name: string;
    email: string;
    phone: string;
  };
  items?: OrderItem[];
}
```

### 2.2 OrderItem 타입

```ts
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_type: 'VOICE_PACK' | 'PHYSICAL_GOODS';
  price_snapshot: number;
  quantity: number;
  download_count: number;
  download_available?: boolean;
  created_at: string;

  product?: {
    id: string;
    name: string;
    slug: string;
    type: 'VOICE_PACK' | 'PHYSICAL_GOODS';
    main_image: {
      public_url: string;
      thumbnail_url?: string;
    } | null;
  };
}
```

### 2.3 입력 타입

```ts
export interface CreateOrderInput {
  items: {
    product_id: string;
    quantity: number;
  }[];
  shipping?: {
    name?: string;
    phone?: string;
    address?: string;
    memo?: string;
  };
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'PAID' | 'MAKING' | 'SHIPPING' | 'DONE';
}
```

### 2.4 응답 타입

```ts
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export interface PaymentInfo {
  bank: string;
  account_number: string;
  account_holder: string;
  amount: number;
  deadline: string;
}

export interface CreateOrderResponse extends ApiResponse<Order> {
  data: Order & {
    payment_info: PaymentInfo;
  };
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_at: string;
  file_name: string;
  file_size: number;
}
```

---

## 3. OrdersAPI 구현

### 3.1 기본 구조

```ts
// lib/client/services/orders.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export const OrdersAPI = {
  /**
   * 주문 생성
   */
  async createOrder(data: CreateOrderInput): Promise<CreateOrderResponse> {
    return apiClient.post('/api/orders', data);
  },

  /**
   * 내 주문 목록
   */
  async getMyOrders(params?: GetOrdersParams): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    return apiClient.get(`/api/orders?${searchParams}`);
  },

  /**
   * 주문 상세
   */
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.get(`/api/orders/${orderId}`);
  },

  /**
   * 디지털 상품 다운로드 URL 가져오기
   */
  async getDownloadUrl(
    orderId: string,
    itemId: string
  ): Promise<ApiResponse<DownloadUrlResponse>> {
    return apiClient.get(`/api/orders/${orderId}/items/${itemId}/download`);
  },

  /**
   * 디지털 상품 다운로드 (리다이렉트)
   */
  getDownloadLink(orderId: string, itemId: string): string {
    return `/api/orders/${orderId}/items/${itemId}/download`;
  },
};
```

---

## 4. 사용 예시

### 4.1 주문 생성

```ts
import { OrdersAPI } from '@/lib/client/services/orders.api';

// 기본 주문 (프로필 정보 사용)
const order = await OrdersAPI.createOrder({
  items: [
    {
      product_id: 'product-uuid',
      quantity: 1,
    },
  ],
});

console.log(order.data.order_number); // ORD-20250115-0001
console.log(order.data.payment_info); // 계좌 정보
```

### 4.2 배송 정보 포함 주문

```ts
const order = await OrdersAPI.createOrder({
  items: [
    {
      product_id: 'product-uuid',
      quantity: 2,
    },
  ],
  shipping: {
    name: '홍길동',
    phone: '010-1234-5678',
    address: '서울시 강남구 테헤란로 123',
    memo: '문 앞에 놓아주세요',
  },
});
```

### 4.3 주문 목록 조회

```ts
// 전체 주문 목록
const orders = await OrdersAPI.getMyOrders();
console.log(orders.data); // Order[]
console.log(orders.pagination); // { total, page, limit, totalPages }

// 특정 상태 필터링
const paidOrders = await OrdersAPI.getMyOrders({
  status: 'PAID',
  page: 1,
  limit: 10,
});
```

### 4.4 주문 상세 조회

```ts
const order = await OrdersAPI.getOrder('order-uuid');
console.log(order.data); // Order with items and orderer
```

### 4.5 디지털 상품 다운로드

```tsx
// 방법 1: URL 가져오기 (JSON)
const downloadData = await OrdersAPI.getDownloadUrl('order-uuid', 'item-uuid');
console.log(downloadData.data.download_url); // Presigned URL
console.log(downloadData.data.expires_at); // 만료 시간

// 방법 2: 직접 링크 (리다이렉트)
const downloadLink = OrdersAPI.getDownloadLink('order-uuid', 'item-uuid');

// React 컴포넌트에서 사용
function DownloadButton({ orderId, itemId }: { orderId: string; itemId: string }) {
  return (
    <a
      href={OrdersAPI.getDownloadLink(orderId, itemId)}
      className="btn btn-primary"
      download
    >
      다운로드
    </a>
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
  const order = await OrdersAPI.createOrder(orderData);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.errorCode === 'OUT_OF_STOCK') {
      console.error('재고 부족:', error.details);
    } else if (error.errorCode === 'PRODUCT_NOT_FOUND') {
      console.error('상품을 찾을 수 없습니다');
    } else if (error.statusCode === 401) {
      console.error('로그인이 필요합니다');
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

// 상태 필터
if (params?.status) searchParams.set('status', params.status);

const url = `/api/orders?${searchParams}`;
// → /api/orders?page=1&limit=10&status=PAID
```

---

## 7. 응답 형식

### 7.1 주문 생성 응답

```ts
{
  status: 'success',
  data: {
    id: string,
    order_number: string,
    status: 'PENDING',
    total_price: number,
    items: OrderItem[],
    payment_info: {
      bank: string,
      account_number: string,
      account_holder: string,
      amount: number,
      deadline: string
    }
  },
  message: '주문이 생성되었습니다. 계좌로 입금해주세요.'
}
```

### 7.2 목록 응답

```ts
{
  status: 'success',
  data: Order[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### 7.3 상세 응답

```ts
{
  status: 'success',
  data: Order // with items and orderer
}
```

### 7.4 다운로드 URL 응답

```ts
{
  status: 'success',
  data: {
    download_url: string,
    expires_at: string,
    file_name: string,
    file_size: number
  }
}
```

### 7.5 에러 응답

```ts
{
  status: 'error',
  message: string,
  errorCode?: string,
  details?: object
}
```

---

## 8. 타입 안전성

### 8.1 TypeScript 타입 체크

모든 API 메서드는 타입 안전성을 보장합니다:

```ts
// ✅ 올바른 사용
const orderData: CreateOrderInput = {
  items: [{ product_id: 'uuid', quantity: 1 }],
};

// ❌ 컴파일 에러
const invalid: CreateOrderInput = {
  items: [{ product_id: 'uuid' }], // quantity 누락!
};
```

### 8.2 응답 타입 추론

```ts
const order = await OrdersAPI.createOrder(data);
// order.data는 Order & { payment_info: PaymentInfo } 타입

const orders = await OrdersAPI.getMyOrders();
// orders.data는 Order[] 타입
// orders.pagination은 PaginationMeta 타입
```

---

## 9. 주문 상태 타입

```ts
export type OrderStatus = 'PENDING' | 'PAID' | 'MAKING' | 'SHIPPING' | 'DONE';

// 상태별 레이블
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '입금 대기',
  PAID: '입금 확인',
  MAKING: '제작 중',
  SHIPPING: '발송 중',
  DONE: '완료',
};

// 상태별 컬러
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'yellow',
  PAID: 'blue',
  MAKING: 'purple',
  SHIPPING: 'indigo',
  DONE: 'green',
};
```

---

## 10. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/orders/index.md`
- API Routes: `/specs/api/server/routes/orders/index.md`
- API 공통 타입: `/lib/shared/types/api.types.ts`
