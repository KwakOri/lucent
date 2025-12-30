# Products React Query Hooks

이 문서는 **상품(Products) React Query Hooks** 구현을 정의한다.

> **범위**: 상품 데이터 fetching 및 상태 관리 Hooks
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/products/index.md`
> - API Routes: `/specs/api/server/routes/products/index.md`

---

## 1. 개요

상품 관련 React Query Hooks는 상품 데이터의 **fetching, caching, 상태 관리**를 담당합니다.

**위치**: `/lib/client/hooks/`
**사용 대상**: React Component에서만
**역할**: 데이터 fetching, 캐싱, 상태 관리

---

## 2. QueryKey 구조

### 2.1 QueryKey 정의

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
    bySlug: (artistSlug: string, productSlug: string) =>
      [...queryKeys.products.details(), artistSlug, productSlug] as const,
  },
} as const;
```

### 2.2 QueryKey 사용 예시

```ts
// 상품 목록 (필터 포함)
queryKeys.products.list({ type: 'VOICE_PACK', page: 1 })
// → ['products', 'list', { type: 'VOICE_PACK', page: 1 }]

// 상품 상세 (ID)
queryKeys.products.detail('product-uuid')
// → ['products', 'detail', 'product-uuid']

// 상품 상세 (Slug)
queryKeys.products.bySlug('miruru', 'voicepack-vol1')
// → ['products', 'detail', 'miruru', 'voicepack-vol1']

// 모든 상품 목록 무효화
queryKeys.products.lists()
// → ['products', 'list']
```

---

## 3. Query Hooks

### 3.1 useProducts (상품 목록)

```ts
// lib/client/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductsAPI, type GetProductsParams } from '@/lib/client/services/products.api';
import { queryKeys } from './query-keys';

export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params || {}),
    queryFn: () => ProductsAPI.getProducts(params),
    keepPreviousData: true, // 페이지네이션 시 이전 데이터 유지
    staleTime: 1000 * 60 * 5, // 5분
  });
}
```

**사용 예시**:

```tsx
function ProductList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, isPreviousData } = useProducts({
    page,
    limit: 12,
    type: 'VOICE_PACK',
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const products = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
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

### 3.2 useProduct (상품 상세 - ID)

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

**사용 예시**:

```tsx
function ProductDetail({ productId }: { productId: string }) {
  const { data: productData, isLoading, error } = useProduct(productId);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!productData?.data) return <NotFound />;

  const product = productData.data;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.price}원</p>
      {product.main_image && (
        <img src={product.main_image.cdn_url || product.main_image.public_url} />
      )}
    </div>
  );
}
```

### 3.3 useProductBySlug (상품 상세 - Slug)

```ts
// lib/client/hooks/useProductBySlug.ts
import { useQuery } from '@tanstack/react-query';
import { ProductsAPI } from '@/lib/client/services/products.api';
import { queryKeys } from './query-keys';

export function useProductBySlug(artistSlug: string, productSlug: string) {
  return useQuery({
    queryKey: queryKeys.products.bySlug(artistSlug, productSlug),
    queryFn: () => ProductsAPI.getProductBySlug(artistSlug, productSlug),
    enabled: !!artistSlug && !!productSlug,
    staleTime: 1000 * 60 * 10, // 10분
  });
}
```

**사용 예시**:

```tsx
// /goods/miruru/voicepack-vol1
function ProductPage({ artistSlug, productSlug }: { artistSlug: string; productSlug: string }) {
  const { data, isLoading } = useProductBySlug(artistSlug, productSlug);

  if (isLoading) return <Loading />;

  const product = data?.data;
  if (!product) return <NotFound />;

  return <ProductDetail product={product} />;
}
```

### 3.4 useArtistProducts (아티스트별 상품 목록)

```ts
// lib/client/hooks/useArtistProducts.ts
import { useQuery } from '@tanstack/react-query';
import { ProductsAPI, type GetProductsParams } from '@/lib/client/services/products.api';
import { queryKeys } from './query-keys';

