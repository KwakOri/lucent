# Profiles Client Services

이 문서는 **프로필(Profiles) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 프로필 API를 호출하는 Client Services Layer
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/profiles/index.md`
> - API Routes: `/specs/api/server/routes/profiles/index.md`

---

## 1. 개요

**ProfilesAPI**는 프론트엔드에서 프로필 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/profiles.api.ts`
**사용 대상**: React Query Hook에서만 호출
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 Profile 타입

```ts
// lib/client/services/profiles.api.ts
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}
```

### 2.2 수정 입력 타입

```ts
export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
}
```

---

## 3. ProfilesAPI 구현

```ts
// lib/client/services/profiles.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse } from '@/lib/shared/types/api.types';

export const ProfilesAPI = {
  /**
   * 내 프로필 조회
   */
  async getMyProfile(): Promise<ApiResponse<Profile>> {
    return apiClient.get('/api/profiles/me');
  },

  /**
   * 내 프로필 수정
   */
  async updateMyProfile(data: UpdateProfileInput): Promise<ApiResponse<Profile>> {
    return apiClient.patch('/api/profiles/me', data);
  },
};
```

---

## 4. 사용 예시

### 4.1 내 프로필 조회

```ts
import { ProfilesAPI } from '@/lib/client/services/profiles.api';

// 프로필 조회
const response = await ProfilesAPI.getMyProfile();
console.log(response.data); // Profile
```

### 4.2 내 프로필 수정

```ts
// 프로필 수정
const response = await ProfilesAPI.updateMyProfile({
  name: '홍길동',
  phone: '010-1234-5678',
  address: '서울시 강남구 테헤란로 123',
});

console.log(response.data); // 수정된 Profile
console.log(response.message); // "프로필이 업데이트되었습니다."
```

---

## 5. 에러 처리

### 5.1 인증 에러

```ts
try {
  const profile = await ProfilesAPI.getMyProfile();
} catch (error) {
  // 401 Unauthorized
  if (error.statusCode === 401) {
    // 로그인 페이지로 리다이렉트
  }
}
```

### 5.2 검증 에러

```ts
try {
  await ProfilesAPI.updateMyProfile({
    name: '홍',
    phone: '010-123-4567',
  });
} catch (error) {
  // 400 Bad Request
  if (error.errorCode === 'VALIDATION_ERROR') {
    console.log(error.errors);
    // {
    //   name: "이름은 2자 이상이어야 합니다.",
    //   phone: "연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)"
    // }
  }
}
```

---

## 6. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/profiles/index.md`
- API Routes: `/specs/api/server/routes/profiles/index.md`
