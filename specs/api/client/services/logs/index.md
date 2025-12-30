# Logs Client Services

이 문서는 **로그(Logs) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 로그 API를 호출하는 Client Services Layer (관리자 전용)
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/logs/index.md`
> - API Routes: `/specs/api/server/routes/logs/index.md`

---

## 1. 개요

**LogsAPI**는 프론트엔드에서 로그 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/logs.api.ts`
**사용 대상**: React Query Hook에서만 호출 (관리자 전용)
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 Log 타입

```ts
// lib/client/services/logs.api.ts
export interface Log {
  id: string;

  // 이벤트 정보
  event_type: string;
  event_category: string;
  severity: 'info' | 'warning' | 'error' | 'critical';

  // 주체 정보
  user_id: string | null;
  user_email?: string;
  admin_id: string | null;

  // 대상 정보
  resource_type: string | null;
  resource_id: string | null;

  // 상세 정보
  message: string;
  metadata: Record<string, any> | null;

  // 요청 정보
  ip_address: string | null;
  user_agent: string | null;
  request_path: string | null;

  // 변경 사항
  changes: Record<string, any> | null;

  created_at: string;

  // JOIN 데이터
  user?: {
    email: string;
    name: string | null;
  } | null;

  admin?: {
    email: string;
    name: string | null;
  } | null;
}
```

### 2.2 쿼리 파라미터 타입

```ts
export interface GetLogsParams {
  page?: number;
  limit?: number;
  sortBy?: 'created_at';
  order?: 'asc' | 'desc';
  eventCategory?: string;
  eventType?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
```

### 2.3 통계 타입

```ts
export interface LogStats {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byDate?: Array<{
    date: string;
    count: number;
  }>;
}
```

### 2.4 응답 타입

```ts
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

// 목록 응답
type LogListResponse = PaginatedResponse<Log>;

// 상세 응답
type LogDetailResponse = ApiResponse<Log>;

// 통계 응답
type LogStatsResponse = ApiResponse<LogStats>;
```

---

## 3. LogsAPI 구현

### 3.1 기본 구조

```ts
// lib/client/services/logs.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse, PaginatedResponse } from '@/lib/shared/types/api.types';

export const LogsAPI = {
  /**
   * 로그 목록 조회 (관리자)
   */
  async getLogs(params?: GetLogsParams): Promise<PaginatedResponse<Log>> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.eventCategory) searchParams.set('filter[event_category]', params.eventCategory);
    if (params?.eventType) searchParams.set('filter[event_type]', params.eventType);
    if (params?.severity) searchParams.set('filter[severity]', params.severity);
    if (params?.userId) searchParams.set('filter[user_id]', params.userId);
    if (params?.dateFrom) searchParams.set('filter[date_from]', params.dateFrom);
    if (params?.dateTo) searchParams.set('filter[date_to]', params.dateTo);
    if (params?.search) searchParams.set('search', params.search);

    return apiClient.get(`/api/logs?${searchParams}`);
  },

  /**
   * 로그 단일 조회 (관리자)
   */
  async getLog(id: string): Promise<ApiResponse<Log>> {
    return apiClient.get(`/api/logs/${id}`);
  },

  /**
   * 로그 통계 조회 (관리자)
   */
  async getStats(params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<LogStats>> {
    const searchParams = new URLSearchParams();

    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);

    return apiClient.get(`/api/logs/stats?${searchParams}`);
  },
};
```

---

## 4. 사용 예시

### 4.1 로그 목록 조회 (관리자)

```ts
import { LogsAPI } from '@/lib/client/services/logs.api';

// 기본 목록
const response = await LogsAPI.getLogs({
  page: 1,
  limit: 50,
  order: 'desc',
});

console.log(response.data); // Log[]
console.log(response.pagination); // { total, page, limit, totalPages }

// 필터링
const filtered = await LogsAPI.getLogs({
  page: 1,
  limit: 50,
  eventCategory: 'auth',
  severity: 'warning',
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
});
```

### 4.2 로그 상세 조회

```ts
const log = await LogsAPI.getLog('log-uuid');
console.log(log.data); // Log
```

### 4.3 로그 통계 조회

