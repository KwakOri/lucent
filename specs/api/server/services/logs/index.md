# Log Service

이 문서는 **로그(Log) Server Service** 구현을 정의한다.

> **범위**: 로그 관련 비즈니스 로직 및 DB 접근
> **관련 문서**:
> - Server Service 패턴: `/specs/api/server/services/index.md`
> - API Routes: `/specs/api/server/routes/logs/index.md`
> - Database Types: `/types/database.ts`

---

## 1. 개요

**LogService**는 로그 기록, 조회, 통계 관련 모든 비즈니스 로직과 데이터베이스 접근을 담당한다.

**위치**: `/lib/server/services/log.service.ts`
**사용 대상**: API Route 및 다른 Service에서 호출
**역할**: 로그 CRUD, 필터링, 통계, 자동 기록

---

## 2. 데이터 모델

### 2.1 Log 타입

```ts
import { Tables, TablesInsert } from '@/types/database';

type Log = Tables<'logs'>;
type LogInsert = TablesInsert<'logs'>;
```

### 2.2 Log 구조

```ts
interface Log {
  id: string;

  // 이벤트 정보
  event_type: string;           // 'user.login.success'
  event_category: string;        // 'auth', 'order', 'product' 등
  severity: 'info' | 'warning' | 'error' | 'critical';

  // 주체 정보
  user_id: string | null;        // 이벤트 발생 유저
  admin_id: string | null;       // 관리자 작업인 경우

  // 대상 정보
  resource_type: string | null;  // 'order', 'product' 등
  resource_id: string | null;    // 리소스 ID

  // 상세 정보
  message: string;               // 사람이 읽을 수 있는 메시지
  metadata: Record<string, any> | null; // 추가 데이터

  // 요청 정보
  ip_address: string | null;
  user_agent: string | null;
  request_path: string | null;

  // 변경 사항
  changes: Record<string, any> | null;

  created_at: string;
}
```

### 2.3 확장 타입 (JOIN 포함)

```ts
interface LogWithRelations extends Log {
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

---

## 3. LogService 클래스

### 3.1 기본 구조

```ts
// lib/server/services/log.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables, TablesInsert } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';

type Log = Tables<'logs'>;
type Severity = 'info' | 'warning' | 'error' | 'critical';

interface LogEventInput {
  eventType: string;
  eventCategory?: string;
  severity?: Severity;
  userId?: string;
  adminId?: string;
  resourceType?: string;
  resourceId?: string;
  message: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestPath?: string | null;
  changes?: Record<string, any>;
}

interface GetLogsOptions {
  page?: number;
  limit?: number;
  sortBy?: 'created_at';
  order?: 'asc' | 'desc';
  eventCategory?: string;
  eventType?: string;
  severity?: Severity;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export class LogService {
  // 메서드 구현...
}
```

---

## 4. 주요 메서드

### 4.1 로그 기록 (핵심 메서드)

```ts
/**
 * 로그 기록
 *
 * 이 메서드는 절대 에러를 던지지 않음 (서비스 중단 방지)
 */
static async log(input: LogEventInput): Promise<void> {
  try {
    const supabase = createServerClient();

    // 이벤트 카테고리 자동 추출
    const eventCategory = input.eventCategory || input.eventType.split('.')[0];

    const logData: TablesInsert<'logs'> = {
      event_type: input.eventType,
      event_category: eventCategory,
      severity: input.severity || 'info',
      user_id: input.userId || null,
      admin_id: input.adminId || null,
      resource_type: input.resourceType || null,
      resource_id: input.resourceId || null,
      message: input.message,
      metadata: input.metadata || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      request_path: input.requestPath || null,
      changes: input.changes || null,
    };

    await supabase.from('logs').insert(logData);
  } catch (error) {
    // 로그 기록 실패 시 콘솔 출력만 하고 에러를 던지지 않음
    console.error('[LogService] 로그 기록 실패:', error);
  }
}
```

### 4.2 로그 목록 조회 (관리자)

```ts
/**
 * 로그 목록 조회
 */
static async getLogs(
  options: GetLogsOptions = {}
): Promise<{ logs: LogWithRelations[]; total: number }> {
  const supabase = createServerClient();
  const {
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    order = 'desc',
    eventCategory,
    eventType,
    severity,
    userId,
    dateFrom,
    dateTo,
    search,
  } = options;

  let query = supabase
    .from('logs')
    .select(
      `
      *,
      user:profiles!logs_user_id_fkey (
        email,
        name
      ),
      admin:profiles!logs_admin_id_fkey (
        email,
        name
      )
    `,
      { count: 'exact' }
    );

  // 필터링
  if (eventCategory) {
    query = query.eq('event_category', eventCategory);
  }

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  if (search) {
    query = query.ilike('message', `%${search}%`);
  }

  // 정렬
  query = query.order(sortBy, { ascending: order === 'asc' });

  // 페이지네이션
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new ApiError('로그 목록 조회 실패', 500, 'LOG_FETCH_FAILED');
  }

