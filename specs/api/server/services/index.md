# Server Service Layer

이 문서는 **서버 측 Service Layer** 아키텍처 패턴을 정의한다.

> **범위**: 이 문서는 서버 측(API Route)에서만 사용되는 Service만 다룹니다.
> **관련 문서**:
> - Client Services Layer: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/index.md`

---

## 1. 개요

### 1-1. Server Service란?

**Server Service**는 **API Route와 데이터베이스 사이의 중간 계층**으로, 비즈니스 로직을 캡슐화한다.

**위치**: `/lib/server/services/`
**사용 대상**: Next.js API Route만
**역할**: DB 직접 접근, 비즈니스 로직 처리

### 1-2. 데이터 흐름에서의 위치

```
Next.js API Route (HTTP 처리, 인증/권한 검증)
       ↓
Server Service (비즈니스 로직, DB 연산) ⭐ 이 문서
       ↓
Supabase DB
```

---

## 2. 디렉토리 구조

```
/lib
  /server
    /services
      product.service.ts
      order.service.ts
      artist.service.ts
      project.service.ts
      auth.service.ts
    /utils
      supabase.ts      # Supabase 서버 클라이언트
      errors.ts        # 에러 클래스
```

---

## 3. 네이밍 규칙

### 3-1. 파일명

**패턴**: `{resource}.service.ts`

```
product.service.ts
order.service.ts
auth.service.ts
```

### 3-2. 클래스명

**패턴**: `{Resource}Service`

```ts
export class ProductService { }
export class OrderService { }
export class AuthService { }
```

### 3-3. 메서드명

**패턴**: 동사 + 명사

| 메서드 | 설명 |
|--------|------|
| `getProducts()` | 목록 조회 |
| `getProductById(id)` | 단일 조회 |
| `createProduct(data)` | 생성 |
| `updateProduct(id, data)` | 수정 |
| `deleteProduct(id)` | 삭제 |
| `getProductsByArtist(slug)` | 조건부 조회 |

---

## 4. 기본 구현 패턴

### 4-1. Class 기반 구조

```ts
// lib/server/services/product.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';

type Product = Tables<'products'>;
type ProductInsert = TablesInsert<'products'>;
type ProductType = Enums<'product_type'>;

export class ProductService {
  /**
   * 상품 목록 조회
   */
  static async getProducts(options?: {
    type?: ProductType;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const supabase = createServerClient();
    const { type, page = 1, limit = 12 } = options || {};

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (type) query = query.eq('type', type);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError('상품 목록 조회 실패', 500, 'PRODUCT_FETCH_FAILED');
    }

    return { products: data, total: count || 0 };
  }

  /**
   * 상품 단일 조회
   */
  static async getProductById(id: string): Promise<Product | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new ApiError('상품 조회 실패', 500, 'PRODUCT_FETCH_FAILED');
    }

    return data;
  }

  /**
   * 상품 생성 (관리자)
   */
  static async createProduct(data: ProductInsert): Promise<Product> {
    const supabase = createServerClient();

    if (!data.name || !data.artist_id) {
      throw new ApiError('필수 필드 누락', 400, 'INVALID_INPUT');
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new ApiError('상품 생성 실패', 500, 'PRODUCT_CREATE_FAILED');
    }

    return product;
  }
}
```

### 4-2. 왜 Class + Static 메서드인가?

**Class 사용 이유**:
- 관련 메서드를 하나의 네임스페이스로 그룹화
- `ProductService.getProducts()` - 명확한 소속 표현
- 확장 가능 (필요시 상속)

**Static 메서드 이유**:
- Service는 상태(state)를 가지지 않음
- 인스턴스 생성 불필요 (`new ProductService()` 필요 없음)
- 간결한 호출: `ProductService.getProducts()`

---

## 5. Supabase 클라이언트 사용

### 5-1. 서버 전용 클라이언트 생성

```ts
// lib/server/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials missing');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

### 5-2. 사용 규칙

**필수**:
- ✅ 항상 `createServerClient()` 사용
- ✅ `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 사용
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY` 절대 사용 금지

**이유**: RLS가 없으므로 service_role key로 전체 데이터 접근

---

## 6. 에러 핸들링

### 6-1. 에러 클래스

```ts
// lib/server/utils/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 6-2. Service에서 에러 던지기

```ts
// Service에서
if (!product) {
  throw new ApiError('상품을 찾을 수 없습니다', 404, 'PRODUCT_NOT_FOUND');
}