export function useArtistProducts(
  artistSlug: string,
  params?: Omit<GetProductsParams, 'artistSlug'>
) {
  return useQuery({
    queryKey: queryKeys.products.list({ ...params, artistSlug }),
    queryFn: () => ProductsAPI.getProductsByArtist(artistSlug, params),
    enabled: !!artistSlug,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  });
}
```

**사용 예시**:

```tsx
// 미루루 굿즈샵
function MiruruShop() {
  const { data, isLoading } = useArtistProducts('miruru', {
    type: 'VOICE_PACK',
    sortBy: 'created_at',
    order: 'desc',
  });

  const products = data?.data || [];

  return (
    <div>
      <h1>미루루 보이스팩</h1>
      <ProductGrid products={products} />
    </div>
  );
}
```

---

## 4. Mutation Hooks

상품은 **읽기 전용**이므로 Mutation Hook은 없습니다.

관리자 기능이 추가되는 경우:
- `useCreateProduct()` - 상품 생성
- `useUpdateProduct()` - 상품 수정
- `useDeleteProduct()` - 상품 삭제

---

## 5. 실전 예시

### 5.1 상품 목록 + 필터링

```tsx
function ProductListWithFilters() {
  const [filters, setFilters] = useState<GetProductsParams>({
    page: 1,
    limit: 12,
    type: 'VOICE_PACK',
  });

  const { data, isLoading, isPreviousData } = useProducts(filters);

  const handleTypeChange = (type: 'VOICE_PACK' | 'PHYSICAL_GOODS') => {
    setFilters((prev) => ({ ...prev, type, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div>
      <FilterBar currentType={filters.type} onTypeChange={handleTypeChange} />

      {isLoading && <Loading />}

      {data && (
        <>
          <ProductGrid products={data.data} />
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

### 5.2 상품 상세 + 샘플 재생

```tsx
function VoicePackDetail({ productId }: { productId: string }) {
  const { data: productData, isLoading } = useProduct(productId);

  if (isLoading) return <Loading />;

  const product = productData?.data;
  if (!product) return <NotFound />;

  const sampleUrl = ProductsAPI.getSampleUrl(product.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {product.sample_audio_url && (
        <div className="my-4">
          <h2>샘플 청취</h2>
          <audio controls src={sampleUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <button>
        {product.price.toLocaleString()}원 구매하기
      </button>
    </div>
  );
}
```

### 5.3 페이지네이션 + keepPreviousData

```tsx
function InfiniteProductList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPreviousData } = useProducts({
    page,
    limit: 12,
  });

  const products = data?.data || [];
  const hasMore = data?.pagination
    ? data.pagination.page < data.pagination.totalPages
    : false;

  return (
    <div>
      <div className={isPreviousData ? 'opacity-50' : ''}>
        <ProductGrid products={products} />
      </div>

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isPreviousData}
        >
          더 보기
        </button>
      )}
    </div>
  );
}
```

---

## 6. 에러 처리

### 6.1 Hook 레벨 에러 처리

```ts
export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params || {}),
    queryFn: () => ProductsAPI.getProducts(params),
    onError: (error) => {
      if (error instanceof ApiError) {
        console.error('Products fetch error:', error.message);
      }
    },
  });
}
```

### 6.2 Component 레벨 에러 처리

```tsx
function ProductList() {
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

  return <ProductGrid products={data?.data || []} />;
}
```

---

## 7. 캐시 관리

### 7.1 Cache Invalidation

상품 데이터가 변경되었을 때 캐시 무효화:

```ts
import { useQueryClient } from '@tanstack/react-query';

function AdminPanel() {
  const queryClient = useQueryClient();

  const handleProductUpdate = async () => {
    // 상품 수정 후...

    // 모든 상품 목록 캐시 무효화
    await queryClient.invalidateQueries({
      queryKey: queryKeys.products.lists(),
    });

    // 특정 상품 상세 캐시 무효화
    await queryClient.invalidateQueries({
      queryKey: queryKeys.products.detail(productId),
    });
  };
}
```

### 7.2 Prefetching

페이지 전환 전에 데이터 미리 로드:

```tsx
import { useQueryClient } from '@tanstack/react-query';

function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // 상품 상세 데이터 prefetch
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(product.id),
      queryFn: () => ProductsAPI.getProduct(product.id),
    });
  };

  return (
    <Link href={`/products/${product.id}`} onMouseEnter={handleMouseEnter}>
      <ProductCardContent product={product} />
    </Link>
  );
}
```

---

## 8. 성능 최적화

### 8.1 staleTime 설정

```ts
// 상품 목록: 5분
staleTime: 1000 * 60 * 5

// 상품 상세: 10분
staleTime: 1000 * 60 * 10
```

### 8.2 keepPreviousData

페이지네이션 시 이전 데이터 유지:

```ts
useQuery({
  queryKey: queryKeys.products.list(params),
  queryFn: () => ProductsAPI.getProducts(params),
  keepPreviousData: true, // 페이지 전환 시 깜빡임 방지
});
```

### 8.3 Select를 사용한 데이터 변환

필요한 데이터만 추출:

```ts
function useProductNames() {
  return useQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: () => ProductsAPI.getProducts(),
    select: (data) => data.data.map((p) => p.name),
  });
}
```

---

## 9. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/products/index.md`
- API Routes: `/specs/api/server/routes/products/index.md`
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
