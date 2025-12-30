# Logs API Routes

이 문서는 **로그(Logs) API Route** 엔드포인트를 정의한다.

> **범위**: Next.js API Route 엔드포인트 (HTTP 인터페이스)
> **관련 문서**:
> - Server Service: `/specs/api/server/services/logs/index.md`
> - Client Services: `/specs/api/client/services/logs/index.md`
> - React Query Hooks: `/specs/api/client/hooks/logs/index.md`

---

## 1. 로그 시스템 개요

- **목적**: 중요한 이벤트를 DB에 기록하여 보안, 거래, 고객 지원에 활용
- **공개 범위**: 관리자만 조회 가능 (일반 유저는 접근 불가)
- **기록 방식**: 서버 사이드에서 자동 기록
- **보관 정책**: 기본 3년 (1차 MVP에서는 삭제 없음)

---

## 2. 로그 이벤트 분류

### 2.1 이벤트 카테고리

| 카테고리 | 설명 | 예시 |
|---------|------|------|
| `auth` | 인증 및 보안 | 로그인, 회원가입, 이메일 인증 |
| `order` | 주문 및 결제 | 주문 생성, 상태 변경, 환불 |
| `product` | 상품 관리 | 상품 등록, 수정, 재고 변경 |
| `download` | 디지털 상품 | 다운로드, 링크 생성 |
| `security` | 보안 위협 | 권한 없는 접근, API 제한 초과 |
| `admin` | 관리자 작업 | 이미지 업로드, 주문 처리 |

### 2.2 심각도 (Severity)

| 레벨 | 설명 | 예시 |
|------|------|------|
| `info` | 정상 작동 | 로그인 성공, 주문 생성 |
| `warning` | 주의 필요 | 로그인 실패, 재고 부족 |
| `error` | 에러 발생 | API 에러, 결제 실패 |
| `critical` | 즉시 대응 필요 | 보안 위협, 시스템 장애 |

### 2.3 주요 이벤트 타입

```typescript
// 인증
'user.signup.success'
'user.signup.failed'
'user.login.success'
'user.login.failed'
'user.logout'
'user.email_verification.sent'
'user.email_verification.success'
'user.password_reset.requested'
'user.password_reset.success'

// 주문
'order.created'
'order.status.changed'
'order.cancelled'
'order.refund.requested'
'order.refund.completed'

// 디지털 상품
'digital_product.download'
'digital_product.download_link_generated'
'digital_product.download.unauthorized'

// 관리자
'admin.product.created'
'admin.product.updated'
'admin.product.deleted'
'admin.image.uploaded'
'admin.order.status_changed'

// 보안
'security.unauthorized.access'
'security.rate_limit.exceeded'
'security.suspicious.activity'
```

---

## 3. API 엔드포인트

### 3.1 로그 목록 조회 (관리자)

```
GET /api/logs
```

**인증**: 필수 (관리자만)

