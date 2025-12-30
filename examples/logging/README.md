# 로깅 시스템 구현 가이드

이 폴더는 Lucent Management 프로젝트의 로깅 시스템 구현 예시를 포함합니다.

## 📋 구현된 항목

### 1. 데이터베이스 스키마
- **파일**: `/supabase/migrations/create_logs_table.sql`
- **내용**: logs 테이블 생성 및 인덱스 설정

### 2. 서버 유틸리티
- **파일**: `/lib/server/utils/`
  - `supabase.ts` - Supabase 서버 클라이언트
  - `errors.ts` - 에러 클래스 정의
  - `api-response.ts` - API 응답 헬퍼

### 3. 로그 서비스
- **파일**: `/lib/server/services/log.service.ts`
- **기능**:
  - 로그 기록 (절대 에러를 던지지 않음)
  - 로그 목록 조회 (필터링, 페이지네이션)
  - 로그 단일 조회
  - 로그 통계
  - 편의 메서드 (인증, 주문, 다운로드, 보안)

### 4. API Routes
- **파일**: `/app/api/logs/`
  - `route.ts` - GET /api/logs (목록 조회)
  - `[id]/route.ts` - GET /api/logs/:id (단일 조회)
  - `stats/route.ts` - GET /api/logs/stats (통계)

### 5. 예시 코드
- **파일**: `/examples/logging/`
  - `auth-api-example.ts` - 인증 API 로깅 예시
  - `order-api-example.ts` - 주문 API 로깅 예시
  - `download-api-example.ts` - 다운로드 API 로깅 예시
  - `security-example.ts` - 보안 이벤트 로깅 예시

---

## 🚀 시작하기

### Step 1: 데이터베이스 마이그레이션

Supabase 대시보드에서 SQL 실행:

```bash
# 1. Supabase Dashboard 접속
# 2. SQL Editor 열기
# 3. supabase/migrations/create_logs_table.sql 파일 내용 복사
# 4. 실행
```

### Step 2: 환경변수 설정

`.env.local` 파일에 다음 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 관리자 이메일 (쉼표로 구분)
ADMIN_EMAILS=admin@example.com,manager@example.com
```

### Step 3: 타입 재생성 (선택적)

Supabase CLI로 타입 재생성:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

---

## 📝 사용 방법

### 인증 이벤트 로깅

```typescript
import { LogService } from '@/lib/server/services/log.service';

// 로그인 성공
await LogService.logLoginSuccess(
  userId,
  request.ip,
  request.headers.get('user-agent') || undefined
);

// 로그인 실패
await LogService.logLoginFailed(
  email,
  '잘못된 비밀번호',
  request.ip
);

// 회원가입
await LogService.logSignupSuccess(userId, email, request.ip);
```

### 주문 이벤트 로깅

```typescript
// 주문 생성
await LogService.logOrderCreated(orderId, userId, totalAmount, {
  productNames: '미루루 보이스팩 Vol.1',
  itemCount: 2,
});

// 주문 상태 변경
await LogService.logOrderStatusChanged(
  orderId,
  userId,
  adminId,
  'PENDING',
  'PAID'
);

// 환불 요청
await LogService.logRefundRequested(orderId, userId, '단순 변심');
```

### 디지털 상품 다운로드 로깅

```typescript
// 다운로드
await LogService.logDigitalProductDownload(
  productId,
  orderId,
  userId,
  request.ip,
  { productName: '미루루 보이스팩 Vol.1' }
);

// 권한 없는 다운로드 시도
await LogService.logUnauthorizedDownload(
  productId,
  userId,
  request.ip
);
```

### 보안 이벤트 로깅

```typescript
// 권한 없는 접근
await LogService.logUnauthorizedAccess(
  userId,
  '/api/admin/products',
  request.ip
);

// Rate Limit 초과
await LogService.logRateLimitExceeded(
  userId,
  '/api/products',
  request.ip
);

