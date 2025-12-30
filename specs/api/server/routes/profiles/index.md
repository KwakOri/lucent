# Profiles API Routes

이 문서는 **프로필(Profiles) API Route** 엔드포인트를 정의한다.

> **범위**: Next.js API Route 엔드포인트 (HTTP 인터페이스)
> **관련 문서**:
> - Server Service: `/specs/api/server/services/profiles/index.md`
> - Client Services: `/specs/api/client/services/profiles/index.md`
> - React Query Hooks: `/specs/api/client/hooks/profiles/index.md`

---

## 1. 프로필 시스템 개요

- **목적**: 사용자의 추가 정보 관리 (auth.users 확장)
- **자동 생성**: 회원가입 시 자동으로 profiles 레코드 생성
- **주요 정보**: 이름, 연락처, 주소 (배송 정보 기본값)
- **권한**: 본인만 조회/수정 가능

---

## 2. API 엔드포인트

### 2.1 내 프로필 조회

```
GET /api/profiles/me
```

**인증**: 필수 (JWT 토큰)

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "address": "서울시 강남구 테헤란로 123",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

### 2.2 내 프로필 수정

```
PATCH /api/profiles/me
Content-Type: application/json
```

**인증**: 필수 (JWT 토큰)

**Request Body**:
```json
{
  "name": "홍길동",
  "phone": "010-9876-5432",
  "address": "서울시 서초구 강남대로 456"
}
```

**수정 가능한 필드**:
- ✅ `name`: 사용자 이름
- ✅ `phone`: 연락처
- ✅ `address`: 기본 주소
- ❌ `email`: 수정 불가 (auth.users에서 관리)
- ❌ `id`: 수정 불가

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-9876-5432",
    "address": "서울시 서초구 강남대로 456",
    "updated_at": "2025-01-15T11:00:00Z"
  },
  "message": "프로필이 업데이트되었습니다."
}
```

---

## 3. 에러 응답

### 3.1 인증되지 않은 사용자

```json
{
  "status": "error",
  "message": "로그인이 필요합니다",
  "errorCode": "UNAUTHORIZED"
}
```

**Status Code**: `401 Unauthorized`

### 3.2 프로필을 찾을 수 없음

```json
{
  "status": "error",
  "message": "프로필을 찾을 수 없습니다",
  "errorCode": "PROFILE_NOT_FOUND"
}
```

**Status Code**: `404 Not Found`

### 3.3 검증 에러

```json
{
  "status": "error",
  "message": "입력값이 올바르지 않습니다.",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "phone": "연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)",
    "name": "이름은 2자 이상이어야 합니다."
  }
}
```

**Status Code**: `400 Bad Request`

---

## 4. 구현 예시

### 4.1 내 프로필 조회

```ts
// app/api/profiles/me/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/server/utils/supabase';
import { ProfileService } from '@/lib/server/services/profile.service';
import { handleApiError } from '@/lib/server/utils/api-response';
import { ApiError } from '@/lib/server/utils/errors';

export async function GET() {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError('로그인이 필요합니다', 401, 'UNAUTHORIZED');
    }

    const profile = await ProfileService.getProfile(user.id);

    if (!profile) {
      throw new ApiError('프로필을 찾을 수 없습니다', 404, 'PROFILE_NOT_FOUND');
    }

    return NextResponse.json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 4.2 내 프로필 수정

```ts
// app/api/profiles/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/server/utils/supabase';
import { ProfileService } from '@/lib/server/services/profile.service';
import { handleApiError } from '@/lib/server/utils/api-response';
import { ApiError } from '@/lib/server/utils/errors';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new ApiError('로그인이 필요합니다', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();

    // ID, email 제거 (수정 불가)
    const { id, email, ...updateData } = body;

    const updatedProfile = await ProfileService.updateProfile(user.id, updateData);

    return NextResponse.json({
      status: 'success',
      data: updatedProfile,
      message: '프로필이 업데이트되었습니다.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 5. 1차 MVP 범위

### 포함

- ✅ 내 프로필 조회
- ✅ 내 프로필 수정 (name, phone, address)
- ✅ 주문 생성 시 프로필 정보 활용

### 제외 (2차 확장)

- ⏸️ 이메일 변경
- ⏸️ 프로필 이미지 업로드
- ⏸️ 추가 정보 (생년월일, 성별 등)
- ⏸️ 배송지 여러 개 관리
- ⏸️ 프로필 삭제 (회원 탈퇴)

---

## 6. 참고 문서

- Server Service: `/specs/api/server/services/profiles/index.md`
- Client Services: `/specs/api/client/services/profiles/index.md`
- React Query Hooks: `/specs/api/client/hooks/profiles/index.md`
- API Routes 패턴: `/specs/api/server/routes/index.md`