  return {
    logs: data as LogWithRelations[],
    total: count || 0,
  };
}
```

### 4.3 로그 단일 조회

```ts
/**
 * 로그 단일 조회
 */
static async getLogById(id: string): Promise<LogWithRelations | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('logs')
    .select(
      `
      *,
      user:profiles!logs_user_id_fkey (
        email,
        name
      ),
      admin:profiles!logs_admin_id_fkey (
        email,
        name
      )
    `
    )
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('로그 조회 실패', 500, 'LOG_FETCH_FAILED');
  }

  return data as LogWithRelations | null;
}
```

### 4.4 로그 통계

```ts
/**
 * 로그 통계 조회
 */
static async getStats(options: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<{
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byDate?: Array<{ date: string; count: number }>;
}> {
  const supabase = createServerClient();
  const { dateFrom, dateTo } = options;

  // 전체 카운트
  let totalQuery = supabase
    .from('logs')
    .select('*', { count: 'exact', head: true });

  if (dateFrom) totalQuery = totalQuery.gte('created_at', dateFrom);
  if (dateTo) totalQuery = totalQuery.lte('created_at', dateTo);

  const { count: total } = await totalQuery;

  // 카테고리별 통계
  const { data: categoryData } = await supabase
    .from('logs')
    .select('event_category')
    .gte('created_at', dateFrom || '2000-01-01')
    .lte('created_at', dateTo || '2100-01-01');

  const byCategory: Record<string, number> = {};
  categoryData?.forEach((log) => {
    byCategory[log.event_category] = (byCategory[log.event_category] || 0) + 1;
  });

  // 심각도별 통계
  const { data: severityData } = await supabase
    .from('logs')
    .select('severity')
    .gte('created_at', dateFrom || '2000-01-01')
    .lte('created_at', dateTo || '2100-01-01');

  const bySeverity: Record<string, number> = {};
  severityData?.forEach((log) => {
    bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
  });

  return {
    total: total || 0,
    byCategory,
    bySeverity,
  };
}
```

---

## 5. 편의 메서드 (자주 사용하는 로그)

### 5.1 인증 로그

```ts
/**
 * 로그인 성공 로그
 */
static async logLoginSuccess(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
  await this.log({
    eventType: 'user.login.success',
    severity: 'info',
    userId,
    message: '사용자 로그인 성공',
    ipAddress,
    userAgent,
  });
}

/**
 * 로그인 실패 로그
 */
static async logLoginFailed(email: string, reason: string, ipAddress?: string): Promise<void> {
  await this.log({
    eventType: 'user.login.failed',
    severity: 'warning',
    message: `로그인 실패: ${reason}`,
    metadata: { email },
    ipAddress,
  });
}

/**
 * 회원가입 로그
 */
static async logSignup(userId: string, email: string): Promise<void> {
  await this.log({
    eventType: 'user.signup.success',
    severity: 'info',
    userId,
    message: '신규 회원 가입',
    metadata: { email },
  });
}
```

### 5.2 주문 로그

```ts
/**
 * 주문 생성 로그
 */
static async logOrderCreated(orderId: string, userId: string, totalAmount: number): Promise<void> {
  await this.log({
    eventType: 'order.created',
    severity: 'info',
    userId,
    resourceType: 'order',
    resourceId: orderId,
    message: '새로운 주문이 생성되었습니다',
    metadata: { totalAmount },
  });
}

/**
 * 주문 상태 변경 로그
 */
static async logOrderStatusChanged(
  orderId: string,
  userId: string,
  adminId: string | null,
  statusBefore: string,
  statusAfter: string
): Promise<void> {
  await this.log({
    eventType: 'order.status.changed',
    severity: 'info',
    userId,
    adminId,
    resourceType: 'order',
    resourceId: orderId,
    message: `주문 상태가 '${statusBefore}'에서 '${statusAfter}'로 변경되었습니다`,
    changes: { statusBefore, statusAfter },
  });
}
```

### 5.3 디지털 상품 다운로드 로그

```ts
/**
 * 디지털 상품 다운로드 로그
 */
static async logDigitalProductDownload(
  productId: string,
  orderId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  await this.log({
    eventType: 'digital_product.download',
    severity: 'info',
    userId,
    resourceType: 'product',
    resourceId: productId,
    message: '디지털 상품 다운로드',
    metadata: { orderId },
    ipAddress,
  });
}

/**
 * 권한 없는 다운로드 시도 로그
 */
static async logUnauthorizedDownload(
  productId: string,
  userId: string | null,
  ipAddress?: string
): Promise<void> {
  await this.log({
    eventType: 'digital_product.download.unauthorized',
    severity: 'warning',
    userId,
    resourceType: 'product',
    resourceId: productId,
    message: '권한 없는 디지털 상품 다운로드 시도',
    ipAddress,
  });
}
```

### 5.4 관리자 작업 로그

```ts
/**
 * 상품 생성 로그
 */
static async logProductCreated(productId: string, adminId: string, productName: string): Promise<void> {
  await this.log({
    eventType: 'admin.product.created',
    severity: 'info',
    adminId,
    resourceType: 'product',
    resourceId: productId,
    message: `새 상품 등록: ${productName}`,
  });
}

/**
 * 재고 변경 로그
 */
static async logStockChanged(
  productId: string,
  adminId: string,
  stockBefore: number,
  stockAfter: number
): Promise<void> {
  await this.log({
    eventType: 'admin.product.stock_updated',
    severity: 'info',
    adminId,
    resourceType: 'product',
    resourceId: productId,
    message: `재고 변경: ${stockBefore} → ${stockAfter}`,
    changes: { stockBefore, stockAfter },
  });
}
```

### 5.5 보안 로그

```ts
/**
 * 권한 없는 접근 로그
 */
static async logUnauthorizedAccess(
  userId: string | null,
  path: string,
  ipAddress?: string
): Promise<void> {
  await this.log({
    eventType: 'security.unauthorized.access',
    severity: 'warning',
    userId,
    message: `권한 없는 접근 시도: ${path}`,
    requestPath: path,
    ipAddress,
  });
}

/**
 * 의심스러운 활동 로그
 */
static async logSuspiciousActivity(
  userId: string | null,
  description: string,
  ipAddress?: string
): Promise<void> {
  await this.log({
    eventType: 'security.suspicious.activity',
    severity: 'critical',
    userId,
    message: `의심스러운 활동 감지: ${description}`,
    ipAddress,
  });
}
```

---

## 6. 사용 예시

### 6.1 로그인 시 로그 기록

```ts
// app/api/auth/login/route.ts
import { LogService } from '@/lib/server/services/log.service';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await AuthService.login(email, password);

    // 로그인 성공 로그
    await LogService.logLoginSuccess(
      user.id,
      request.ip,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ status: 'success', data: user });
  } catch (error) {
    // 로그인 실패 로그
    await LogService.logLoginFailed(
      email,
      error.message,
      request.ip
    );

    throw error;
  }
}
```

### 6.2 주문 상태 변경 시 로그 기록

```ts
// lib/server/services/order.service.ts
import { LogService } from './log.service';