// 의심스러운 활동
await LogService.logSuspiciousActivity(
  userId,
  '5분 내 10회 다운로드 시도',
  request.ip,
  { productId, downloadCount: 10 }
);
```

---

## 🔍 로그 조회 (관리자)

### API 호출 예시

```bash
# 로그 목록 조회
GET /api/logs?page=1&limit=50&filter[event_category]=auth&filter[severity]=warning

# 로그 단일 조회
GET /api/logs/{log-id}

# 로그 통계
GET /api/logs/stats?date_from=2025-01-01&date_to=2025-01-31
```

### 응답 예시

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "event_type": "user.login.failed",
      "event_category": "auth",
      "severity": "warning",
      "user_id": null,
      "message": "로그인 실패: 잘못된 비밀번호",
      "metadata": {
        "email": "user@example.com",
        "reason": "잘못된 비밀번호"
      },
      "ip_address": "127.0.0.1",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

---

## 📊 로그 이벤트 타입

### 인증 (auth)
- `user.signup.success` - 회원가입 성공
- `user.signup.failed` - 회원가입 실패
- `user.login.success` - 로그인 성공
- `user.login.failed` - 로그인 실패
- `user.logout` - 로그아웃
- `user.email_verification.sent` - 이메일 인증 발송
- `user.email_verification.success` - 이메일 인증 성공
- `user.email_verification.failed` - 이메일 인증 실패
- `user.password_reset.requested` - 비밀번호 재설정 요청
- `user.password_reset.success` - 비밀번호 재설정 성공
- `user.password_reset.failed` - 비밀번호 재설정 실패

### 주문 (order)
- `order.created` - 주문 생성
- `order.status.pending` - 입금대기
- `order.status.paid` - 입금확인
- `order.status.making` - 제작중
- `order.status.shipping` - 배송중
- `order.status.done` - 완료
- `order.cancelled` - 주문 취소
- `order.refund.requested` - 환불 요청
- `order.refund.approved` - 환불 승인
- `order.refund.completed` - 환불 완료

### 디지털 상품 (download)
- `digital_product.download` - 다운로드
- `digital_product.download_link_generated` - 링크 생성
- `digital_product.download.unauthorized` - 권한 없는 다운로드 시도
- `digital_product.download.expired` - 만료된 링크 접근

### 보안 (security)
- `security.unauthorized.access` - 권한 없는 접근
- `security.rate_limit.exceeded` - API 호출 제한 초과
- `security.suspicious.activity` - 의심스러운 활동 감지

---

## ⚙️ 중요 사항

### 1. 로그 기록은 절대 서비스를 중단시키지 않음

```typescript
// LogService.log() 메서드는 내부적으로 try-catch 처리
// 로그 기록 실패 시 콘솔에만 출력하고 에러를 던지지 않음
await LogService.log({ ... }); // 안전하게 호출 가능
```

### 2. 성능 최적화: Fire and Forget

```typescript
// await 없이 호출하면 로그 기록을 기다리지 않고 바로 응답 가능
LogService.logLoginSuccess(userId, request.ip); // await 생략 가능

return NextResponse.json({ status: 'success' });
```

### 3. 민감 정보 주의

```typescript
// ❌ 비밀번호 같은 민감 정보는 절대 로그에 포함하지 말 것
await LogService.log({
  metadata: { password: '...' }, // 절대 금지!
});

// ✅ 이메일, 이벤트 설명 등만 포함
await LogService.log({
  metadata: { email: 'user@example.com', reason: '...' },
});
```

---

## 🎯 다음 단계

1. **실제 API 구현 시** 이 예시 코드를 참고하여 로깅 적용
2. **관리자 대시보드** 구현 시 로그 조회 API 활용
3. **보안 모니터링** 시스템 구축 (2차 확장)
4. **로그 분석 및 알림** 기능 추가 (2차 확장)

---

## 📚 참고 문서

- 스펙 문서: `/specs/api/server/services/logs/index.md`
- API Routes 스펙: `/specs/api/server/routes/logs/index.md`
- 예시 코드: `/examples/logging/`