if (product.stock < quantity) {
  throw new ApiError('재고 부족', 400, 'INSUFFICIENT_STOCK');
}
```

### 6-3. API Route에서 에러 처리

```ts
// app/api/products/route.ts
import { ProductService } from '@/lib/server/services/product.service';
import { ApiError } from '@/lib/server/utils/errors';

export async function GET(request: Request) {
  try {
    const products = await ProductService.getProducts();
    return NextResponse.json({ status: 'success', data: products });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { status: 'error', message: error.message, errorCode: error.errorCode },
        { status: error.statusCode }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { status: 'error', message: '서버 오류' },
      { status: 500 }
    );
  }
}
```

---

## 7. 트랜잭션 처리

### 7-1. 낙관적 잠금 (Optimistic Locking)

```ts
// 재고 차감 예시
static async decreaseStock(productId: string, quantity: number): Promise<void> {
  const supabase = createServerClient();

  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (product.stock === null) return; // 무제한

  if (product.stock < quantity) {
    throw new ApiError('재고 부족', 400, 'INSUFFICIENT_STOCK');
  }

  // 현재 재고가 같을 때만 업데이트 (동시성 제어)
  const { error } = await supabase
    .from('products')
    .update({ stock: product.stock - quantity })
    .eq('id', productId)
    .eq('stock', product.stock); // 낙관적 잠금

  if (error) {
    throw new ApiError('재고 차감 실패. 다시 시도해주세요.', 409);
  }
}
```

### 7-2. PostgreSQL 함수 (RPC) 사용

복잡한 트랜잭션은 PostgreSQL 함수로 작성:

```sql
-- supabase/migrations/xxx_create_order.sql
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- 트랜잭션 내에서 주문 생성 + 재고 차감
  INSERT INTO orders (...) VALUES (...) RETURNING id INTO v_order_id;
  INSERT INTO order_items (...) VALUES (...);
  UPDATE products SET stock = stock - p_quantity WHERE id = p_product_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
```

```ts
// Service에서 RPC 호출
const { data, error } = await supabase.rpc('create_order_with_items', {
  p_user_id: userId,
  p_product_id: productId,
  p_quantity: quantity,
});
```

---

## 8. 실전 예시: Order Service

```ts
// lib/server/services/order.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables, TablesInsert } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';
import { ProductService } from './product.service';

type Order = Tables<'orders'>;

interface CreateOrderDto {
  productId: string;
  quantity: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
}

export class OrderService {
  static async createOrder(userId: string, orderData: CreateOrderDto): Promise<Order> {
    const supabase = createServerClient();

    // 1. 상품 조회
    const product = await ProductService.getProductById(orderData.productId);
    if (!product) {
      throw new ApiError('상품을 찾을 수 없습니다', 404, 'PRODUCT_NOT_FOUND');
    }

    // 2. 재고 확인
    if (product.stock !== null && product.stock < orderData.quantity) {
      throw new ApiError('재고 부족', 400, 'INSUFFICIENT_STOCK');
    }

    // 3. 주문번호 생성
    const orderNumber = this.generateOrderNumber();

    // 4. 주문 생성
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        total_price: product.price * orderData.quantity,
        status: 'PENDING',
        shipping_name: orderData.shippingName,
        shipping_phone: orderData.shippingPhone,
        shipping_address: orderData.shippingAddress,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError('주문 생성 실패', 500, 'ORDER_CREATE_FAILED');
    }

    // 5. 주문 항목 생성
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_type: product.type,
      price_snapshot: product.price,
      quantity: orderData.quantity,
    });

    // 6. 재고 차감
    await ProductService.decreaseStock(product.id, orderData.quantity);

    return order;
  }

  static async getMyOrders(userId: string, page = 1, limit = 10) {
    const supabase = createServerClient();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new ApiError('주문 목록 조회 실패', 500);
    }

    return { orders: data, total: count || 0 };
  }

  private static generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
  }
}
```

---

## 9. 체크리스트

새 Service 작성 시 확인:

- [ ] `/lib/server/services/` 경로에 생성
- [ ] `createServerClient()` 사용
- [ ] `/types/database.ts`에서 타입 import
- [ ] 에러는 `ApiError`로 던지기
- [ ] Static 메서드로 선언
- [ ] 비즈니스 로직 검증 포함
- [ ] JSDoc 주석 작성

---

## 10. 참고 문서

- `/specs/api/client/services/index.md` - Client Services 패턴
- `/specs/api/client/hooks/index.md` - React Query hooks
- `/specs/api/index.md` - API 전체 개요
- `/types/database.ts` - 데이터베이스 타입