```ts
const stats = await LogsAPI.getStats({
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
});

console.log(stats.data.total); // 전체 로그 수
console.log(stats.data.byCategory); // { auth: 450, order: 320, ... }
console.log(stats.data.bySeverity); // { info: 1100, warning: 120, ... }
```

### 4.4 특정 유저의 로그 조회

```ts
const userLogs = await LogsAPI.getLogs({
  userId: 'user-uuid',
  order: 'desc',
  limit: 100,
});
```

### 4.5 로그 검색

```ts
const searchResults = await LogsAPI.getLogs({
  search: '로그인 실패',
  severity: 'warning',
});
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
  const logs = await LogsAPI.getLogs();
} catch (error) {
  if (error instanceof ApiError) {
    if (error.statusCode === 403) {
      console.error('관리자 권한이 필요합니다');
      // 로그인 페이지로 리다이렉트
    } else if (error.errorCode === 'LOG_FETCH_FAILED') {
      console.error('로그 조회 실패');
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
if (params?.eventCategory) searchParams.set('filter[event_category]', params.eventCategory);
if (params?.severity) searchParams.set('filter[severity]', params.severity);
if (params?.userId) searchParams.set('filter[user_id]', params.userId);

// 날짜 범위
if (params?.dateFrom) searchParams.set('filter[date_from]', params.dateFrom);
if (params?.dateTo) searchParams.set('filter[date_to]', params.dateTo);

// 검색
if (params?.search) searchParams.set('search', params.search);

const url = `/api/logs?${searchParams}`;
```

---

## 7. 응답 형식

### 7.1 목록 응답

```ts
{
  status: 'success',
  data: Log[],
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
  data: Log
}
```

### 7.3 통계 응답

```ts
{
  status: 'success',
  data: {
    total: number,
    byCategory: Record<string, number>,
    bySeverity: Record<string, number>,
    byDate?: Array<{ date: string; count: number }>
  }
}
```

### 7.4 에러 응답

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
const params: GetLogsParams = {
  page: 1,
  eventCategory: 'auth', // 자동완성 지원
  severity: 'warning',
};

// ❌ 컴파일 에러
const invalid: GetLogsParams = {
  page: 1,
  severity: 'invalid', // Type error!
};
```

### 8.2 응답 타입 추론

```ts
const response = await LogsAPI.getLogs();
// response.data는 Log[] 타입
// response.pagination은 PaginationMeta 타입

const log = await LogsAPI.getLog('id');
// log.data는 Log 타입

const stats = await LogsAPI.getStats();
// stats.data는 LogStats 타입
```

---

## 9. 유틸리티 함수

### 9.1 심각도 레벨 표시

```ts
export function getSeverityColor(severity: Log['severity']): string {
  const colors = {
    info: 'blue',
    warning: 'yellow',
    error: 'orange',
    critical: 'red',
  };
  return colors[severity];
}

export function getSeverityLabel(severity: Log['severity']): string {
  const labels = {
    info: '정보',
    warning: '경고',
    error: '오류',
    critical: '긴급',
  };
  return labels[severity];
}
```

### 9.2 이벤트 카테고리 표시

```ts
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    auth: '인증',
    order: '주문',
    product: '상품',
    download: '다운로드',
    security: '보안',
    admin: '관리자',
  };
  return labels[category] || category;
}
```

### 9.3 날짜 범위 생성

```ts
export function getDateRange(preset: 'today' | 'week' | 'month'): {
  dateFrom: string;
  dateTo: string;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let dateFrom: Date;

  switch (preset) {
    case 'today':
      dateFrom = today;
      break;
    case 'week':
      dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 7);
      break;
    case 'month':
      dateFrom = new Date(today);
      dateFrom.setMonth(today.getMonth() - 1);
      break;
  }

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo: now.toISOString(),
  };
}

// 사용 예시
const { dateFrom, dateTo } = getDateRange('week');
const logs = await LogsAPI.getLogs({ dateFrom, dateTo });
```

---

## 10. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/logs/index.md`
- API Routes: `/specs/api/server/routes/logs/index.md`
- API 공통 타입: `/lib/shared/types/api.types.ts`
