# Profile Service

이 문서는 **프로필(Profile) Server Service** 구현을 정의한다.

> **범위**: 프로필 관련 비즈니스 로직 및 DB 접근
> **관련 문서**:
> - Server Service 패턴: `/specs/api/server/services/index.md`
> - API Routes: `/specs/api/server/routes/profiles/index.md`
> - Database Types: `/types/database.ts`

---

## 1. 개요

**ProfileService**는 사용자 프로필 관련 모든 비즈니스 로직과 데이터베이스 접근을 담당한다.

**위치**: `/lib/server/services/profile.service.ts`
**사용 대상**: API Route에서만 호출
**역할**: 프로필 조회, 수정, 검증

---

## 2. 데이터 모델

### 2.1 Profile 타입

```ts
import { Tables, TablesUpdate } from '@/types/database';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;
```

### 2.2 Profile 구조

```ts
interface Profile {
  id: string; // auth.users.id와 동일
  email: string; // auth.users.email과 동기화
  name: string | null; // 사용자 이름
  phone: string | null; // 연락처 (형식: 010-1234-5678)
  address: string | null; // 기본 배송 주소
  created_at: string;
  updated_at: string;
}
```

---

## 3. ProfileService 클래스

### 3.1 기본 구조

```ts
// lib/server/services/profile.service.ts
import { createServerClient } from '@/lib/server/utils/supabase';
import { Tables, TablesUpdate } from '@/types/database';
import { ApiError } from '@/lib/server/utils/errors';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
}

export class ProfileService {
  // 메서드 구현...
}
```

---

## 4. 주요 메서드

### 4.1 프로필 조회

```ts
/**
 * 사용자 프로필 조회
 */
static async getProfile(userId: string): Promise<Profile | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('프로필 조회 실패', 500, 'PROFILE_FETCH_FAILED');
  }

  return data;
}
```

### 4.2 프로필 수정

```ts
/**
 * 프로필 수정
 */
static async updateProfile(
  userId: string,
  updateData: UpdateProfileInput
): Promise<Profile> {
  const supabase = createServerClient();

  // 검증
  this.validateProfileData(updateData);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new ApiError('프로필 업데이트 실패', 500, 'PROFILE_UPDATE_FAILED');
  }

  return data;
}
```

### 4.3 프로필 데이터 검증

```ts
/**
 * 프로필 데이터 검증
 */
static validateProfileData(data: UpdateProfileInput): void {
  const errors: Record<string, string> = {};

  // 이름 검증
  if (data.name !== undefined) {
    if (data.name.length < 2) {
      errors.name = '이름은 2자 이상이어야 합니다.';
    } else if (data.name.length > 100) {
      errors.name = '이름은 100자를 초과할 수 없습니다.';
    } else if (!/^[가-힣a-zA-Z\s]+$/.test(data.name)) {
      errors.name = '이름은 한글, 영문, 공백만 사용할 수 있습니다.';
    }
  }

  // 연락처 검증
  if (data.phone !== undefined && data.phone !== null) {
    if (!/^010-\d{4}-\d{4}$/.test(data.phone)) {
      errors.phone = '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)';
    }
  }

  // 주소 검증
  if (data.address !== undefined && data.address !== null) {
    if (data.address.length > 500) {
      errors.address = '주소는 500자를 초과할 수 없습니다.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError('입력값이 올바르지 않습니다.', 400, 'VALIDATION_ERROR', errors);
  }
}
```

### 4.4 프로필 생성 (회원가입 시)

```ts
/**
 * 프로필 생성 (회원가입 시 자동 호출)
 */
static async createProfile(userId: string, email: string): Promise<Profile> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
    })
    .select()
    .single();

  if (error) {
    throw new ApiError('프로필 생성 실패', 500, 'PROFILE_CREATE_FAILED');
  }

  return data;
}
```

---

## 5. 검증 규칙

