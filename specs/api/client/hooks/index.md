# React Query Hooks

이 문서는 **React Query Hooks 패턴**을 정의한다.

> **범위**: React Query를 사용한 데이터 fetching hooks 패턴
> **관련 문서**:
> - Client Services Layer: `/specs/api/client/services/index.md`
> - Server Service Layer: `/specs/api/server/services/index.md`

---

## 1. 개요

### 1-1. React Query Hook이란?

**React Query Hook**은 Client Services를 감싸서 **데이터 fetching 상태**를 관리하는 레이어입니다.

**위치**: `/lib/client/hooks/`
**사용 대상**: React Component에서만
**역할**: 데이터 fetching, 캐싱, 상태 관리

### 1-2. 데이터 흐름에서의 위치

```
React Component
       ↓
React Query Hook (useProducts) ⭐ 이 문서
       ↓
Client Services (ProductsAPI.getProducts)
       ↓
fetch('/api/products')
```

---

## 2. 디렉토리 구조

```
/lib
  /client
    /hooks
      useProducts.ts
      useProduct.ts
      useOrders.ts
      useOrder.ts
      useAuth.ts
      useProfile.ts
```

---

## 3. 네이밍 규칙

### 3-1. 파일명

**패턴**: `use{Resource}.ts`

```
useProducts.ts       # 목록 조회
useProduct.ts        # 단일 조회
useCreateProduct.ts  # 생성 (Mutation)
```

### 3-2. Hook 함수명

**패턴**: `use{Resource}` 또는 `use{Action}{Resource}`

| Hook | 설명 |
|------|------|
| `useProducts()` | 상품 목록 조회 |
| `useProduct(id)` | 상품 단일 조회 |
| `useCreateProduct()` | 상품 생성 |
| `useUpdateProduct()` | 상품 수정 |
| `useDeleteProduct()` | 상품 삭제 |

---

## 4. QueryKey 구조

### 4-1. QueryKey 패턴

일관된 QueryKey 구조를 유지합니다:

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (page: number, limit: number) =>
      [...queryKeys.orders.lists(), { page, limit }] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },
} as const;
```

### 4-2. QueryKey 사용 예시

```ts
// 상품 목록
queryKey: queryKeys.products.list({ type: 'VOICE_PACK', page: 1 })
// → ['products', 'list', { type: 'VOICE_PACK', page: 1 }]

// 상품 상세
queryKey: queryKeys.products.detail('product-id')
// → ['products', 'detail', 'product-id']
```

---

## 5. useQuery 패턴

### 5-1. 기본 구조

```ts
// lib/client/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductsAPI, type GetProductsParams } from '@/lib/client/services/products.api';
import { queryKeys } from './query-keys';

export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params || {}),
    queryFn: () => ProductsAPI.getProducts(params),
    staleTime: 1000 * 60 * 5, // 5분
  });
}
```

### 5-2. 단일 조회

```ts
// lib/client/hooks/useProduct.ts
import { useQuery } from '@tanstack/react-query';
import { ProductsAPI } from '@/lib/client/services/products.api';
import { queryKeys } from './query-keys';

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => ProductsAPI.getProduct(id),
    enabled: !!id, // id가 있을 때만 실행
    staleTime: 1000 * 60 * 10, // 10분
  });
}
```

### 5-3. 파라미터가 있는 목록 조회

```ts
// lib/client/hooks/useProducts.ts
export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params || {}),
    queryFn: () => ProductsAPI.getProducts(params),
    keepPreviousData: true, // 페이지네이션 시 이전 데이터 유지
    staleTime: 1000 * 60 * 5,
  });
}

// 사용 예시
const { data, isLoading } = useProducts({
  page: 1,
  type: 'VOICE_PACK'
});
```

---

## 6. useMutation 패턴

### 6-1. 기본 Mutation

```ts
// lib/client/hooks/useCreateProduct.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsAPI } from '@/lib/client/services/products.api';
import { queryKeys } from './query-keys';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductsAPI.createProduct,
    onSuccess: () => {
      // 상품 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists()
      });
    },
  });
}

// 사용 예시
const createProduct = useCreateProduct();

