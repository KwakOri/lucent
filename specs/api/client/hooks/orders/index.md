# Orders React Query Hooks

이 문서는 **주문(Orders) React Query Hooks** 구현을 정의한다.

> **범위**: 주문 데이터 fetching 및 상태 관리 Hooks
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/orders/index.md`
> - API Routes: `/specs/api/server/routes/orders/index.md`

---

## 1. 개요

주문 관련 React Query Hooks는 주문 데이터의 **fetching, caching, 상태 관리**를 담당합니다.

**위치**: `/lib/client/hooks/`
**사용 대상**: React Component에서만
**역할**: 데이터 fetching, 캐싱, 상태 관리

---

## 2. QueryKey 구조

### 2.1 QueryKey 정의

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
} as const;
```

### 2.2 QueryKey 사용 예시

```ts
// 주문 목록 (필터 포함)
queryKeys.orders.list({ status: 'PAID', page: 1 })
// → ['orders', 'list', { status: 'PAID', page: 1 }]

// 주문 상세
queryKeys.orders.detail('order-uuid')
// → ['orders', 'detail', 'order-uuid']

// 모든 주문 목록 무효화
queryKeys.orders.lists()
// → ['orders', 'list']
```

---

## 3. Query Hooks

### 3.1 useOrders (주문 목록)

```ts
// lib/client/hooks/useOrders.ts
import { useQuery } from '@tanstack/react-query';
import { OrdersAPI, type GetOrdersParams } from '@/lib/client/services/orders.api';
import { queryKeys } from './query-keys';

export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params || {}),
    queryFn: () => OrdersAPI.getMyOrders(params),
    keepPreviousData: true,
    staleTime: 1000 * 60, // 1분
  });
}
```

**사용 예시**:

```tsx
function MyOrders() {
  const [status, setStatus] = useState<OrderStatus | undefined>();

  const { data, isLoading, error } = useOrders({ status, page: 1, limit: 10 });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <FilterTabs value={status} onChange={setStatus} />

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {pagination && (
        <Pagination
          current={pagination.page}
          total={pagination.totalPages}
          onChange={(page) => {/* handle page change */}}
        />
      )}
    </div>
  );
}
```

### 3.2 useOrder (주문 상세)

```ts
// lib/client/hooks/useOrder.ts
import { useQuery } from '@tanstack/react-query';
import { OrdersAPI } from '@/lib/client/services/orders.api';
import { queryKeys } from './query-keys';

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => OrdersAPI.getOrder(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}
```

**사용 예시**:

```tsx
function OrderDetail({ orderId }: { orderId: string }) {
  const { data: orderData, isLoading, error } = useOrder(orderId);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!orderData?.data) return <NotFound />;

  const order = orderData.data;

  return (
    <div>
      <h1>주문 #{order.order_number}</h1>
      <OrderStatus status={order.status} />

      {order.status === 'PENDING' && order.payment_info && (
        <PaymentInfo info={order.payment_info} />
      )}

      <OrderItemList items={order.items} />

      {order.shipping_address && (
        <ShippingInfo
          name={order.shipping_name}
          phone={order.shipping_phone}
          address={order.shipping_address}
          memo={order.shipping_memo}
        />
      )}
    </div>
  );
}
```

---

## 4. Mutation Hooks

### 4.1 useCreateOrder (주문 생성)

```ts
// lib/client/hooks/useCreateOrder.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrdersAPI, type CreateOrderInput } from '@/lib/client/services/orders.api';
import { queryKeys } from './query-keys';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => OrdersAPI.createOrder(data),
    onSuccess: () => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(),
      });
    },
  });
}
```

**사용 예시**:

