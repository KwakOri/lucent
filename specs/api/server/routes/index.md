# API Routes (Next.js)

이 문서는 **Next.js API Route** 패턴과 엔드포인트 정의 방법을 설명한다.

> **범위**: Next.js API Routes의 구현 패턴
> **관련 문서**:
> - Server Service Layer: `/specs/api/server/services/index.md`
> - Client Services Layer: `/specs/api/client/services/index.md`

---

## 1. 개요

### 1-1. API Route란?

**API Route**는 Next.js의 서버 측 엔드포인트로, HTTP 요청을 처리한다.

**위치**: `/app/api/`
**역할**: HTTP 처리, 인증/권한 검증, Server Service 호출, 응답 반환

### 1-2. 데이터 흐름에서의 위치

```
Client Services (fetch)
       ↓
API Route (HTTP 처리, 인증) ⭐ 이 문서
       ↓
Server Service (비즈니스 로직)
       ↓
Supabase DB
```

---

## 2. 기본 구조

### 2-1. 파일 위치

```
/app
  /api
    /products
      route.ts           # GET /api/products, POST /api/products
      /[id]
        route.ts         # GET /api/products/:id, PATCH /api/products/:id
        /sample
          route.ts       # GET /api/products/:id/sample
    /orders
      route.ts
      /[id]
        route.ts
    /auth
      /login
        route.ts         # POST /api/auth/login
      /logout
        route.ts         # POST /api/auth/logout
```

### 2-2. 기본 패턴

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/server/services/product.service';
import { ApiError } from '@/lib/server/utils/errors';

/**
 * GET /api/products
 * 상품 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Query Parameters 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const type = searchParams.get('filter[type]') as 'VOICE_PACK' | 'PHYSICAL_GOODS' | undefined;

    // 2. Server Service 호출
    const result = await ProductService.getProducts({ page, limit, type });

    // 3. 성공 응답
    return NextResponse.json({
      status: 'success',
      data: result.products,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    // 4. 에러 처리
    if (error instanceof ApiError) {
      return NextResponse.json(
        { status: 'error', message: error.message, errorCode: error.errorCode },
        { status: error.statusCode }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { status: 'error', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * 상품 생성 (관리자 전용)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인 (관리자만)
    const session = await getSession(request);
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { status: 'error', message: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 2. Request Body 파싱
    const body = await request.json();

    // 3. Server Service 호출
    const product = await ProductService.createProduct(body);

    // 4. 성공 응답
    return NextResponse.json(
      { status: 'success', data: product },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { status: 'error', message: error.message, errorCode: error.errorCode },
        { status: error.statusCode }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { status: 'error', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

---

## 3. 인증 패턴

### 3-1. 인증 필요 엔드포인트

```ts
// app/api/orders/route.ts
import { getSession } from '@/lib/server/utils/auth';

export async function GET(request: NextRequest) {
  // 1. 세션 확인
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json(
      { status: 'error', message: '로그인이 필요합니다' },
      { status: 401 }
    );
  }

  // 2. 본인 주문만 조회
  const orders = await OrderService.getMyOrders(session.user.id);

  return NextResponse.json({ status: 'success', data: orders });
}
```

### 3-2. 권한 확인 (관리자 전용)

```ts
export async function DELETE(request: NextRequest) {
  const session = await getSession(request);

  // 관리자 권한 확인
  if (!session || !session.user.isAdmin) {
    return NextResponse.json(
      { status: 'error', message: '관리자 권한이 필요합니다' },
      { status: 403 }
    );
  }

  // ...
}
```

---

## 4. 동적 라우트

### 4-1. [id] 파라미터

```ts
// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/products/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await ProductService.getProductById(params.id);

    if (!product) {
      return NextResponse.json(
        { status: 'error', message: '상품을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: 'success', data: product });
  } catch (error) {
    // 에러 처리
  }
}

/**
 * PATCH /api/products/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    if (!session?.user.isAdmin) {
      return NextResponse.json(
        { status: 'error', message: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const product = await ProductService.updateProduct(params.id, body);

    return NextResponse.json({ status: 'success', data: product });
  } catch (error) {
    // 에러 처리
  }
}
```

---

## 5. Query Parameters 처리

### 5-1. 페이지네이션

```ts
const searchParams = request.nextUrl.searchParams;
const page = parseInt(searchParams.get('page') || '1');
const limit = parseInt(searchParams.get('limit') || '12');
```

### 5-2. 필터링

```ts
const type = searchParams.get('filter[type]');
const artistSlug = searchParams.get('filter[artist]');
const inStock = searchParams.get('filter[in_stock]') === 'true';
```

### 5-3. 정렬

```ts
const sortBy = searchParams.get('sortBy') || 'created_at';
const order = searchParams.get('order') || 'desc';
```

---

## 6. 에러 처리 패턴

### 6-1. 공통 에러 핸들러

```ts
// lib/server/utils/api-response.ts
export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        errorCode: error.errorCode,
      },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { status: 'error', message: '서버 오류가 발생했습니다' },
    { status: 500 }
  );
}
```

### 6-2. 사용 예시

```ts
export async function GET(request: NextRequest) {
  try {
    const products = await ProductService.getProducts();
    return NextResponse.json({ status: 'success', data: products });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 7. 응답 형식

### 7-1. 성공 응답

```ts
// 단일 리소스
return NextResponse.json({
  status: 'success',
  data: { id: '123', name: 'Product' }
});

// 목록 (페이지네이션)
return NextResponse.json({
  status: 'success',
  data: [...],
  pagination: {
    total: 100,
    page: 1,
    limit: 12,
    totalPages: 9
  }
});
```

### 7-2. 에러 응답

```ts
return NextResponse.json(
  {
    status: 'error',
    message: '상품을 찾을 수 없습니다',
    errorCode: 'PRODUCT_NOT_FOUND'
  },
  { status: 404 }
);
```

---

## 8. 리소스별 엔드포인트

각 리소스별 상세 엔드포인트는 개별 문서 참조:

- **Auth**: [`/specs/api/server/routes/auth/index.md`](/specs/api/server/routes/auth/index.md)
- **Profiles**: [`/specs/api/server/routes/profiles/index.md`](/specs/api/server/routes/profiles/index.md)
- **Products**: [`/specs/api/server/routes/products/index.md`](/specs/api/server/routes/products/index.md)
- **Orders**: [`/specs/api/server/routes/orders/index.md`](/specs/api/server/routes/orders/index.md)
- **Artists**: [`/specs/api/server/routes/artists/index.md`](/specs/api/server/routes/artists/index.md)
- **Projects**: [`/specs/api/server/routes/projects/index.md`](/specs/api/server/routes/projects/index.md)

---

## 9. 체크리스트

새 API Route 작성 시 확인:

- [ ] 적절한 HTTP 메서드 사용 (GET, POST, PATCH, DELETE)
- [ ] 인증이 필요하면 `getSession()` 확인
- [ ] Server Service 호출 (비즈니스 로직은 Service에)
- [ ] 통일된 응답 형식 (`{ status, data }`)
- [ ] 에러 처리 (ApiError catch)
- [ ] Query Parameters 파싱
- [ ] TypeScript 타입 정의

---

## 10. 참고 문서

- `/specs/api/server/services/index.md` - Server Service 패턴
- `/specs/api/client/services/index.md` - Client Services 패턴
- `/specs/api/index.md` - API 전체 개요
