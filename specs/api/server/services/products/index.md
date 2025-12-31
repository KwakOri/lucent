# Product Service

이 문서는 **상품(Product) Server Service** 구현을 정의한다.

> **범위**: 상품 관련 비즈니스 로직 및 DB 접근
> **관련 문서**:
> - Server Service 패턴: `/specs/api/server/services/index.md`
> - API Routes: `/specs/api/server/routes/products/index.md`
> - Database Types: `/types/database.ts`

---

## 1. 개요

**ProductService**는 상품 관련 모든 비즈니스 로직과 데이터베이스 접근을 담당한다.

**위치**: `/lib/server/services/product.service.ts`
**사용 대상**: API Route에서만 호출
**역할**: 상품 CRUD, 재고 관리, 이미지 조회

---

## 2. 데이터 모델

### 2.1 Product 타입

```ts
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/types/database';

type Product = Tables<'products'>;
type ProductInsert = TablesInsert<'products'>;
type ProductUpdate = TablesUpdate<'products'>;
type ProductType = Enums<'product_type'>;
```

### 2.2 확장 타입 (JOIN 포함)

```ts
interface ProductWithRelations extends Product {
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

---

## 3. ProductService 클래스

### 3.1 기본 구조

```ts
// lib/server/services/product.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';

type Product = Tables<'products'>;
type ProductType = Enums<'product_type'>;

interface GetProductsOptions {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'price' | 'name';
  order?: 'asc' | 'desc';
  type?: ProductType;
  artistSlug?: string;
  projectSlug?: string;
  isActive?: boolean;
  inStock?: boolean;
}

export class ProductService {
  // 메서드 구현...
}
```

---

## 4. 주요 메서드

### 4.1 상품 목록 조회

```ts
/**
 * 상품 목록 조회
 */
static async getProducts(
  options: GetProductsOptions = {}
): Promise<{ products: ProductWithRelations[]; total: number }> {
  const supabase = createServerClient();
  const {
    page = 1,
    limit = 12,
    sortBy = 'created_at',
    order = 'desc',
    type,
    artistSlug,
    projectSlug,
    isActive = true,
    inStock,
  } = options;

  let query = supabase
    .from('products')
    .select(
      `
      *,
      main_image:images!products_main_image_id_fkey (
        id,
        public_url,
        cdn_url,
        thumbnail_url,
        alt_text,
        width,
        height
      ),
      artist:artists (
        id,
        name,
        slug,
        profile_image:images (
          public_url,
          cdn_url
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('is_active', isActive);

  // 타입 필터
  if (type) {
    query = query.eq('type', type);
  }

  // 아티스트 필터
  if (artistSlug) {
    query = query.eq('artist.slug', artistSlug);
  }

  // 프로젝트 필터
  if (projectSlug) {
    query = query.eq('project_slug', projectSlug);
  }

  // 재고 필터 (실물 굿즈만)
  if (inStock) {
    query = query.or('stock.gt.0,stock.is.null');
  }

  // 정렬
  query = query.order(sortBy, { ascending: order === 'asc' });

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new ApiError('상품 목록 조회 실패', 500, 'PRODUCT_FETCH_FAILED');
  }

  return {
    products: data as ProductWithRelations[],
    total: count || 0,
  };
}
```

### 4.2 상품 단일 조회 (ID)

```ts
/**
 * 상품 단일 조회 (ID)
 */
static async getProductById(id: string): Promise<ProductWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      main_image:images!products_main_image_id_fkey (
        id,
        public_url,
        cdn_url,
        thumbnail_url,
        alt_text,
        width,
        height
      ),
      gallery_images:product_images (
        image:images (
          id,
          public_url,
          cdn_url,
          alt_text
        ),
        display_order
      ),
      artist:artists (
        id,
        name,
        slug,
        profile_image:images (
          public_url,
          cdn_url
        )
      )
    `
    )
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('상품 조회 실패', 500, 'PRODUCT_FETCH_FAILED');
  }

  return data as ProductWithRelations | null;
}
```

### 4.3 상품 단일 조회 (Slug)

```ts
/**
 * 상품 단일 조회 (아티스트 slug + 상품 slug)
 */
static async getProductBySlug(
  artistSlug: string,
  productSlug: string
): Promise<ProductWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      main_image:images!products_main_image_id_fkey (*),
      gallery_images:product_images (
        image:images (*),
        display_order
      ),
      artist:artists!inner (
        id,
        name,
        slug,
        profile_image:images (*)
      )
    `
    )
    .eq('slug', productSlug)
    .eq('artist.slug', artistSlug)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('상품 조회 실패', 500, 'PRODUCT_FETCH_FAILED');
  }

  return data as ProductWithRelations | null;
}
```

### 4.4 상품 생성 (관리자)

