# Auth – Logout Spec

이 문서는 **로그아웃(Logout)** API 스펙을 정의한다.

---

## 1. 기본 원칙

- 로그아웃은 서버에서 세션을 무효화한다
- HTTP-only cookie를 삭제하여 클라이언트 세션 종료
- 로그아웃은 인증된 사용자만 호출 가능

---

## 2. API 스펙

### 2.1 엔드포인트

```
POST /api/auth/logout
```

### 2.2 인증

- **필수**: Bearer Token (JWT) 또는 Cookie 세션
- 인증되지 않은 요청은 401 반환

### 2.3 요청

**Headers**

```
Authorization: Bearer {access_token}
Cookie: sb-access-token={token}
```

**Body**

- 없음

### 2.4 응답

**성공 (200 OK)**

```json
{
  "status": "success",
  "message": "로그아웃되었습니다"
}
```

**실패 (401 Unauthorized)**

```json
{
  "status": "error",
  "message": "인증이 필요합니다",
  "errorCode": "UNAUTHORIZED"
}
```

---

## 3. 처리 로직

### 3.1 서버 처리 흐름

```
1. 세션 유효성 확인
   ↓
2. Supabase Auth 로그아웃 호출
   ↓
3. HTTP-only cookie 삭제
   ↓
4. 성공 응답 반환
```

### 3.2 구현 예시

```ts
// app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return Response.json(
      {
        status: 'error',
        message: '로그아웃 처리 중 오류가 발생했습니다',
        errorCode: 'LOGOUT_FAILED'
      },
      { status: 500 }
    );
  }

  // HTTP-only cookie 삭제
  cookies().delete('sb-access-token');
  cookies().delete('sb-refresh-token');

  return Response.json({
    status: 'success',
    message: '로그아웃되었습니다'
  });
}
```

---

## 4. 클라이언트 처리

### 4.1 Service Layer

```ts
// services/auth.service.ts
export class AuthService {
  static async logout(): Promise<ApiResponse<void>> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    return response.json();
  }
}
```

### 4.2 React Query Hook

```ts
// hooks/auth/useLogout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      // 모든 쿼리 캐시 초기화
      queryClient.clear();
      // 로그인 페이지로 리다이렉트
      router.push('/login');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    }
  });
};
```

### 4.3 사용 예시

```tsx
// components/Header.tsx
import { useLogout } from '@/hooks/auth/useLogout';

export const Header = () => {
  const { mutate: logout, isPending } = useLogout();

  return (
    <button
      onClick={() => logout()}
      disabled={isPending}
    >
      {isPending ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
};
```

---

## 5. 보안 고려사항

### 5.1 CSRF 방지

- POST 요청으로만 처리
- SameSite cookie 속성 활용

### 5.2 세션 무효화

- 서버에서 세션 완전히 제거
- 클라이언트 쿠키 삭제

### 5.3 로그아웃 후 처리

- 클라이언트에서 모든 인증 관련 상태 초기화
- React Query 캐시 전체 삭제
- 보호된 페이지에서 자동 리다이렉트

---

## 6. 에러 케이스

| 상황                  | HTTP Status | errorCode       | 메시지                              |
| --------------------- | ----------- | --------------- | ----------------------------------- |
| 세션 없음             | 401         | UNAUTHORIZED    | 인증이 필요합니다                   |
| Supabase 에러         | 500         | LOGOUT_FAILED   | 로그아웃 처리 중 오류가 발생했습니다 |
| 네트워크 에러         | 500         | NETWORK_ERROR   | 서버 접속이 원활하지 않습니다       |

---

## 7. 확장 고려사항

- 로그아웃 이력 기록
- 모든 디바이스에서 로그아웃 기능
- 로그아웃 전 확인 다이얼로그 (선택적)