const handleSubmit = async (data) => {
  try {
    await createProduct.mutateAsync(data);
    toast.success('상품이 생성되었습니다');
  } catch (error) {
    toast.error('상품 생성 실패');
  }
};
```

### 6-2. Update Mutation

```ts
// lib/client/hooks/useUpdateProduct.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsAPI } from '@/lib/client/services/products.api';
import { queryKeys } from './query-keys';

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      ProductsAPI.updateProduct(id, data),
    onSuccess: (_, variables) => {
      // 해당 상품 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(variables.id)
      });
      // 상품 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists()
      });
    },
  });
}
```

### 6-3. Delete Mutation

```ts
// lib/client/hooks/useDeleteProduct.ts
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductsAPI.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all
      });
    },
  });
}
```

---

## 7. 실전 예시

### 7-1. 주문 생성 Hook

```ts
// lib/client/hooks/useCreateOrder.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrdersAPI, type CreateOrderData } from '@/lib/client/services/orders.api';
import { queryKeys } from './query-keys';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => OrdersAPI.createOrder(data),
    onSuccess: () => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists()
      });
    },
  });
}
```

### 7-2. Component에서 사용

```tsx
// components/ProductDetail.tsx
import { useProduct } from '@/lib/client/hooks/useProduct';
import { useCreateOrder } from '@/lib/client/hooks/useCreateOrder';

export function ProductDetail({ productId }: { productId: string }) {
  const { data: productData, isLoading, error } = useProduct(productId);
  const createOrder = useCreateOrder();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!productData?.data) return <NotFound />;

  const product = productData.data;

  const handlePurchase = async () => {
    try {
      await createOrder.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      toast.success('주문이 완료되었습니다');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    }
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.price}원</p>
      <button
        onClick={handlePurchase}
        disabled={createOrder.isLoading}
      >
        {createOrder.isLoading ? '처리 중...' : '구매하기'}
      </button>
    </div>
  );
}
```

### 7-3. 페이지네이션

```tsx
// components/ProductList.tsx
import { useProducts } from '@/lib/client/hooks/useProducts';
import { useState } from 'react';

export function ProductList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPreviousData } = useProducts({
    page,
    limit: 12
  });

  if (isLoading) return <Loading />;

  const products = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
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

---

## 8. Optimistic Updates

### 8-1. 낙관적 업데이트 패턴

```ts
// lib/client/hooks/useUpdateOrderStatus.ts
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      OrdersAPI.updateOrderStatus(orderId, status),

    // Optimistic update
    onMutate: async ({ orderId, status }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({
        queryKey: queryKeys.orders.detail(orderId)
      });

      // 현재 데이터 백업
      const previousOrder = queryClient.getQueryData(
        queryKeys.orders.detail(orderId)
      );

      // 낙관적으로 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.orders.detail(orderId),
        (old: any) => ({
          ...old,
          data: { ...old.data, status },
        })
      );

      return { previousOrder };
    },

    // 에러 시 롤백
    onError: (err, variables, context) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(variables.orderId),
          context.previousOrder
        );
      }
    },

    // 성공 시 서버 데이터로 갱신
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.orderId)
      });
    },
  });
}
```

---

## 9. 에러 처리

### 9-1. Hook 레벨에서 에러 처리

```ts
// lib/client/hooks/useProducts.ts
import { ApiError } from '@/lib/client/utils/api-error';

export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params || {}),
    queryFn: () => ProductsAPI.getProducts(params),
    onError: (error) => {
      if (error instanceof ApiError) {
        console.error('API Error:', error.message, error.errorCode);
      }
    },
  });
}
```

### 9-2. Component 레벨에서 에러 처리

```tsx
const { data, error, isError } = useProducts();

if (isError) {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      return <NotFound />;
    }
    return <Error message={error.message} />;
  }
  return <Error message="알 수 없는 오류가 발생했습니다" />;
}
```

---

## 10. 체크리스트

새 React Query Hook 작성 시 확인:

- [ ] `/lib/client/hooks/` 경로에 생성
- [ ] queryKeys 객체에 key 정의
- [ ] Client Services 함수 사용
- [ ] staleTime 설정 (적절한 캐시 시간)
- [ ] Mutation 시 캐시 무효화 (invalidateQueries)
- [ ] 에러 타입 처리 (ApiError)
- [ ] TypeScript 타입 정의

---

## 11. QueryClient 설정

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1분
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## 12. 참고 문서

- `/specs/api/client/services/index.md` - Client Services 패턴
- `/specs/api/server/services/index.md` - Server Service
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