```ts
/**
 * 상품 생성 (관리자 전용)
 */
static async createProduct(
  data: Omit<ProductInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<Product> {
  const supabase = createServerClient();

  // 필수 필드 검증
  if (!data.name || !data.project_id) {
    throw new ApiError('필수 필드 누락', 400, 'INVALID_INPUT');
  }

  // slug 생성 (name 기반)
  const slug = data.slug || this.generateSlug(data.name);

  // slug 중복 확인
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('project_id', data.project_id)
    .single();

  if (existing) {
    throw new ApiError('이미 존재하는 상품 slug입니다', 400, 'DUPLICATE_SLUG');
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...data, slug })
    .select()
    .single();

  if (error) {
    throw new ApiError('상품 생성 실패', 500, 'PRODUCT_CREATE_FAILED');
  }

  return product;
}
```

### 4.5 재고 차감

```ts
/**
 * 재고 차감 (주문 생성 시)
 */
static async decreaseStock(productId: string, quantity: number): Promise<void> {
  const supabase = createServerClient();

  // 현재 재고 조회
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock, type')
    .eq('id', productId)
    .single();

  if (fetchError) {
    throw new ApiError('상품 조회 실패', 500, 'PRODUCT_FETCH_FAILED');
  }

  // 디지털 상품은 재고 차감 불필요
  if (product.stock === null) {
    return;
  }

  // 재고 부족 확인
  if (product.stock < quantity) {
    throw new ApiError('재고 부족', 400, 'INSUFFICIENT_STOCK');
  }

  // 낙관적 잠금 (Optimistic Locking)
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: product.stock - quantity })
    .eq('id', productId)
    .eq('stock', product.stock); // 현재 stock이 같을 때만 업데이트

  if (updateError) {
    throw new ApiError(
      '재고 차감 실패. 다시 시도해주세요.',
      409,
      'STOCK_UPDATE_FAILED'
    );
  }
}
```

### 4.6 재고 복구

```ts
/**
 * 재고 복구 (주문 취소 시)
 */
static async increaseStock(productId: string, quantity: number): Promise<void> {
  const supabase = createServerClient();

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (fetchError) {
    throw new ApiError('상품 조회 실패', 500);
  }

  // 디지털 상품은 재고 복구 불필요
  if (product.stock === null) {
    return;
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: product.stock + quantity })
    .eq('id', productId);

  if (updateError) {
    throw new ApiError('재고 복구 실패', 500);
  }
}
```

---

## 5. 헬퍼 메서드

### 5.1 Slug 생성

```ts
/**
 * slug 생성 (한글 → 영문)
 */
private static generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
```

---

## 6. 이미지 관리

### 6.1 메인 이미지

상품의 메인 이미지는 `products.main_image_id`를 통해 `images` 테이블과 연결됩니다.

```ts
// JOIN 쿼리에서 자동으로 로드
main_image:images!products_main_image_id_fkey (
  id,
  public_url,
  cdn_url,
  thumbnail_url,
  alt_text
)
```

### 6.2 갤러리 이미지

갤러리 이미지는 `product_images` 중간 테이블을 통해 관리됩니다.

```ts
// JOIN 쿼리
gallery_images:product_images (
  image:images (
    id,
    public_url,
    cdn_url,
    alt_text
  ),
  display_order
)
```

**정렬**: `display_order` 오름차순

---

## 7. 재고 관리 정책

### 7.1 재고 타입

| 상품 타입 | stock 값 | 의미 |
|-----------|----------|------|
| `VOICE_PACK` | `null` | 무제한 (디지털 상품) |
| `PHYSICAL_GOODS` | `숫자` | 제한적 재고 |
| `PHYSICAL_GOODS` | `0` | 품절 |
| `PHYSICAL_GOODS` | `null` | 무제한 (특수 케이스) |

### 7.2 동시성 제어

재고 차감 시 **낙관적 잠금(Optimistic Locking)** 사용:

```ts
// 현재 stock 값이 같을 때만 업데이트
.update({ stock: currentStock - quantity })
.eq('id', productId)
.eq('stock', currentStock)
```

실패 시 에러 발생 → 클라이언트가 재시도

---

## 8. 에러 처리

### 8.1 에러 코드

| 에러 코드 | 상태 코드 | 설명 |
|-----------|-----------|------|
| `PRODUCT_NOT_FOUND` | 404 | 상품을 찾을 수 없음 |
| `PRODUCT_FETCH_FAILED` | 500 | 상품 조회 실패 |
| `PRODUCT_CREATE_FAILED` | 500 | 상품 생성 실패 |
| `DUPLICATE_SLUG` | 400 | slug 중복 |
| `INVALID_INPUT` | 400 | 필수 필드 누락 |
| `INSUFFICIENT_STOCK` | 400 | 재고 부족 |
| `STOCK_UPDATE_FAILED` | 409 | 재고 업데이트 충돌 |

### 8.2 사용 예시

```ts
if (!product) {
  throw new ApiError('상품을 찾을 수 없습니다', 404, 'PRODUCT_NOT_FOUND');
}

if (product.stock < quantity) {
  throw new ApiError('재고 부족', 400, 'INSUFFICIENT_STOCK');
}
```

---

## 9. 참고 문서

- Server Service 패턴: `/specs/api/server/services/index.md`
- API Routes: `/specs/api/server/routes/products/index.md`
- Client Services: `/specs/api/client/services/products/index.md`
- Database Types: `/types/database.ts`