export class OrderService {
  static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    adminId: string
  ) {
    const order = await this.getOrderById(orderId);
    const oldStatus = order.status;

    // 주문 상태 업데이트
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    // 로그 기록
    await LogService.logOrderStatusChanged(
      orderId,
      order.user_id,
      adminId,
      oldStatus,
      newStatus
    );
  }
}
```

---

## 7. 에러 처리

### 7.1 에러 코드

| 에러 코드 | 상태 코드 | 설명 |
|-----------|-----------|------|
| `LOG_NOT_FOUND` | 404 | 로그를 찾을 수 없음 |
| `LOG_FETCH_FAILED` | 500 | 로그 조회 실패 |

### 7.2 로그 기록 실패 정책

**중요**: 로그 기록 실패로 인해 서비스가 중단되면 안 됨

```ts
// ❌ 잘못된 예
await LogService.log(...); // 에러 발생 시 서비스 중단

// ✅ 올바른 예
await LogService.log(...); // 내부에서 try-catch 처리, 에러 발생 시 콘솔 출력만
```

---

## 8. 성능 최적화

### 8.1 비동기 로그 기록

```ts
// 로그 기록을 기다리지 않고 바로 응답
LogService.log({...}); // await 없이 호출 (fire and forget)

return NextResponse.json({ status: 'success' });
```

### 8.2 배치 로그 기록 (선택적)

```ts
/**
 * 여러 로그를 한 번에 기록 (성능 최적화)
 */
static async logBatch(logs: LogEventInput[]): Promise<void> {
  try {
    const supabase = createServerClient();

    const logData = logs.map(log => ({
      event_type: log.eventType,
      event_category: log.eventCategory || log.eventType.split('.')[0],
      severity: log.severity || 'info',
      user_id: log.userId || null,
      message: log.message,
      metadata: log.metadata || null,
      // ...
    }));

    await supabase.from('logs').insert(logData);
  } catch (error) {
    console.error('[LogService] 배치 로그 기록 실패:', error);
  }
}
```

---

## 9. 참고 문서

- Server Service 패턴: `/specs/api/server/services/index.md`
- API Routes: `/specs/api/server/routes/logs/index.md`
- Client Services: `/specs/api/client/services/logs/index.md`
- Database Types: `/types/database.ts`