**Query Parameters**:
- `page`: 페이지 번호 (기본: 1)
- `limit`: 페이지당 항목 수 (기본: 50, 최대: 200)
- `sortBy`: 정렬 기준 (`created_at`, 기본: `created_at`)
- `order`: 정렬 순서 (`asc`, `desc`, 기본: `desc`)
- `filter[event_category]`: 카테고리 필터 (`auth`, `order`, `product` 등)
- `filter[event_type]`: 이벤트 타입 필터 (예: `user.login.success`)
- `filter[severity]`: 심각도 필터 (`info`, `warning`, `error`, `critical`)
- `filter[user_id]`: 특정 유저의 로그만
- `filter[date_from]`: 시작 날짜 (ISO 8601)
- `filter[date_to]`: 종료 날짜 (ISO 8601)
- `search`: 메시지 검색 (전문 검색)

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "event_type": "user.login.success",
      "event_category": "auth",
      "severity": "info",
      "user_id": "uuid",
      "user_email": "user@example.com",
      "admin_id": null,
      "resource_type": null,
      "resource_id": null,
      "message": "사용자 로그인 성공",
      "metadata": {
        "browser": "Chrome",
        "os": "Windows"
      },
      "ip_address": "127.0.0.1",
      "user_agent": "Mozilla/5.0...",
      "request_path": "/api/auth/login",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "totalPages": 25
  }
}
```

### 3.2 로그 단일 조회 (관리자)

```
GET /api/logs/:id
```

**인증**: 필수 (관리자만)

**Path Parameters**:
- `id`: 로그 ID (UUID)

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "event_type": "order.status.changed",
    "event_category": "order",
    "severity": "info",
    "user_id": "uuid",
    "user": {
      "email": "user@example.com",
      "name": "홍길동"
    },
    "admin_id": "uuid",
    "admin": {
      "email": "admin@example.com",
      "name": "관리자"
    },
    "resource_type": "order",
    "resource_id": "order-uuid",
    "message": "주문 상태가 '입금대기'에서 '입금확인'으로 변경되었습니다",
    "metadata": {
      "order_number": "ORD-20250115-001",
      "product_name": "미루루 보이스팩 Vol.1"
    },
    "ip_address": "127.0.0.1",
    "user_agent": "Mozilla/5.0...",
    "request_path": "/api/orders/uuid",
    "changes": {
      "status_before": "PENDING",
      "status_after": "PAID"
    },
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### 3.3 로그 통계 조회 (관리자)

```
GET /api/logs/stats
```

**인증**: 필수 (관리자만)

**Query Parameters**:
- `date_from`: 시작 날짜 (ISO 8601)
- `date_to`: 종료 날짜 (ISO 8601)
- `group_by`: 그룹화 기준 (`event_category`, `severity`, `date`)

**Response**:
```json
{
  "status": "success",
  "data": {
    "total": 1250,
    "by_category": {
      "auth": 450,
      "order": 320,
      "product": 180,
      "download": 200,
      "security": 50,
      "admin": 50
    },
    "by_severity": {
      "info": 1100,
      "warning": 120,
      "error": 25,
      "critical": 5
    },
    "by_date": [
      {
        "date": "2025-01-15",
        "count": 350
      },
      {
        "date": "2025-01-14",
        "count": 280
      }
    ]
  }
}
```

---

## 4. 에러 응답

### 4.1 권한 없음

```json
{
  "status": "error",
  "message": "관리자 권한이 필요합니다",
  "errorCode": "UNAUTHORIZED"
}
```

**Status Code**: `403 Forbidden`

### 4.2 로그를 찾을 수 없음

```json
{
  "status": "error",
  "message": "로그를 찾을 수 없습니다",
  "errorCode": "LOG_NOT_FOUND"
}
```

**Status Code**: `404 Not Found`

---

## 5. 구현 예시

### 5.1 로그 목록 조회 (관리자)

```ts
// app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError } from '@/lib/server/utils/api-response';
import { verifyAdmin } from '@/lib/server/utils/auth';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { status: 'error', message: '관리자 권한이 필요합니다', errorCode: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    const filters = {
      eventCategory: searchParams.get('filter[event_category]'),
      eventType: searchParams.get('filter[event_type]'),
      severity: searchParams.get('filter[severity]'),
      userId: searchParams.get('filter[user_id]'),
      dateFrom: searchParams.get('filter[date_from]'),
      dateTo: searchParams.get('filter[date_to]'),
      search: searchParams.get('search'),
    };

    const result = await LogService.getLogs({
      page,
      limit,
      sortBy,
      order,
      ...filters,
    });

    return NextResponse.json({
      status: 'success',
      data: result.logs,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 5.2 로그 단일 조회 (관리자)

```ts
// app/api/logs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';
import { handleApiError } from '@/lib/server/utils/api-response';
import { verifyAdmin } from '@/lib/server/utils/auth';
import { ApiError } from '@/lib/server/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      throw new ApiError('관리자 권한이 필요합니다', 403, 'UNAUTHORIZED');
    }

    const log = await LogService.getLogById(params.id);

    if (!log) {
      throw new ApiError('로그를 찾을 수 없습니다', 404, 'LOG_NOT_FOUND');
    }

    return NextResponse.json({
      status: 'success',
      data: log,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 6. 로그 자동 기록 (미들웨어)

```ts
// lib/server/middleware/log-middleware.ts
import { NextRequest } from 'next/server';
import { LogService } from '@/lib/server/services/log.service';

/**
 * 중요 이벤트 자동 로깅
 */
export async function logEvent(
  eventType: string,
  options: {
    userId?: string;
    adminId?: string;
    resourceType?: string;
    resourceId?: string;
    message: string;
    metadata?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    request?: NextRequest;
  }
) {
  try {
    await LogService.log({
      eventType,
      eventCategory: eventType.split('.')[0], // 'user.login.success' -> 'user'
      severity: options.severity || 'info',
      userId: options.userId,
      adminId: options.adminId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      message: options.message,
      metadata: options.metadata,
      ipAddress: options.request?.ip || null,
      userAgent: options.request?.headers.get('user-agent') || null,
      requestPath: options.request?.nextUrl.pathname || null,
    });
  } catch (error) {
    // 로그 기록 실패 시 에러를 던지지 않음 (서비스 중단 방지)
    console.error('로그 기록 실패:', error);
  }
}
```

---

## 7. 1차 MVP 범위

### 포함

- ✅ 로그 목록 조회 (관리자, 필터링, 검색)
- ✅ 로그 단일 조회 (관리자)
- ✅ 로그 통계 조회 (관리자)
- ✅ 자동 로그 기록 (서버 사이드)
- ✅ 주요 이벤트 기록 (인증, 주문, 다운로드)

### 제외 (2차 확장)

- ⏸️ 실시간 로그 스트리밍 (WebSocket)
- ⏸️ 로그 알림 설정 (특정 이벤트 발생 시 알림)
- ⏸️ 로그 내보내기 (CSV, JSON)
- ⏸️ 로그 분석 대시보드
- ⏸️ 로그 자동 삭제/아카이빙

---

## 8. 참고 문서

- Server Service: `/specs/api/server/services/logs/index.md`
- Client Services: `/specs/api/client/services/logs/index.md`
- React Query Hooks: `/specs/api/client/hooks/logs/index.md`
- API Routes 패턴: `/specs/api/server/routes/index.md`
