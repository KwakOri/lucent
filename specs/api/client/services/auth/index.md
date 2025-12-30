# Auth Client Services

이 문서는 **인증(Auth) Client Services** 구현을 정의한다.

> **범위**: 프론트엔드에서 인증 API를 호출하는 Client Services Layer
> **관련 문서**:
> - Client Services 패턴: `/specs/api/client/services/index.md`
> - React Query Hooks: `/specs/api/client/hooks/auth/index.md`
> - API Routes: `/specs/api/server/routes/auth/index.md`

---

## 1. 개요

**AuthAPI**는 프론트엔드에서 인증 관련 API Route를 호출하는 레이어입니다.

**위치**: `/lib/client/services/auth.api.ts`
**사용 대상**: React Query Hook에서만 호출
**역할**: API Route 호출 (fetch), 타입 안전성 보장

---

## 2. 타입 정의

### 2.1 User 타입

```ts
// lib/client/services/auth.api.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}
```

### 2.2 Session 타입

```ts
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}
```

### 2.3 입력 타입

```ts
export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SendVerificationInput {
  email: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ResetPasswordInput {
  email: string;
}

export interface UpdatePasswordInput {
  token: string;
  new_password: string;
}
```

### 2.4 응답 타입

```ts
import type { ApiResponse } from '@/lib/shared/types/api.types';

export interface AuthResponse extends ApiResponse<{ user: User }> {
  message?: string;
}
```

---

## 3. AuthAPI 구현

### 3.1 기본 구조

```ts
// lib/client/services/auth.api.ts
import { apiClient } from '@/lib/client/utils/api-client';
import type { ApiResponse } from '@/lib/shared/types/api.types';

export const AuthAPI = {
  /**
   * 이메일 인증 요청
   */
  async sendVerification(data: SendVerificationInput): Promise<ApiResponse<void>> {
    return apiClient.post('/api/auth/send-verification', data);
  },

  /**
   * 이메일 인증 확인
   */
  async verifyEmail(data: VerifyEmailInput): Promise<ApiResponse<{ email: string }>> {
    return apiClient.post('/api/auth/verify-email', data);
  },

  /**
   * 회원가입
   */
  async signUp(data: SignUpInput): Promise<AuthResponse> {
    return apiClient.post('/api/auth/signup', data);
  },

  /**
   * 로그인
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    return apiClient.post('/api/auth/login', data);
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/api/auth/logout', {});
  },

  /**
   * 세션 확인
   */
  async getSession(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/api/auth/session');
  },

  /**
   * 비밀번호 재설정 요청
   */
  async resetPassword(data: ResetPasswordInput): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/auth/reset-password', data);
  },

  /**
   * 비밀번호 변경
   */
  async updatePassword(data: UpdatePasswordInput): Promise<ApiResponse<void>> {
    return apiClient.post('/api/auth/update-password', data);
  },
};
```

---

## 4. 사용 예시

### 4.1 회원가입 플로우

```ts
import { AuthAPI } from '@/lib/client/services/auth.api';

// 1. 이메일 인증 요청
await AuthAPI.sendVerification({ email: 'user@example.com' });
// → 이메일로 인증 링크 발송

// 2. 이메일 인증 확인 (링크 클릭 후)
const verifyResult = await AuthAPI.verifyEmail({ token: 'abc123' });
console.log(verifyResult.data.email); // 'user@example.com'

// 3. 회원가입
const signUpResult = await AuthAPI.signUp({
  email: 'user@example.com',
  password: 'password123',
  name: '홍길동',
});
console.log(signUpResult.data.user); // User 정보
```

### 4.2 로그인/로그아웃

```ts
// 로그인
const loginResult = await AuthAPI.login({
  email: 'user@example.com',
  password: 'password123',
});
console.log(loginResult.data.user); // User 정보

// 세션 확인
const session = await AuthAPI.getSession();
console.log(session.data.user); // User 정보

// 로그아웃
await AuthAPI.logout();
```

### 4.3 비밀번호 재설정

```ts
// 1. 비밀번호 재설정 요청
await AuthAPI.resetPassword({ email: 'user@example.com' });
// → 이메일로 재설정 링크 발송

// 2. 비밀번호 변경 (링크 클릭 후)
await AuthAPI.updatePassword({
  token: 'reset-token',
  new_password: 'newpassword123',
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
  await AuthAPI.login({ email, password });
} catch (error) {
  if (error instanceof ApiError) {
    if (error.errorCode === 'INVALID_CREDENTIALS') {
      toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
    } else if (error.errorCode === 'EMAIL_ALREADY_EXISTS') {
      toast.error('이미 사용 중인 이메일입니다');
    } else if (error.statusCode === 429) {
      toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    } else {
      toast.error(error.message);
    }
  }
}
```

---

## 6. 응답 형식

### 6.1 성공 응답

```ts
{
  status: 'success',
  data: {
    user: {
      id: string,
      email: string,
      name: string | null,
      created_at: string
    }
  },
  message?: string
}
```

### 6.2 에러 응답

```ts
{
  status: 'error',
  message: string,
  errorCode?: string
}
```

---

## 7. 세션 관리

### 7.1 자동 세션 관리

세션은 HTTP-only cookie에 저장되므로 클라이언트에서 별도 관리가 불필요합니다:

```tsx
// App.tsx
function App() {
  const { data: session } = useSession();

  if (!session) {
    return <LoginPage />;
  }

  return <Dashboard user={session.data.user} />;
}
```

### 7.2 세션 확인

페이지 로드 시 자동으로 세션 확인:

```ts
// lib/client/hooks/useSession.ts
export function useSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => AuthAPI.getSession(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5분
  });
}
```

---

## 8. 타입 안전성

### 8.1 TypeScript 타입 체크

모든 API 메서드는 타입 안전성을 보장합니다:

```ts
// ✅ 올바른 사용
const signUpData: SignUpInput = {
  email: 'user@example.com',
  password: 'password123',
  name: '홍길동',
};

// ❌ 컴파일 에러
const invalid: SignUpInput = {
  email: 'user@example.com',
  // password 누락!
};
```

### 8.2 응답 타입 추론

```ts
const result = await AuthAPI.login(data);
// result.data.user는 User 타입

const session = await AuthAPI.getSession();
// session.data.user는 User 타입
```

---

## 9. 인증 상태 타입

```ts
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

// 인증 상태 헬퍼
export function getAuthStatus(session: any, isLoading: boolean): AuthStatus {
  if (isLoading) return 'loading';
  if (session?.data?.user) return 'authenticated';
  return 'unauthenticated';
}
```

---

## 10. 에러 코드

| 에러 코드 | HTTP Status | 설명 |
|-----------|-------------|------|
| `EMAIL_ALREADY_EXISTS` | 400 | 이미 사용 중인 이메일 |
| `INVALID_TOKEN` | 400 | 유효하지 않은 토큰 |
| `TOKEN_EXPIRED` | 400 | 만료된 토큰 |
| `TOKEN_ALREADY_USED` | 400 | 이미 사용된 토큰 |
| `INVALID_PASSWORD` | 400 | 비밀번호 형식 오류 |
| `INVALID_CREDENTIALS` | 401 | 잘못된 이메일/비밀번호 |
| `UNAUTHORIZED` | 401 | 인증 필요 |

---

## 11. 참고 문서

- Client Services 패턴: `/specs/api/client/services/index.md`
- React Query Hooks: `/specs/api/client/hooks/auth/index.md`
- API Routes: `/specs/api/server/routes/auth/index.md`
- API 공통 타입: `/lib/shared/types/api.types.ts`