### 5.1 이름 검증

```ts
const nameValidation = {
  minLength: 2,
  maxLength: 100,
  pattern: /^[가-힣a-zA-Z\s]+$/, // 한글, 영문, 공백만
};
```

**예시**:
- ✅ "홍길동"
- ✅ "John Doe"
- ✅ "김 철수"
- ❌ "홍" (너무 짧음)
- ❌ "홍길동123" (숫자 포함)
- ❌ "홍길동!" (특수문자 포함)

### 5.2 연락처 검증

```ts
const phoneValidation = {
  pattern: /^010-\d{4}-\d{4}$/, // 010-1234-5678 형식
};
```

**예시**:
- ✅ "010-1234-5678"
- ❌ "01012345678" (하이픈 없음)
- ❌ "010-123-4567" (자릿수 틀림)
- ❌ "02-1234-5678" (지역번호)

### 5.3 주소 검증

```ts
const addressValidation = {
  maxLength: 500,
};
```

---

## 6. 프로필과 주문 연동

### 6.1 주문 생성 시 프로필 정보 활용

```ts
/**
 * 주문 생성 시 프로필 정보를 배송 정보 기본값으로 사용
 * (OrderService에서 호출)
 */
static async getProfileForOrder(userId: string): Promise<{
  name: string | null;
  phone: string | null;
  address: string | null;
}> {
  const profile = await this.getProfile(userId);

  if (!profile) {
    return { name: null, phone: null, address: null };
  }

  return {
    name: profile.name,
    phone: profile.phone,
    address: profile.address,
  };
}
```

### 6.2 사용 예시 (OrderService)

```ts
// lib/server/services/order.service.ts
import { ProfileService } from './profile.service';

class OrderService {
  static async createOrder(userId: string, orderData: CreateOrderInput) {
    // 프로필에서 배송 정보 기본값 가져오기
    const profileInfo = await ProfileService.getProfileForOrder(userId);

    const order = {
      user_id: userId,
      shipping_name: orderData.shipping_name || profileInfo.name || '',
      shipping_phone: orderData.shipping_phone || profileInfo.phone || '',
      shipping_address: orderData.shipping_address || profileInfo.address || '',
      // ...
    };

    // 주문 생성
  }
}
```

---

## 7. 에러 처리

### 7.1 에러 코드

| 에러 코드 | 상태 코드 | 설명 |
|-----------|-----------|------|
| `PROFILE_NOT_FOUND` | 404 | 프로필을 찾을 수 없음 |
| `PROFILE_FETCH_FAILED` | 500 | 프로필 조회 실패 |
| `PROFILE_UPDATE_FAILED` | 500 | 프로필 업데이트 실패 |
| `PROFILE_CREATE_FAILED` | 500 | 프로필 생성 실패 |
| `VALIDATION_ERROR` | 400 | 입력값 검증 실패 |

### 7.2 검증 에러 예시

```ts
throw new ApiError(
  '입력값이 올바르지 않습니다.',
  400,
  'VALIDATION_ERROR',
  {
    phone: '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)',
    name: '이름은 2자 이상이어야 합니다.',
  }
);
```

---

## 8. 보안 고려사항

### 8.1 ID 변경 방지

- `id`는 PRIMARY KEY이자 auth.users 참조
- UPDATE 시 `id` 필드는 무시됨
- API Route에서 userId는 JWT 토큰에서 추출

### 8.2 이메일 변경 제한

- 프로필 API에서는 이메일 변경 불가
- 이메일 변경은 별도 인증 플로우 필요 (2차 확장)
- `auth.users.email` 변경 후 `profiles.email` 자동 동기화

---

## 9. 참고 문서

- Server Service 패턴: `/specs/api/server/services/index.md`
- API Routes: `/specs/api/server/routes/profiles/index.md`
- Client Services: `/specs/api/client/services/profiles/index.md`
- Database Types: `/types/database.ts`