```tsx
function CheckoutButton({ productId, quantity }: { productId: string; quantity: number }) {
  const createOrder = useCreateOrder();
  const router = useRouter();

  const handleCheckout = async () => {
    try {
      const order = await createOrder.mutateAsync({
        items: [{ product_id: productId, quantity }],
      });

      toast.success('주문이 생성되었습니다');
      router.push(`/mypage/orders/${order.data.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === 'OUT_OF_STOCK') {
          toast.error('재고가 부족합니다');
        } else {
          toast.error(error.message);
        }
      }
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={createOrder.isLoading}
    >
      {createOrder.isLoading ? '처리 중...' : '주문하기'}
    </button>
  );
}
```

### 4.2 useDownloadDigitalProduct (다운로드)

```ts
// lib/client/hooks/useDownloadDigitalProduct.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OrdersAPI } from '@/lib/client/services/orders.api';
import { queryKeys } from './query-keys';

export function useDownloadDigitalProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      OrdersAPI.getDownloadUrl(orderId, itemId),
    onSuccess: (data, variables) => {
      // 다운로드 카운트 증가를 반영하기 위해 주문 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(variables.orderId),
      });

      // 다운로드 링크로 리다이렉트
      window.open(data.data.download_url, '_blank');
    },
  });
}
```

**사용 예시**:

```tsx
function DownloadButton({ orderId, itemId }: { orderId: string; itemId: string }) {
  const downloadProduct = useDownloadDigitalProduct();

  const handleDownload = () => {
    downloadProduct.mutate({ orderId, itemId });
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloadProduct.isLoading}
    >
      {downloadProduct.isLoading ? '다운로드 준비 중...' : '다운로드'}
    </button>
  );
}
```

---

## 5. 실전 예시

### 5.1 주문 목록 + 상태 필터

```tsx
function MyOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | undefined>();

  const { data, isLoading, isPreviousData } = useOrders({
    page,
    limit: 10,
    status,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setStatus(undefined)}
          className={!status ? 'active' : ''}
        >
          전체
        </button>
        <button
          onClick={() => setStatus('PENDING')}
          className={status === 'PENDING' ? 'active' : ''}
        >
          입금 대기
        </button>
        <button
          onClick={() => setStatus('PAID')}
          className={status === 'PAID' ? 'active' : ''}
        >
          입금 완료
        </button>
      </div>

      {isLoading && <Loading />}

      <div className={isPreviousData ? 'opacity-50' : ''}>
        {orders.length === 0 ? (
          <EmptyState message="주문 내역이 없습니다" />
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
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

### 5.2 주문 상세 + 다운로드

```tsx
function OrderDetailPage({ orderId }: { orderId: string }) {
  const { data, isLoading } = useOrder(orderId);
  const downloadProduct = useDownloadDigitalProduct();

  if (isLoading) return <Loading />;

  const order = data?.data;
  if (!order) return <NotFound />;

  return (
    <div>
      <h1>주문 번호: {order.order_number}</h1>
      <p>상태: {ORDER_STATUS_LABELS[order.status]}</p>
      <p>총 금액: {order.total_price.toLocaleString()}원</p>

      {order.status === 'PENDING' && order.payment_info && (
        <div className="bg-yellow-50 p-4 rounded">
          <h2>입금 안내</h2>
          <p>은행: {order.payment_info.bank}</p>
          <p>계좌번호: {order.payment_info.account_number}</p>
          <p>예금주: {order.payment_info.account_holder}</p>
          <p>입금액: {order.payment_info.amount.toLocaleString()}원</p>
          <p>입금 기한: {new Date(order.payment_info.deadline).toLocaleDateString()}</p>
        </div>
      )}

      <div className="mt-6">
        <h2>주문 상품</h2>
        {order.items?.map((item) => (
          <div key={item.id} className="border p-4 rounded">
            <p>{item.product_name}</p>
            <p>{item.price_snapshot.toLocaleString()}원 × {item.quantity}개</p>

            {item.product_type === 'VOICE_PACK' && item.download_available && (
              <button
                onClick={() => downloadProduct.mutate({ orderId: order.id, itemId: item.id })}
                disabled={downloadProduct.isLoading}
                className="btn btn-primary mt-2"
              >
                {downloadProduct.isLoading ? '준비 중...' : '다운로드'}
                {item.download_count > 0 && ` (${item.download_count}회)`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 간편 주문 (1-Click)

```tsx
function QuickBuyButton({ productId }: { productId: string }) {
  const createOrder = useCreateOrder();
  const router = useRouter();

  const handleQuickBuy = async () => {
    try {
      const order = await createOrder.mutateAsync({
        items: [{ product_id: productId, quantity: 1 }],
      });

      toast.success('주문이 완료되었습니다');
      router.push(`/mypage/orders/${order.data.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    }
  };

  return (
    <button
      onClick={handleQuickBuy}
      disabled={createOrder.isLoading}
      className="btn btn-lg btn-primary"
    >
      {createOrder.isLoading ? '주문 중...' : '바로 구매'}
    </button>
  );
}
```

---

## 6. 에러 처리

### 6.1 Hook 레벨 에러 처리

```ts
export function useOrders(params?: GetOrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params || {}),
    queryFn: () => OrdersAPI.getMyOrders(params),
    onError: (error) => {
      if (error instanceof ApiError) {
        console.error('Orders fetch error:', error.message);
        if (error.statusCode === 401) {
          // 로그인 페이지로 리다이렉트
        }
      }
    },
  });
}
```

### 6.2 Component 레벨 에러 처리

```tsx
function MyOrders() {
  const { data, error, isError } = useOrders();

  if (isError) {
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        return <RedirectToLogin />;
      }
      return <Error message={error.message} />;
    }
    return <Error message="알 수 없는 오류가 발생했습니다" />;
  }

  return <OrderList orders={data?.data || []} />;
}
```

---

## 7. 캐시 관리

### 7.1 Cache Invalidation

주문 생성 후 목록 캐시 무효화:

```ts
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: OrdersAPI.createOrder,
    onSuccess: () => {
      // 모든 주문 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.lists(),
      });
    },
  });
}
```

### 7.2 Optimistic Update

주문 상태 표시를 즉시 업데이트:

```ts
export function useDownloadDigitalProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, itemId }) =>
      OrdersAPI.getDownloadUrl(orderId, itemId),
    onMutate: async ({ orderId, itemId }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({
        queryKey: queryKeys.orders.detail(orderId),
      });

      // 현재 데이터 백업
      const previousOrder = queryClient.getQueryData(
        queryKeys.orders.detail(orderId)
      );

      // 낙관적으로 download_count 증가
      queryClient.setQueryData(
        queryKeys.orders.detail(orderId),
        (old: any) => ({
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((item: any) =>
              item.id === itemId
                ? { ...item, download_count: item.download_count + 1 }
                : item
            ),
          },
        })
      );

      return { previousOrder };
    },
    onError: (err, variables, context) => {
      // 에러 시 롤백
      if (context?.previousOrder) {
        queryClient.setQueryData(
          queryKeys.orders.detail(variables.orderId),
          context.previousOrder
        );
      }
    },
  });
}
```

---

## 8. 성능 최적화

### 8.1 staleTime 설정

```ts
// 주문 목록: 1분
staleTime: 1000 * 60

// 주문 상세: 5분
staleTime: 1000 * 60 * 5
```

### 8.2 keepPreviousData

페이지네이션 시 이전 데이터 유지:

```ts
useQuery({
  queryKey: queryKeys.orders.list(params),
  queryFn: () => OrdersAPI.getMyOrders(params),
  keepPreviousData: true, // 페이지 전환 시 깜빡임 방지
});
```

---

## 9. 주문 상태 헬퍼

```ts
// lib/client/utils/order-status.ts
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '입금 대기',
  PAID: '입금 완료',
  MAKING: '제작 중',
  SHIPPING: '배송 중',
  DONE: '완료',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'yellow',
  PAID: 'blue',
  MAKING: 'purple',
  SHIPPING: 'indigo',
  DONE: 'green',
};

export function canDownload(order: Order, item: OrderItem): boolean {
  return (
    item.product_type === 'VOICE_PACK' &&
    (order.status === 'PAID' || order.status === 'DONE')
  );
}
```

---

## 10. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/orders/index.md`
- API Routes: `/specs/api/server/routes/orders/index.md`
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
